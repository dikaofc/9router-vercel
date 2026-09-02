// Tiny in-memory sliding window rate limiter — no deps, no leak.
//
// Usage: const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });
//        if (!limiter.allow(key)) return 429
//
// Bounded: Map auto-evicts stale keys via periodic sweep (unref timer).
// Fail-open: allow() never throws.

export function createRateLimiter({ windowMs = 60000, max = 30, sweepIntervalMs = 60000 } = {}) {
  const hits = new Map(); // key -> { count, resetAt }
  let sweepTimer = null;

  // Lazily start sweep on first use — not at import time (build phase).
  function ensureSweep() {
    if (sweepTimer) return;
    if (typeof window !== "undefined") return;
    const phase = process.env.NEXT_PHASE || "";
    if (phase === "phase-production-build" || phase === "phase-export" || phase === "phase-static") return;
    sweepTimer = setInterval(() => {
      const now = Date.now();
      for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
      // Cap at 5k keys to bound RAM even under key-spray attack.
      if (hits.size > 5000) {
        const sorted = [...hits.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
        for (let i = 0; i < hits.size - 5000; i++) hits.delete(sorted[i][0]);
      }
    }, sweepIntervalMs);
    sweepTimer.unref?.();
  }

  function allow(key) {
    try {
      ensureSweep();
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || now >= entry.resetAt) {
        entry = { count: 1, resetAt: now + windowMs };
        hits.set(key, entry);
        return true;
      }
      if (entry.count < max) {
        entry.count++;
        return true;
      }
      return false;
    } catch {
      return true; // fail-open
    }
  }

  function retryAfterMs(key) {
    const e = hits.get(key);
    if (!e) return 0;
    return Math.max(0, e.resetAt - Date.now());
  }

  function _size() { return hits.size; }

  return { allow, retryAfterMs, _size };
}

// Pre-made limiters (reused across proxy invocations — module singleton).
// Super ringan: 60s window keeps Map tiny.
export const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });
export const llmLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });
