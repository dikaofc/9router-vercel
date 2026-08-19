const fs = require("fs");
const path = require("path");
const os = require("os");

const APP_NAME = "9router";

// Detect Vercel serverless environment
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

function defaultDir() {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), APP_NAME);
  }
  return path.join(os.homedir(), `.${APP_NAME}`);
}

function getDataDir() {
  // On Vercel, /tmp is the only writable directory (ephemeral)
  if (IS_VERCEL) return "/tmp/9router";

  const configured = process.env.DATA_DIR;
  if (!configured) return defaultDir();
  try {
    fs.mkdirSync(configured, { recursive: true });
    return configured;
  } catch (e) {
    if (e?.code === "EACCES" || e?.code === "EPERM") {
      console.warn(`[DATA_DIR] '${configured}' not writable → fallback ~/.${APP_NAME}`);
      return defaultDir();
    }
    throw e;
  }
}

const DATA_DIR = getDataDir();
const MITM_DIR = IS_VERCEL ? "/tmp/9router/mitm" : path.join(DATA_DIR, "mitm");

module.exports = { DATA_DIR, MITM_DIR };
