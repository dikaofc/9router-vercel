const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

// On Vercel the MITM server, cloudflared, DNS hooks are not applicable — and
// their transitive deps (node-forge, native modules) can throw MODULE_NOT_FOUND
// at import time, taking down every page via layout.js.
if (!IS_VERCEL) {
  // Use dynamic import so a missing native dep doesn't crash module evaluation.
  import("./initializeApp.js")
    .then(({ default: initializeApp }) => {
      const isBuildPhase =
        process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.NEXT_PHASE === "phase-export" ||
        process.env.NEXT_PHASE === "phase-static";

      if (typeof window === "undefined" && !isBuildPhase && !global.__appBootstrapped) {
        global.__appBootstrapped = true;
        initializeApp().catch((e) => console.error("[Bootstrap] init failed:", e.message));
      }
    })
    .catch((e) => console.warn(`[Bootstrap] skipped: ${e?.message || e}`));
}
