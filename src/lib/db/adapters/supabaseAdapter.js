/**
 * Supabase-backed SQLite adapter — runs in memory via sql.js and persists the
 * whole DB blob to Supabase Storage so dashboard state (connections, combos,
 * API keys, settings, usage) survives Vercel cold starts AND is shared across
 * serverless instances. Zero native deps: talks to Supabase REST with fetch.
 *
 * If Supabase is unconfigured it throws (caller falls through to the next
 * adapter). If a write fails (network error / quota exceeded / "penuh"), it
 * degrades gracefully to ephemeral in-memory for the rest of the instance
 * instead of throwing on every mutation. Reads use fetch; writes use a
 * synchronous curl so they finish before Vercel freezes the lambda.
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

const DB_KEY = "db.sqlite";
const BUCKET = process.env.DIKA_SUPABASE_BUCKET || "9router";

// Accept both app-prefixed names (dashboard paste) and the standard env names
// the Vercel → Supabase integration auto-provisions (SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY). Nothing hardcoded — env only.
// Returns keyKind so the dashboard can warn when only a public/anon key is set
// (anon cannot write to a private Storage bucket without an RLS policy).
function detectSupabase() {
  const url =
    process.env.NEXT_PUBLIC_DIKA_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const candidates = [
    ["service_role", process.env.DIKA_SUPABASE_SERVICE_ROLE_KEY],
    ["service_role", process.env.SUPABASE_SERVICE_ROLE_KEY],
    ["secret", process.env.DIKA_SUPABASE_SECRET_KEY],
    ["anon", process.env.DIKA_SUPABASE_ANON_KEY],
    ["anon", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    ["anon", process.env.SUPABASE_ANON_KEY],
  ];
  const [keyKind, key] = candidates.find(([, v]) => v && String(v).trim()) || [null, null];
  if (url && key) {
    return { url: String(url).replace(/\/+$/, ""), key: String(key), keyKind };
  }
  return null;
}

async function ensureBucket(sup) {
  try {
    const res = await fetch(`${sup.url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: sup.key,
        Authorization: `Bearer ${sup.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: BUCKET, public: false }),
    });
    // 400 with anon key = no RLS policy / forbidden write. Surface it instead
    // of silently treating the bucket as missing so the read-only trap is
    // visible in the dashboard (supabaseWriteOk=false).
    if (!res.ok && res.status !== 409 && [400, 401, 403].includes(res.status)) {
      const txt = await res.text().catch(() => "");
      if (sup.keyKind === "anon") {
        throw new Error(
          `anon key cannot manage the storage bucket (HTTP ${res.status}). ` +
          `Set SUPABASE_SERVICE_ROLE_KEY (or DIKA_SUPABASE_SERVICE_ROLE_KEY) in Vercel env — ` +
          txt.slice(0, 160)
        );
      }
      console.warn(`[DB/Supabase] ensureBucket HTTP ${res.status}: ${txt.slice(0, 160)}`);
    }
  } catch (e) {
    if (e.message?.includes("anon key")) throw e;
    /* bucket may already exist (409) or transient network — ignore */
  }
}

async function sbRead(sup) {
  const res = await fetch(`${sup.url}/storage/v1/object/${BUCKET}/${DB_KEY}`, {
    headers: { apikey: sup.key, Authorization: `Bearer ${sup.key}` },
  });
  if (res.status === 404) return null; // first run — no blob yet
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  const buf = await res.arrayBuffer();
  return { bytes: new Uint8Array(buf), etag: res.headers.get("etag") };
}

// Synchronous write. Must be sync: on Vercel a fire-and-forget async fetch is
// frozen the moment the response is sent, so the blob never reaches Supabase
// and the key is lost on the next cold start. We shell out to a child `node`
// (process.execPath — guaranteed present, unlike curl which is NOT guaranteed
// in the Vercel serverless runtime) that does an HTTPS fetch from the URL.
// The blob goes through a temp file, not argv, to dodge CLI length limits.
function sbWriteSync(sup, bytes) {
  const tmpFile = `/tmp/9router/db/.sb-upload-${process.pid}.bin`;
  fs.mkdirSync("/tmp/9router/db", { recursive: true });
  fs.writeFileSync(tmpFile, Buffer.from(bytes));
  const url = `${sup.url}/storage/v1/object/${BUCKET}/${DB_KEY}?upsert=true`;
  const script = `
    const fs = require("fs");
    (async () => {
      const res = await fetch(process.argv[1], {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.argv[2],
          apikey: process.argv[2],
          "Content-Type": "application/octet-stream",
          "x-upsert": "true",
        },
        body: fs.readFileSync(process.argv[3]),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("HTTP " + res.status + " " + t.slice(0, 200));
        process.exit(1);
      }
    })().catch((e) => { console.error(e.message); process.exit(1); });
  `;
  try {
    execFileSync(
      process.execPath,
      ["-e", script, url, sup.key, tmpFile],
      { stdio: ["ignore", "ignore", "pipe"], timeout: 20000 }
    );
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

export async function createSupabaseAdapter() {
  const SQLLib = await loadSql();
  const sup = detectSupabase();
  if (!sup) {
    throw new Error("Supabase not configured (need NEXT_PUBLIC_DIKA_SUPABASE_URL + DIKA_SUPABASE_*_KEY)");
  }

  let db;
  let _etag = null;
  let _lastSyncCheck = 0;
  let _syncPromise = null;
  let loadFailed = false;
  let loadError = null;
  // Retry a transient cold-start read before demoting to read-only: a single
  // network/auth blip must not permanently disable persistence for the lambda's
  // whole life (that silently drops every later write — the "settings revert" bug).
  let loaded = null;
  for (let attempt = 0; attempt <= 2 && !loaded; attempt++) {
    try {
      await ensureBucket(sup);
      loaded = await sbRead(sup);
      break;
    } catch (e) {
      loadError = e.message;
      if (attempt < 2) {
        console.warn(`[DB/Supabase] Cold-start load attempt ${attempt + 1} failed, retrying: ${e.message}`);
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  if (loaded) {
    try { db = new SQLLib.Database(loaded.bytes); _etag = loaded.etag; }
    catch (e) { loadFailed = true; loadError = e.message; }
  }
  if (loadFailed) {
    console.warn(`[DB/Supabase] Cold-start load failed after retries, running READ-ONLY: ${loadError}`);
  }
  if (!db) db = new SQLLib.Database();
  db.exec(PRAGMA_SQL);

  const adapter = {
    driver: "vercel-supabase",
    _sup: sup,
    _keyKind: sup.keyKind,
    _failed: false,
    _readonly: loadFailed,
    _lastError: loadError,
    _lastSyncError: null,
    _seeding: false,
    run,
    get,
    all,
    exec,
    transaction,
    close,
    raw: db,
  };

  // Debounced persist: coalesce the many mutations inside one request (token
  // persist, clearAccountError, saveUsageStats, settings toggles) into a single
  // synchronous blob upload per window. Previously persist() ran a child `node`
  // process on EVERY run()/exec() — the dominant Vercel latency source and a
  // silent in-memory fallback when the 20s upload timed out.
  const PERSIST_DEBOUNCE_MS = 250;
  let _persistTimer = null;
  let _persistPending = false;
  function persistNow() {
    if (adapter._failed || adapter._readonly || adapter._seeding || !adapter._sup) return;
    try {
      sbWriteSync(adapter._sup, db.export());
      adapter._lastError = null;
      adapter._lastSyncError = null;
    } catch (e) {
      adapter._failed = true;
      adapter._lastError = e.message;
      console.warn(`[DB/Supabase] persist failed — falling back to in-memory: ${e.message}`);
    }
  }
  function persist() {
    if (adapter._failed || adapter._readonly || adapter._seeding || !adapter._sup) return;
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
  // Synchronous flush — awaited before the lambda returns (see requestFlush.js)
  // so a write near end of request (usage) is never lost on freeze.
  adapter._flush = function flush() {
    if (_persistTimer) { clearTimeout(_persistTimer); _persistTimer = null; }
    if (_persistPending) { _persistPending = false; persistNow(); }
  };
  adapter._persist = persist;

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
      const lastInsertRowid =
        db.exec("SELECT last_insert_rowid() as id")[0]?.values?.[0]?.[0] ?? null;
      persist();
      return { changes, lastInsertRowid };
    } finally {
      stmt.free();
    }
  }

  function get(sql, params = []) {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(paramsObj(params));
      if (stmt.step()) return stmt.getAsObject();
      return undefined;
    } finally {
      stmt.free();
    }
  }

  function all(sql, params = []) {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(paramsObj(params));
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  }

  function exec(sql) {
    db.exec(sql);
    persist();
  }

  function transaction(fn) {
    const sp = `sp_${Math.random().toString(36).slice(2)}`;
    db.exec(`SAVEPOINT ${sp}`);
    try {
      const result = fn();
      try { db.exec(`RELEASE ${sp}`); } catch {}
      persist();
      return result;
    } catch (e) {
      try {
        db.exec(`ROLLBACK TO ${sp}`);
        db.exec(`RELEASE ${sp}`);
      } catch {}
      throw e;
    }
  }

  function close() {
    db.close();
  }

  // ─── Cross-instance re-sync ────────────────────────────────────────────
  // On Vercel many serverless instances share ONE Supabase blob but each keeps
  // its own in-memory sql.js copy. Without re-sync, a save on instance A is
  // invisible to instance B until B's cache expires → config "reverts to
  // default". We re-pull the blob (conditional GET, cheap 304) before each
  // request so every instance converges on the latest write.
  // Re-sync BEFORE every request (TTL 0 = always pull latest). Many Vercel
  // instances share one blob; each mutation calls persist() which uploads the
  // ENTIRE in-memory db. With any non-zero TTL, a warm instance whose in-memory
  // db is stale (loaded before a settings save) can persist that stale db and
  // clobber another instance's save — so every config change reverts to default
  // within the TTL window (made worse by constant streaming/usage traffic).
  // Always pulling latest before a mutation keeps the uploaded blob current.
  // Cheap: conditional GET returns 304 when unchanged.
  const SYNC_TTL_MS = 0;
  async function syncRemote(force = false) {
    if (adapter._failed || adapter._readonly || !adapter._sup) return;
    const now = Date.now();
    if (!force && now - _lastSyncCheck < SYNC_TTL_MS) return;
    if (_syncPromise) { try { await _syncPromise; } catch {} return; }
    _syncPromise = (async () => {
      try {
        const headers = { apikey: sup.key, Authorization: `Bearer ${sup.key}` };
        if (_etag) headers["If-None-Match"] = _etag;
        const res = await fetch(`${sup.url}/storage/v1/object/${BUCKET}/${DB_KEY}`, { headers });
        if (res.status === 304 || res.status === 404) { _lastSyncCheck = Date.now(); return; }
        if (!res.ok) { _lastSyncCheck = Date.now(); return; }
        const buf = new Uint8Array(await res.arrayBuffer());
        // Skip swap when content is byte-identical (handles missing ETag).
        const current = db.export();
        if (buf.length === current.length && buf.every((b, i) => b === current[i])) {
          _etag = res.headers.get("etag");
          _lastSyncCheck = Date.now();
          return;
        }
        const newDb = new SQLLib.Database(buf);
        newDb.exec(PRAGMA_SQL);
        const old = db;
        db = newDb;
        try { old.close(); } catch {}
        _etag = res.headers.get("etag");
        _lastSyncCheck = Date.now();
        adapter._lastSyncError = null;
      } catch (e) {
        _lastSyncCheck = Date.now();
        adapter._lastSyncError = e.message;
        console.warn(`[DB/Supabase] re-sync skipped: ${e.message}`);
      }
    })();
    try { await _syncPromise; } finally { _syncPromise = null; }
  }
  adapter._syncRemote = syncRemote;

  return adapter;
}
