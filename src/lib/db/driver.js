import { ensureDirs, DATA_FILE } from "./paths.js";

// Use global to survive Next.js dev hot-reload (module state resets on reload)
if (!global._dbAdapter) global._dbAdapter = { instance: null, initPromise: null, logged: false };
const state = global._dbAdapter;

// Detect Vercel serverless environment
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

async function tryVercelAdapter() {
  if (!IS_VERCEL) return null;
  try {
    const { createVercelAdapter } = await import("./adapters/vercelAdapter.js");
    return await createVercelAdapter();
  } catch (e) {
    console.warn(`[DB] Vercel adapter unavailable: ${e.message}`);
    return null;
  }
}

async function tryBunSqlite() {
  // Bun runtime only — built-in, no install needed
  if (!process.versions.bun) return null;
  try {
    const { createBunSqliteAdapter } = await import("./adapters/bunSqliteAdapter.js");
    return await createBunSqliteAdapter(DATA_FILE);
  } catch (e) {
    console.warn(`[DB] bun:sqlite unavailable: ${e.message}`);
    return null;
  }
}

async function tryBetterSqlite() {
  // Skip on Bun — better-sqlite3 native bindings unsupported
  if (process.versions.bun) return null;
  try {
    const { createBetterSqliteAdapter } = await import("./adapters/betterSqliteAdapter.js");
    return createBetterSqliteAdapter(DATA_FILE);
  } catch (e) {
    console.warn(`[DB] better-sqlite3 unavailable: ${e.message}`);
    return null;
  }
}

async function tryNodeSqlite() {
  // Built-in since Node 22.5.0 — no install needed. Skip under Bun (no node:sqlite).
  if (process.versions.bun) return null;
  const [maj, min] = process.versions.node.split(".").map(Number);
  if (maj < 22 || (maj === 22 && min < 5)) return null;
  try {
    const { createNodeSqliteAdapter } = await import("./adapters/nodeSqliteAdapter.js");
    return await createNodeSqliteAdapter(DATA_FILE);
  } catch (e) {
    console.warn(`[DB] node:sqlite unavailable: ${e.message}`);
    return null;
  }
}

async function trySqlJs() {
  try {
    const { createSqlJsAdapter } = await import("./adapters/sqljsAdapter.js");
    return await createSqlJsAdapter(DATA_FILE);
  } catch (e) {
    console.warn(`[DB] sql.js unavailable: ${e.message}`);
    return null;
  }
}

async function initAdapter() {
  // On Vercel, skip filesystem operations entirely
  if (!IS_VERCEL) ensureDirs();

  // Vercel: use in-memory adapter first (no filesystem needed)
  let adapter = await tryVercelAdapter();
  if (!adapter) {
    // Order per runtime:
    //   Bun:  bun:sqlite → sql.js
    //   Node: better-sqlite3 → node:sqlite (≥22.5) → sql.js
    adapter = await tryBunSqlite();
    if (!adapter) adapter = await tryBetterSqlite();
    if (!adapter) adapter = await tryNodeSqlite();
    if (!adapter) adapter = await trySqlJs();
  }
  if (!adapter) throw new Error("[DB] No SQLite driver available (bun/better/node/sql.js/vercel all failed)");

  if (!state.logged) {
    console.log(`[DB] Driver: ${adapter.driver} | file: ${IS_VERCEL ? "(in-memory)" : DATA_FILE}`);
    state.logged = true;
  }

  const { runMigrationOnce } = await import("./migrate.js");
  await runMigrationOnce(adapter);

  // Vercel: seed settings/connections/API keys from env vars AFTER schema is ready.
  // Done here (not only inside vercelAdapter) so it also applies if we fall back to a
  // filesystem-backed adapter on Vercel (e.g. sql.js failed to load and we use /tmp).
  if (IS_VERCEL) {
    const { seedFromEnv } = await import("./adapters/vercelAdapter.js");
    seedFromEnv(adapter);
  }

  return adapter;
}

export async function getAdapter() {
  if (state.instance) return state.instance;
  if (!state.initPromise) state.initPromise = initAdapter().then((a) => { state.instance = a; return a; });
  return state.initPromise;
}

export function getAdapterSync() {
  if (!state.instance) throw new Error("[DB] adapter not initialized — await getAdapter() first");
  return state.instance;
}
