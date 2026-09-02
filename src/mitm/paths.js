const fs = require("fs");
const path = require("path");
const os = require("os");

const APP_NAME = "9router";

function defaultDir() {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), APP_NAME);
  }
  return path.join(os.homedir(), `.${APP_NAME}`);
}

function getDataDir() {
  const configured = process.env.DATA_DIR;
  if (!configured) return defaultDir();
  try {
    fs.mkdirSync(configured, { recursive: true });
    return configured;
  } catch (e) {
    // Fail-open: any mkdir failure → homedir fallback (was allowlist-only before)
    console.warn(`[DATA_DIR] '${configured}' not usable (${e?.code || e?.message}) → fallback ~/.${APP_NAME}`);
    return defaultDir();
  }
}

const DATA_DIR = getDataDir();
const MITM_DIR = path.join(DATA_DIR, "mitm");

module.exports = { DATA_DIR, MITM_DIR };
