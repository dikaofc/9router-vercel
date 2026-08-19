import initializeApp from "./initializeApp.js";

// Skip during Next.js build/prerender — bootstrap would download cloudflared, init DNS, etc.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"
  || process.env.NEXT_PHASE === "phase-export"
  || process.env.NEXT_PHASE === "phase-static";

// Detect Vercel — skip heavy startup (no cloudflared, no tunnel, no MITM)
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

// Server-only singleton: guard via global so HMR / re-imports don't double-init
if (typeof window === "undefined" && !isBuildPhase && !IS_VERCEL && !global.__appBootstrapped) {
  global.__appBootstrapped = true;
  initializeApp().catch((e) => console.error("[Bootstrap] init failed:", e.message));
}

// On Vercel, just log that we're running in serverless mode
if (typeof window === "undefined" && IS_VERCEL && !global.__appBootstrapped) {
  global.__appBootstrapped = true;
  console.log("[Bootstrap] Running in Vercel serverless mode — heavy startup skipped");
}
