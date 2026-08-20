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
    await fetch(`${sup.url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: sup.key,
        Authorization: `Bearer ${sup.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: BUCKET, public: false }),
    });
  } catch {
    /* bucket may already exist (409) — ignore */
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

// Synchronous write (curl, like the KV adapter). Must be sync: on Vercel a
// fire-and-forget async fetch is frozen the moment the response is sent, so the
// blob never reaches Supabase and the key is lost on the next cold start.
function sbWriteSync(sup, bytes) {
  execFileSync(
    "curl",
    [
      "-s", "--max-time", "15", "-X", "POST",
      "-H", `Authorization: Bearer ${sup.key}`,
      "-H", `apikey: ${sup.key}`,
      "-H", "Content-Type: application/octet-stream",
      "-H", "x-upsert: true",
      "--data-binary", "@-",
      `${sup.url}/storage/v1/object/${BUCKET}/${DB_KEY}?upsert=true`,
    ],
    { input: Buffer.from(bytes), stdio: ["pipe", "ignore", "ignore"] }
  );
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
  try {
    await ensureBucket(sup);
    const loaded = await sbRead(sup);
    if (loaded) { db = new SQLLib.Database(loaded.bytes); _etag = loaded.etag; }
    _lastSyncCheck = Date.now();
  } catch (e) {
    // Read failed (network / auth — NOT a clean 404 first-run). Starting fresh
    // would let this instance overwrite the real blob on the next persist, so
    // go read-only instead: never clobber remote data we couldn't load.
    loadFailed = true;
    loadError = e.message;
    console.warn(`[DB/Supabase] Cold-start load failed, running READ-ONLY: ${e.message}`);
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
    _seeding: false,
    run,
    get,
    all,
    exec,
    transaction,
    close,
    raw: db,
  };

  // Synchronous (curl) so the write completes before the serverless function
  // returns — see sbWriteSync. On failure, mark _failed so we stop hammering
  // Supabase and just stay in-memory for the rest of this instance's life.
  function persist() {
    if (adapter._failed || adapter._readonly || adapter._seeding || !adapter._sup) return;
    try {
      sbWriteSync(adapter._sup, db.export());
    } catch (e) {
      adapter._failed = true;
      adapter._lastError = e.message;
      console.warn(`[DB/Supabase] persist failed — falling back to in-memory: ${e.message}`);
    }
  }
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
  const SYNC_TTL_MS = 2000;
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
      } catch (e) {
        _lastSyncCheck = Date.now();
        console.warn(`[DB/Supabase] re-sync skipped: ${e.message}`);
      }
    })();
    try { await _syncPromise; } finally { _syncPromise = null; }
  }
  adapter._syncRemote = syncRemote;

  return adapter;
}
