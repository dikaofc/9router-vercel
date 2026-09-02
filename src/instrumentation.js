export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { initConsoleLogCapture } = await import("@/lib/consoleLogBuffer");
    initConsoleLogCapture();

    const { installCatalogSource } = await import("open-sse/providers/catalogOverride.js");
    await installCatalogSource();

    const { startModelCatalogSync } = await import("@/lib/modelCatalog/sync.js");
    startModelCatalogSync();

    // Smart cleaner: hourly prune of usageHistory/usageDaily + WAL checkpoint.
    // Lightweight (one unref timer), disabled with CLEANER=off, no-op on Vercel.
    try {
      const { startCleaner } = await import("@/lib/cleaner.js");
      startCleaner();
    } catch (e) {
      console.warn(`[instrumentation] cleaner skipped: ${e?.message || e}`);
    }
  } catch (e) {
    console.warn(`[instrumentation] register skipped: ${e?.message || e}`);
  }
}
