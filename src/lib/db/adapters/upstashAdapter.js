/**
 * Upstash Redis-backed SQLite adapter — primary serverless persistence for 9Router.
 *
 * Runs the DB in memory via sql.js (no native deps) and persists the whole blob
 * to an Upstash Redis REST instance (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 * so dashboard state survives Vercel cold starts AND is shared across serverless
 * instances. Mirrors the KV adapter's design but targets Upstash's Redis API
 * (GET/SET with base64-encoded blob).
 *
 * Writes are debounced, then flushed synchronously via a child `node` process
 * (process.execPath is guaranteed present on Vercel) so the blob lands before the
 * lambda freezes — an async fire-and-forget fetch can be cut off mid-flight and
 * silently lose the write (the "settings revert / Token Saver off again" bug).
 *
 * Fail-open: if Upstash is unreachable, the caller (driver.js) falls through to
 * Supabase → KV → in-memory. If only the write fails, we stay in-memory for the
 * rest of the instance's life rather than hammering the endpoint.
 */
import initSqlJs from "sql.js";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { PRAGMA_SQL } from "../schema.js";

let SQL = null;
async function loadSql() {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

const DB_REDIS_KEY = "9router:db";

function detectUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url: String(url).replace(/\/+$/, ""), token: String(token) };
  return null;
}

async function redisGet(up, key) {
  const res = await fetch(`${up.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${up.token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const parsed = await res.json();
  if (!(parsed && typeof parsed.result === "string" && parsed.result.length)) return null;
  // Primary path: blob was written base64-encoded (matches redisSetSync).
  const b64 = Buffer.from(parsed.result, "base64");
  // Guard against a legacy/corrupt blob that was stored as raw bytes: a valid
  // SQLite file starts with "SQLite format 3". If base64-decoded bytes don't,
  // try the raw string bytes instead so we never hard-fail the adapter.
  const isSqlite = b64.length >= 16 && b64.slice(0, 15).toString("latin1") === "SQLite format 3";
  if (isSqlite) return new Uint8Array(b64);
  const raw = Buffer.from(parsed.result, "latin1");
  if (raw.length >= 16 && raw.slice(0, 15).toString("latin1") === "SQLite format 3") {
    return new Uint8Array(raw);
  }
  return null; // neither variant is a valid DB → caller starts fresh
}

// Synchronous Redis SET via child node process (see vercelAdapter kvWriteSync /
// supabaseAdapter sbWriteSync for why sync is required on Vercel).
function redisSetSync(up, key, bytes) {
  // Base64-encode the binary SQLite blob before sending. Upstash REST stores
  // the body verbatim, and redisGet() base64-decodes on read — so the write
  // MUST be base64 too, otherwise the read yields garbage ("file is not a
  // database") and the whole adapter falls back to in-memory (data loss).
  const b64 = Buffer.from(bytes).toString("base64");
  const url = `${up.url}/set/${encodeURIComponent(key)}`;
  // The blob is piped via stdin (NOT argv) to avoid E2BIG: a base64 SQLite
  // blob grows beyond the OS argv limit quickly, and spawnSync would then
  // throw E2BIG and silently lose the write.
  const script = `
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => {
      const b64 = Buffer.concat(chunks).toString("utf8");
      (async () => {
        const res = await fetch(process.argv[1], {
          method: "POST",
          headers: { Authorization: "Bearer " + process.argv[2], "Content-Type": "text/plain" },
          body: b64,
        });
        if (!res.ok) { console.error("HTTP " + res.status); process.exit(1); }
      })().catch((e) => { console.error(e.message); process.exit(1); });
    });
  `;
  try {
    execFileSync(
      process.execPath,
      ["-e", script, url, up.token],
      { input: b64, stdio: ["pipe", "ignore", "pipe"], timeout: 10000 }
    );
  } catch (e) {
    throw e;
  }
}

export async function createUpstashAdapter() {
  const SQLLib = await loadSql();
  const up = detectUpstash();
  if (!up) {
    throw new Error("Upstash not configured (need UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)");
  }

  let db;
  if (up) {
    try {
      const bytes = await redisGet(up, DB_REDIS_KEY);
      if (bytes) db = new SQLLib.Database(bytes);
    } catch (e) {
      console.warn(`[DB/Upstash] Failed to load DB from Redis (starting fresh): ${e.message}`);
    }
  }
  if (!db) db = new SQLLib.Database();
  db.exec(PRAGMA_SQL);

  const adapter = {
    driver: "vercel-upstash",
    _upstash: up,
    _seeding: false,
    _lastPersistError: null,
    run, get, all, exec, transaction, close, raw: db,
  };

  let _persistPending = false;
  let _persistTimer = null;
  const PERSIST_DEBOUNCE_MS = 200;

  function persistNow() {
    if (!adapter._upstash || adapter._seeding) return;
    try {
      redisSetSync(adapter._upstash, DB_REDIS_KEY, db.export());
      adapter._lastPersistError = null;
    } catch (e) {
      adapter._lastPersistError = e.message;
      console.warn(`[DB/Upstash] Failed to persist DB to Redis: ${e.message}`);
    }
  }
  adapter._persist = persistNow;

  function scheduleSave() {
    if (!adapter._upstash || adapter._seeding) return;
    _persistPending = true;
    if (_persistTimer) return;
    _persistTimer = setTimeout(() => {
      _persistTimer = null;
      if (_persistPending) {
        _persistPending = false;
        persistNow();
      }
    }, PERSIST_DEBOUNCE_MS);
  }

  function paramsObj(params) {
    if (!params || (Array.isArray(params) && params.length === 0)) return undefined;
    return params;
  }

  function run(sql, params = []) {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(paramsObj(params));
      stmt.step();
      const changes = db.getRowsModified();
      const lastInsertRowid = db.exec("SELECT last_insert_rowid() as id")[0]?.values?.[0]?.[0] ?? null;
      scheduleSave();
      return { changes, lastInsertRowid };
    } finally { stmt.free(); }
  }

  function get(sql, params = []) {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(paramsObj(params));
      if (stmt.step()) return stmt.getAsObject();
      return undefined;
    } finally { stmt.free(); }
  }

  function all(sql, params = []) {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(paramsObj(params));
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally { stmt.free(); }
  }

  function exec(sql) { db.exec(sql); scheduleSave(); }

  function transaction(fn) {
    const sp = `sp_${Math.random().toString(36).slice(2)}`;
    db.exec(`SAVEPOINT ${sp}`);
    try {
      const result = fn();
      try { db.exec(`RELEASE ${sp}`); } catch {}
      scheduleSave();
      return result;
    } catch (e) {
      try { db.exec(`ROLLBACK TO ${sp}`); db.exec(`RELEASE ${sp}`); } catch {}
      throw e;
    }
  }

  function close() { db.close(); }

  // ─── Cross-instance re-sync ────────────────────────────────────────────
  // Many serverless instances share ONE Redis blob but each keeps its own
  // in-memory sql.js copy. Re-pull (throttled, byte-compared) so a write on one
  // instance is visible to others and toggles/usage don't "revert".
  const SYNC_TTL_MS = 0;
  let _lastSyncCheck = 0;
  let _syncPromise = null;
  async function syncRemote(force = false) {
    if (!adapter._upstash || adapter._seeding) return;
    const now = Date.now();
    if (!force && now - _lastSyncCheck < SYNC_TTL_MS) return;
    if (_syncPromise) { try { await _syncPromise; } catch {} return; }
    _syncPromise = (async () => {
      try {
        const bytes = await redisGet(adapter._upstash, DB_REDIS_KEY);
        if (!bytes) { _lastSyncCheck = Date.now(); return; }
        const current = db.export();
        if (bytes.length === current.length && bytes.every((b, i) => b === current[i])) {
          _lastSyncCheck = Date.now();
          return;
        }
        const newDb = new SQLLib.Database(bytes);
        newDb.exec(PRAGMA_SQL);
        const old = db;
        db = newDb;
        try { old.close(); } catch {}
        _lastSyncCheck = Date.now();
      } catch (e) {
        _lastSyncCheck = Date.now();
        console.warn(`[DB/Upstash] re-sync skipped: ${e.message}`);
      }
    })();
    try { await _syncPromise; } finally { _syncPromise = null; }
  }
  adapter._syncRemote = syncRemote;

  // Flush pending writes synchronously before the lambda returns / on shutdown.
  function flush() {
    if (_persistTimer) { clearTimeout(_persistTimer); _persistTimer = null; }
    if (_persistPending) {
      _persistPending = false;
      persistNow();
    }
  }
  adapter._flush = flush;

  process.on("beforeExit", () => { flush(); });
  process.on("SIGINT", () => { flush(); process.exit(0); });
  process.on("SIGTERM", () => { flush(); process.exit(0); });

  return adapter;
}
