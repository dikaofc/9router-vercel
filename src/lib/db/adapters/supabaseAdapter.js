/**
 * Supabase-backed SQLite adapter — runs in memory via sql.js and persists the
 * whole DB blob to Supabase Storage so dashboard state (connections, combos,
 * API keys, settings, usage) survives Vercel cold starts AND is shared across
 * serverless instances. Zero native deps: talks to Supabase REST with fetch.
 *
 * If Supabase is unconfigured it throws (caller falls through to the next
 * adapter). If a write fails (network error / quota exceeded / "penuh"), it
 * degrades gracefully to ephemeral in-memory for the rest of the instance
 * instead of throwing on every mutation.
 */
import initSqlJs from "sql.js";
import { PRAGMA_SQL } from "../schema.js";

let SQL = null;
async function loadSql() {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

const DB_KEY = "db.sqlite";
const BUCKET = process.env.DIKA_SUPABASE_BUCKET || "9router";

function detectSupabase() {
  const url = process.env.NEXT_PUBLIC_DIKA_SUPABASE_URL;
  const key =
    process.env.DIKA_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.DIKA_SUPABASE_SECRET_KEY ||
    process.env.DIKA_SUPABASE_ANON_KEY;
  if (url && key) return { url: String(url).replace(/\/+$/, ""), key: String(key) };
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
  return new Uint8Array(buf);
}

async function sbWrite(sup, bytes) {
  const res = await fetch(
    `${sup.url}/storage/v1/object/${BUCKET}/${DB_KEY}?upsert=true`,
    {
      method: "POST",
      headers: {
        apikey: sup.key,
        Authorization: `Bearer ${sup.key}`,
        "Content-Type": "application/octet-stream",
        "x-upsert": "true",
      },
      body: bytes,
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Supabase upload failed (${res.status}): ${txt.slice(0, 200)}`);
  }
}

export async function createSupabaseAdapter() {
  const SQLLib = await loadSql();
  const sup = detectSupabase();
  if (!sup) {
    throw new Error("Supabase not configured (need NEXT_PUBLIC_DIKA_SUPABASE_URL + DIKA_SUPABASE_*_KEY)");
  }

  let db;
  let loadFailed = false;
  let loadError = null;
  try {
    await ensureBucket(sup);
    const bytes = await sbRead(sup);
    if (bytes) db = new SQLLib.Database(bytes);
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

  // Fire-and-forget: keep the adapter interface synchronous (called after every
  // mutation). On failure, mark _failed so we stop hammering Supabase and just
  // stay in-memory for the rest of this instance's life.
  function persist() {
    if (adapter._failed || adapter._readonly || adapter._seeding || !adapter._sup) return;
    sbWrite(adapter._sup, db.export()).catch((e) => {
      adapter._failed = true;
      adapter._lastError = e.message;
      console.warn(`[DB/Supabase] persist failed — falling back to in-memory: ${e.message}`);
    });
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

  return adapter;
}
