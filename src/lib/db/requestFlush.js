/**
 * requestFlush — guarantee a serverless adapter's pending writes land before
 * the lambda returns, so dashboard toggles / usage / API keys are never lost
 * on Vercel's freeze (the "settings revert / Token Saver turns off again" bug).
 *
 * Adapters that persist remotely expose `_flush()` (synchronous child-process
 * upload for Supabase/KV/Upstash). In-memory / local adapters are no-ops.
 * Safe to call multiple times; only flushes when there is pending work.
 */
import { getAdapter } from "./driver.js";

export async function requestFlush(adapter) {
  if (!adapter) return;
  if (typeof adapter._flush === "function") {
    try {
      // `_flush` may be sync (Upstash/Supabase child-process upload) or async
      // (KV adapter's awaited fetch). Await whatever it returns so a KV upload
      // lands BEFORE the lambda freezes — otherwise the write is silently lost.
      await adapter._flush();
    } catch (e) { console.warn(`[DB] flush failed: ${e.message}`); }
  }
  // Back-compat: some adapters expose only the async _persist (already flushed
  // via debounce). Awaiting it is harmless if it's a no-op.
  if (typeof adapter._persist === "function" && adapter._persist.length === 0) {
    try { await adapter._persist(); } catch {}
  }
}

/**
 * flushCurrentAdapter — convenience for repo mutation functions: pull the
 * active adapter and flush pending writes synchronously before the lambda
 * freezes. Repos (connections/combos/keys/proxy-pools/disabled-models) write
 * via debounced `run`/`transaction`, whose 200ms timer NEVER fires on Vercel
 * before the response returns — so without this the write is silently lost
 * (the "add provider connection → it disappears" bug). On non-Vercel adapters
 * `_flush` is a no-op, so this is safe everywhere.
 */
export async function flushCurrentAdapter() {
  try {
    const adapter = await getAdapter();
    await requestFlush(adapter);
  } catch (e) {
    console.warn(`[DB] flushCurrentAdapter skipped: ${e.message}`);
  }
}
