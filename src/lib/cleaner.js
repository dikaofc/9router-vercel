// Smart RAM + storage cleaner — super ringan, low overhead.
//
// Goals: no memory leak, no cpu leak, no storage leak.
// - Bounded state everywhere (see consoleLogBuffer, usage RING_CAP, requestDetails trimming).
// - Periodic prune of the two unbounded growth surfaces: usageHistory + usageDaily.
// - WAL checkpoint so -wal/-shm don't bloat on long-lived self-host.
// - Backups already capped at 3; this just re-prunes on schedule.
// - Single coalesced timer, .unref(), fail-open, Vercel-aware.
//
// Enable:  CLEANER_INTERVAL_MS (default 1h), disable with CLEANER=off.
// Tunables: USAGE_RETENTION_DAYS (30), USAGE_RETENTION_MAX_ROWS (50000),
//           USAGE_DAILY_RETENTION_DAYS (90).

const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

let timer = null;
let running = false;

function envInt(name, fallback) {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function isDisabled() {
  return String(process.env.CLEANER || "").toLowerCase() === "off";
}

function isNonServerRuntime() {
  if (typeof window !== "undefined") return true;
  const phase = process.env.NEXT_PHASE || "";
  if (phase === "phase-production-build" || phase === "phase-export" || phase === "phase-static") return true;
  if (process.env.NEXT_RUNTIME === "edge") return true;
  return false;
}

async function pruneOnce() {
  if (running) return;
  running = true;
  try {
    // 1) DB prune (usageHistory + usageDaily). Dynamic import to avoid circular init.
    try {
      const { pruneExpiredUsage } = await import("@/lib/db/repos/usageRepo.js");
      await pruneExpiredUsage();
    } catch (e) {
      console.warn(`[cleaner] usage prune skipped: ${e?.message || e}`);
    }

    // 2) requestDetails is already bounded by maxRecords on write; also prune if config shrank.
    try {
      const { getAdapter } = await import("@/lib/db/driver.js");
      const db = await getAdapter().catch(() => null);
      if (db) {
        // WAL checkpoint — keeps -wal from growing forever on 24/7 hosts.
        // No-op if journal_mode != WAL or on in-memory adapters that lack exec.
        try { db.exec?.("PRAGMA wal_checkpoint(TRUNCATE)"); } catch {}
      }
    } catch {}

    // 3) Backup GC (keep 3 newest, already done at boot — just re-check hourly).
    try {
      const { pruneOldBackups } = await import("@/lib/db/backup.js");
      pruneOldBackups();
    } catch {}

    // 4) RAM: drop stale singletons that can hold old refs across HMR.
    try {
      // conn cache already TTLs at 30s; just nudge GC if exposed.
      if (global.gc && !IS_VERCEL) {
        // Only hint, never force tight loop. One hint per hour is free.
        try { global.gc(); } catch {}
      }
    } catch {}

    // Optionally also prune temp catalog raw backups older than 7d? Skip — catalog is ~470KB fixed.
  } finally {
    running = false;
  }
}

export function startCleaner() {
  if (timer) return false;
  if (isDisabled()) return false;
  if (isNonServerRuntime()) return false;
  // On Vercel each function is short-lived; hourly timer would never fire.
  // Still allow it (it will just not fire), but don't log as started.
  const intervalMs = envInt("CLEANER_INTERVAL_MS", 60 * 60 * 1000);
  // Add small jitter so multiple replicas don't thunder at same second.
  const jitter = Math.floor(Math.random() * 5000);
  const firstDelay = Math.min(intervalMs, 5 * 60 * 1000) + jitter; // first run within ~5min

  const schedule = (delay) => {
    timer = setTimeout(async () => {
      try { await pruneOnce(); } catch {}
      schedule(intervalMs);
    }, delay);
    timer.unref?.();
  };

  schedule(firstDelay);
  // Fire an initial lightweight pass without blocking boot (catch = fail-open).
  // On self-host this cleans leftover bloat from previous run immediately.
  setTimeout(() => { pruneOnce().catch(() => {}); }, 2000).unref?.();
  return true;
}

export function stopCleaner() {
  if (timer) { clearTimeout(timer); timer = null; }
}

// Exposed for tests / manual trigger.
export async function runCleanerOnce() {
  await pruneOnce();
}
