/**
 * requestFlush — guarantee a serverless adapter's pending writes land before
 * the lambda returns, so dashboard toggles / usage / API keys are never lost
 * on Vercel's freeze (the "settings revert / Token Saver turns off again" bug).
 *
 * Adapters that persist remotely expose `_flush()` (synchronous child-process
 * upload for Supabase/KV/Upstash). In-memory / local adapters are no-ops.
 * Safe to call multiple times; only flushes when there is pending work.
 */
export async function requestFlush(adapter) {
  if (!adapter) return;
  if (typeof adapter._flush === "function") {
    try { adapter._flush(); } catch (e) { console.warn(`[DB] flush failed: ${e.message}`); }
  }
  // Back-compat: some adapters expose only the async _persist (already flushed
  // via debounce). Awaiting it is harmless if it's a no-op.
  if (typeof adapter._persist === "function" && adapter._persist.length === 0) {
    try { await adapter._persist(); } catch {}
  }
}
