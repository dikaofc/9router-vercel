/**
 * Vercel-compatible SQLite adapter — runs entirely in memory via sql.js.
 * No filesystem writes. Config is seeded from environment variables on cold start.
 * State is lost between serverless invocations (acceptable for free-tier proxy).
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

// Optional shared persistence for Vercel: back the in-memory sql.js DB with a
// Vercel KV / Upstash Redis store so dashboard-created API keys, provider connections,
// settings, combos, etc. survive cold starts AND are shared across serverless instances.
// Enable by setting KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV) or
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash). Persistence is async
// (via fetch) with debounced coalescing so writes are durable before function return.
// If KV is not configured it degrades gracefully to ephemeral in-memory behaviour.
const DB_KV_KEY = "9router:db";

function detectKv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url: String(url).replace(/\/+$/, ""), token: String(token) };
  return null;
}

async function kvRead(kv) {
  const res = await fetch(`${kv.url}/get/${encodeURIComponent(DB_KV_KEY)}`, {
    headers: { Authorization: `Bearer ${kv.token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const parsed = await res.json();
  if (parsed && typeof parsed.result === "string" && parsed.result.length) {
    return Uint8Array.from(Buffer.from(parsed.result, "base64"));
  }  return null;
}

// Synchronous KV SET via child node process (see upstashAdapter.redisSetSync
// / supabaseAdapter.sbWriteSync for why sync is required on Vercel): an async
// fire-and-forget fetch can be cut off by the lambda freeze and silently drop
// the write. A child process upload completes before the lambda returns.
function kvWriteSync(kv, bytes) {
  const b64 = Buffer.from(bytes).toString("base64");
  const url = `${kv.url}/set/${encodeURIComponent(DB_KV_KEY)}`;
  // Blob piped via stdin (NOT argv) to avoid E2BIG on larger DB blobs.
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
      ["-e", script, url, kv.token],
      { input: b64, stdio: ["pipe", "ignore", "pipe"], timeout: 10000 }
    );
  } catch (e) {
    throw e;
  }
}

export async function seedFromEnv(adapter) {
  const seedNow = new Date().toISOString();

  // ── Managed combo (refreshed every cold start) ─────────────────────────────
  // The "free-first" smart combo is 9Router-managed: we re-upsert it on EVERY
  // cold start (not just empty-DB boots) so the user always gets the latest
  // curated free model list without manual migration. It uses a FIXED id, so
  // it replaces the old list and never collides with user-created combos.
  try {
    adapter.run(
      `INSERT OR REPLACE INTO combos(id, name, kind, models, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?)`,
      [
        "vercel-seed-free-first",
        "free-first",
        "free-first",
        JSON.stringify([
          // ── OpenCode Free: the only zero-key chat provider. Every model below
          // was code-benchmarked (correct debounce() output, no looping/garbage).
          // FAST-first so long /compact-style prompts finish under the 300s Vercel
          // limit; xhigh reasoning (hy3) last. Cascade (fallback + "model is
          // unavailable" fall-through) skips dead/throttled models.
          // EXCLUDED: deepseek-v4-flash-free (retired, 400 unavailable),
          // mimo-v2.5-free + big-pickle (sustained 429, dead on free tier). ──
          "oc/nemotron-3.5-lightning-free",    // Nemotron 3.5 Lightning (reasoning, fast)
          "oc/muse-spark-1.2-contributor-free",// Muse Spark 1.2 Contributor (verified coding)
          "oc/laguna-s-2.1-free",              // Laguna S 2.1 (reasoning, verified)
          "oc/nemotron-3-ultra-free",          // Nemotron 3 Ultra (reasoning, verified)
          "oc/x-preview-f-free",               // X-Preview (reasoning, verified)
          "oc/hy3-free",                       // Hy3 (reasoning, xhigh) — heaviest, last
          // ── Optional cheap fallbacks (only help if a key is configured) ──
          "gemini-cli/gemini-2.5-flash",
          "groq/llama-3.3-70b-versatile",
        ]),
        seedNow,
        seedNow,
      ]
    );
  } catch (e) {
    console.warn(`[DB/Vercel] free-first combo refresh skipped: ${e.message}`);
  }

  const rows = adapter.all("SELECT COUNT(*) as cnt FROM settings");
  const count = rows?.[0]?.cnt || 0;
  if (count > 0) return;

  // Do NOT store INITIAL_PASSWORD in settings — it's plain text, not a bcrypt hash.
  // The login endpoint reads INITIAL_PASSWORD env var directly for comparison.
  const settings = {};

  // NOTE: provider API keys are NOT seeded from Vercel env vars. They belong in
  // the 9Router DASHBOARD (Settings → Providers), where they persist to Upstash
  // and are shared across all serverless instances. Seeding them from Vercel env
  // would only fire on a cold start with an EMPTY DB and be ignored afterwards,
  // which is the wrong mental model — so we intentionally do not read
  // PROVIDER_*_API_KEY here. Only 9Router's own CLI auth keys (API_KEY_SECRET /
  // API_KEYS) are provisioned via env, below.

  const now = new Date().toISOString();

  const defaultSettings = {
    requireLogin: true,  // Password protection ON (default: 123456)
    requireApiKey: false,
    rtkEnabled: true,
    headroomEnabled: false,
    cavemanEnabled: false,
    ponytailEnabled: false,
    comboStrategy: "fallback",
    theme: "dark",
    ...settings,
  };

  adapter.run(`INSERT INTO settings(id, data) VALUES(1, ?)`, [JSON.stringify(defaultSettings)]);

  const apiKeySecret = process.env.API_KEY_SECRET;
  if (apiKeySecret) {
    adapter.run(
      `INSERT INTO apiKeys(id, key, name, machineId, isActive, createdAt) VALUES(?, ?, ?, ?, ?, ?)`,
      [`vercel-key-secret-${Date.now()}`, apiKeySecret, "Vercel API Key", null, 1, now]
    );
  }

  // Optional: pin multiple CLI API keys via API_KEYS (comma / newline / whitespace
  // separated). Useful if you'd rather not provision them through the dashboard.
  // (Dashboard-created keys persist via Upstash and are the normal path.)
  const apiKeysEnv = process.env.API_KEYS;
  if (apiKeysEnv) {
    const extraKeys = String(apiKeysEnv)
      .split(/[\s,]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    let idx = 0;
    for (const k of extraKeys) {
      adapter.run(
        `INSERT INTO apiKeys(id, key, name, machineId, isActive, createdAt) VALUES(?, ?, ?, ?, ?, ?)`,
        [`vercel-key-env-${Date.now()}-${idx++}`, k, "Vercel API Key (env)", null, 1, now]
      );
    }
    if (extraKeys.length) {
      console.log(`[DB/Vercel] Seeded ${extraKeys.length} API key(s) from API_KEYS env var`);
    }
  }

  // Free-first: providers flagged `defaultEnabled: false` in their registry
  // entry (expensive / oauth-subscription) are hidden by default on every cold
  // start so a fresh Vercel deploy doesn't auto-expose paid plans. They stay
  // fully usable — re-enable them in the dashboard (clearing disabledModels).
  try {
    const { PROVIDER_MODELS } = await import("open-sse/config/providerModels.js");
    const REGISTRY = (await import("open-sse/providers/registry/index.js")).default;
    const defaultOffAliases = REGISTRY
      .filter((e) => e && e.defaultEnabled === false)
      .map((e) => e.alias || e.id);
    for (const alias of defaultOffAliases) {
      const ids = (PROVIDER_MODELS[alias] || []).map((m) => m.id);
      adapter.run(
        `INSERT INTO kv(scope, key, value) VALUES('disabledModels', ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`,
        [alias, JSON.stringify(ids)]
      );
    }
    if (defaultOffAliases.length) {
      console.log(`[DB/Vercel] Default-off providers seeded (hidden until enabled): ${defaultOffAliases.length}`);
    }
  } catch (e) {
    console.warn(`[DB/Vercel] default-off seed skipped: ${e.message}`);
  }
}

export async function createVercelAdapter() {
  const SQLLib = await loadSql();
  const kv = detectKv();

  let db;
  if (kv) {
    try {
      const bytes = await kvRead(kv);
      if (bytes) db = new SQLLib.Database(bytes);
    } catch (e) {
      console.warn(`[DB/Vercel] Failed to load DB from KV (starting fresh): ${e.message}`);
    }
  }
  if (!db) db = new SQLLib.Database();
  db.exec(PRAGMA_SQL);

  const adapter = {
    driver: kv ? "vercel-kv" : "vercel-in-memory",
    _kv: kv,
    _seeding: false,
    run, get, all, exec, transaction, close, raw: db,
  };

  let _persistPending = false;
  let _persistTimer = null;
  let _lastPersistError = null;
  const PERSIST_DEBOUNCE_MS = 200;

  async function persistNow() {
    if (!adapter._kv || adapter._seeding) return;
    try {
      // Synchronous upload (child process) so the write lands before the lambda
      // freezes — an async fetch would be cut off and silently dropped.
      kvWriteSync(adapter._kv, db.export());
      _lastPersistError = null;
    } catch (e) {
      _lastPersistError = e.message;
      console.warn(`[DB/Vercel] Failed to persist DB to KV: ${e.message}`);
    }
  }
  adapter._persist = persistNow;

  // Debounced persist: coalesce multiple rapid writes into one KV push.
  // This is much faster than per-mutation synchronous curl.
  function scheduleSave() {
    if (!adapter._kv || adapter._seeding) return;
    _persistPending = true;
    if (_persistTimer) return;
    _persistTimer = setTimeout(() => {
      _persistTimer = null;
      if (_persistPending) {
        _persistPending = false;
        persistNow().catch(() => {});
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
  // Same problem the Supabase adapter solves: on Vercel many serverless
  // instances share ONE KV blob but each keeps its own in-memory sql.js copy.
  // Without re-sync, a write on instance A is invisible to instance B until
  // B's cold start → settings/toggles/proxy-pools "revert" and usage reads 0.
  // We re-pull the blob (throttled, byte-compared) before each request.
  // Cross-instance re-sync: throttle to every 5s to reduce KV reads while
  // still keeping instances reasonably in sync.
  const SYNC_TTL_MS = 0;
  let _lastSyncCheck = 0;
  let _syncPromise = null;
  async function syncRemote(force = false) {
    if (!adapter._kv || adapter._seeding) return;
    const now = Date.now();
    if (!force && now - _lastSyncCheck < SYNC_TTL_MS) return;
    if (_syncPromise) { try { await _syncPromise; } catch {} return; }
    _syncPromise = (async () => {
      try {
        const bytes = await kvRead(adapter._kv);
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
        console.warn(`[DB/Vercel] re-sync skipped: ${e.message}`);
      }
    })();
    try { await _syncPromise; } finally { _syncPromise = null; }
  }
  adapter._syncRemote = syncRemote;

  // Flush pending writes synchronously. Awaited before the lambda returns (see
  // requestFlush.js) and on shutdown — the debounced timer may not have fired
  // yet, and an async-only write risks being frozen by Vercel before it lands.
  async function flush() {
    if (_persistTimer) { clearTimeout(_persistTimer); _persistTimer = null; }
    if (_persistPending) {
      _persistPending = false;
      await persistNow();
    }
  }
  adapter._flush = flush;
  adapter._lastPersistError = () => _lastPersistError;

  process.on("beforeExit", () => { flush(); });
  process.on("SIGINT", () => { flush().then(() => process.exit(0)).catch(() => process.exit(0)); });
  process.on("SIGTERM", () => { flush().then(() => process.exit(0)).catch(() => process.exit(0)); });

  return adapter;
}
