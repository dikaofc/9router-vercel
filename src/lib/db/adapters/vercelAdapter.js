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
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash). Persistence is synchronous
// (via curl) so the existing synchronous adapter interface is unchanged and every write is
// durable before the serverless function returns. If KV is not configured (or curl is
// unavailable) it degrades gracefully to the previous ephemeral in-memory behaviour.
const DB_KV_KEY = "9router:db";

function detectKv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url: String(url).replace(/\/+$/, ""), token: String(token) };
  return null;
}

function kvRead(kv) {
  const out = execFileSync(
    "curl",
    ["-s", "--max-time", "8", "-H", `Authorization: Bearer ${kv.token}`, `${kv.url}/get/${encodeURIComponent(DB_KV_KEY)}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  );
  const parsed = JSON.parse(out);
  if (parsed && typeof parsed.result === "string" && parsed.result.length) {
    return Uint8Array.from(Buffer.from(parsed.result, "base64"));
  }
  return null;
}

function kvWrite(kv, bytes) {
  const b64 = Buffer.from(bytes).toString("base64");
  execFileSync(
    "curl",
    ["-s", "--max-time", "10", "-X", "POST", "-H", `Authorization: Bearer ${kv.token}`, "-H", "Content-Type: text/plain", "--data-binary", "@-", `${kv.url}/set/${encodeURIComponent(DB_KV_KEY)}`],
    { input: b64, stdio: ["pipe", "ignore", "ignore"] }
  );
}

export function seedFromEnv(adapter) {
  const rows = adapter.all("SELECT COUNT(*) as cnt FROM settings");
  const count = rows?.[0]?.cnt || 0;
  if (count > 0) return;

  // Do NOT store INITIAL_PASSWORD in settings — it's plain text, not a bcrypt hash.
  // The login endpoint reads INITIAL_PASSWORD env var directly for comparison.
  const settings = {};

  const providerPrefixes = [
    "OPENAI", "ANTHROPIC", "GEMINI", "GROQ", "DEEPSEEK", "XAI",
    "MISTRAL", "COHERE", "TOGETHER", "FIREWORKS", "CEREBRAS",
    "NVIDIA", "SILICONFLOW", "NEBIUS", "CHUTES", "HYPERBOLIC",
    "PERPLEXITY", "GLM", "KIMI", "MINIMAX", "OPENROUTER",
    "VERTEX", "KIRO", "OPENCODE", "KIMCHI", "CURSOR",
    "CODEROUTER", "AGENTROUTER", "REQUESTY", "SENSENOVA",
    "YUANBAO", "AGNES", "CHEAPERINFERENCE",
  ];

  const now = new Date().toISOString();
  const connections = [];

  for (const prefix of providerPrefixes) {
    const apiKey = process.env[`PROVIDER_${prefix}_API_KEY`];
    if (!apiKey) continue;
    const providerLower = prefix.toLowerCase();
    connections.push({
      id: `vercel-${providerLower}-${Date.now()}`,
      provider: providerLower,
      authType: "apikey",
      name: `${providerLower} (Vercel)`,
      email: null, priority: null, isActive: 1,
      data: JSON.stringify({ apiKey, providerSpecificData: {} }),
      createdAt: now, updatedAt: now,
    });
  }

  const genericKey = process.env.PROVIDER_API_KEY;
  const genericProvider = process.env.PROVIDER_NAME || "openai";
  if (genericKey) {
    connections.push({
      id: `vercel-generic-${Date.now()}`,
      provider: genericProvider, authType: "apikey",
      name: `${genericProvider} (Vercel)`,
      email: null, priority: null, isActive: 1,
      data: JSON.stringify({ apiKey: genericKey, providerSpecificData: {} }),
      createdAt: now, updatedAt: now,
    });
  }

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

  // Support multiple explicit API keys via API_KEYS (comma / newline / whitespace separated).
  // This is the reliable way to provision keys on Vercel: the in-memory DB is ephemeral and keys
  // created through the dashboard UI do NOT persist across cold starts or serverless instances,
  // so a remote /v1 request frequently hits an instance whose memory has no key -> 401.
  // Pinning keys via API_KEYS re-seeds them on every cold start.
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

  for (const conn of connections) {
    adapter.run(
      `INSERT INTO providerConnections(id, provider, authType, name, email, priority, isActive, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [conn.id, conn.provider, conn.authType, conn.name, conn.email, conn.priority, conn.isActive, conn.data, conn.createdAt, conn.updatedAt]
    );
  }

  console.log(`[DB/Vercel] Seeded ${connections.length} provider connections from env vars`);
}

export async function createVercelAdapter() {
  const SQLLib = await loadSql();
  const kv = detectKv();

  let db;
  if (kv) {
    try {
      const bytes = kvRead(kv);
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

  function persist() {
    if (!adapter._kv || adapter._seeding) return;
    try {
      kvWrite(adapter._kv, db.export());
    } catch (e) {
      console.warn(`[DB/Vercel] Failed to persist DB to KV: ${e.message}`);
    }
  }
  adapter._persist = persist;

  // Persist synchronously on every mutation so state is durable before the
  // serverless function returns (no request-teardown hook required).
  function scheduleSave() { persist(); }

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
      db.exec(`RELEASE ${sp}`);
      scheduleSave();
      return result;
    } catch (e) {
      try { db.exec(`ROLLBACK TO ${sp}`); db.exec(`RELEASE ${sp}`); } catch {}
      throw e;
    }
  }

  function close() { db.close(); }

  return adapter;
}
