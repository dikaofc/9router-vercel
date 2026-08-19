/**
 * Vercel-compatible SQLite adapter — runs entirely in memory via sql.js.
 * No filesystem writes. Config is seeded from environment variables on cold start.
 * State is lost between serverless invocations (acceptable for free-tier proxy).
 */
import initSqlJs from "sql.js";
import { PRAGMA_SQL } from "../schema.js";

let SQL = null;

async function loadSql() {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

function seedFromEnv(db) {
  // Seed settings from env vars if the settings table is empty
  const existing = db.exec("SELECT COUNT(*) as cnt FROM settings");
  const count = existing?.[0]?.values?.[0]?.[0] || 0;
  if (count > 0) return;

  const settings = {};

  // Core settings
  if (process.env.INITIAL_PASSWORD) settings.password = process.env.INITIAL_PASSWORD;
  if (process.env.JWT_SECRET) settings.jwtSecret = process.env.JWT_SECRET;

  // Provider connections from env: PROVIDER_<NAME>_API_KEY=xxx
  // Example: PROVIDER_GLM_API_KEY=xxx → creates a GLM API key connection
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
    const id = `vercel-${providerLower}-${Date.now()}`;

    connections.push({
      id,
      provider: providerLower,
      authType: "apikey",
      name: `${providerLower} (Vercel)`,
      email: null,
      priority: null,
      isActive: 1,
      data: JSON.stringify({
        apiKey,
        providerSpecificData: {},
      }),
      createdAt: now,
      updatedAt: now,
    });
  }

  // Also support a generic PROVIDER_API_KEY env var
  const genericKey = process.env.PROVIDER_API_KEY;
  const genericProvider = process.env.PROVIDER_NAME || "openai";
  if (genericKey) {
    connections.push({
      id: `vercel-generic-${Date.now()}`,
      provider: genericProvider,
      authType: "apikey",
      name: `${genericProvider} (Vercel)`,
      email: null,
      priority: null,
      isActive: 1,
      data: JSON.stringify({
        apiKey: genericKey,
        providerSpecificData: {},
      }),
      createdAt: now,
      updatedAt: now,
    });
  }

  // Seed settings
  // On Vercel: no login required by default (JWT_SECRET not needed)
  const defaultSettings = {
    requireLogin: false,
    requireApiKey: false,
    rtkEnabled: true,
    headroomEnabled: false,
    cavemanEnabled: false,
    ponytailEnabled: false,
    comboStrategy: "fallback",
    theme: "dark",
    ...settings,
  };

  db.exec(`INSERT INTO settings(id, data) VALUES(1, ?)`, [JSON.stringify(defaultSettings)]);

  // Seed API key from env
  const apiKeySecret = process.env.API_KEY_SECRET;
  if (apiKeySecret) {
    const keyId = `vercel-key-${Date.now()}`;
    db.exec(
      `INSERT INTO apiKeys(id, key, name, machineId, isActive, createdAt) VALUES(?, ?, ?, ?, ?, ?)`,
      [keyId, apiKeySecret, "Vercel API Key", null, 1, now]
    );
  }

  // Seed provider connections
  for (const conn of connections) {
    db.exec(
      `INSERT INTO providerConnections(id, provider, authType, name, email, priority, isActive, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [conn.id, conn.provider, conn.authType, conn.name, conn.email, conn.priority, conn.isActive, conn.data, conn.createdAt, conn.updatedAt]
    );
  }

  console.log(`[DB/Vercel] Seeded ${connections.length} provider connections from env vars`);
}

export async function createVercelAdapter() {
  const SQLLib = await loadSql();
  // In-memory database — no file
  const db = new SQLLib.Database();
  db.exec(PRAGMA_SQL);

  // Track unsaved state (no persistence needed, but keep interface compatible)
  let dirty = false;

  function scheduleSave() {
    dirty = true;
    // No-op: we're in-memory, nothing to persist
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
    scheduleSave();
  }

  function transaction(fn) {
    const sp = `sp_${Math.random().toString(36).slice(2)}`;
    db.exec(`SAVEPOINT ${sp}`);
    try {
      const result = fn();
      db.exec(`RELEASE ${sp}`);
      scheduleSave();
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

  // Export seedFromEnv so driver.js can call it AFTER schema migration
  // (tables don't exist yet at this point)
  const adapter = {
    driver: "vercel-in-memory",
    run,
    get,
    all,
    exec,
    transaction,
    close,
    raw: db,
  };

  // Deferred seeding — called by driver.js after migrate creates tables
  adapter._seedFromEnv = () => seedFromEnv({ exec, all });

  return adapter;
}
