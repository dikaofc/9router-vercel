import fs from "node:fs";
import path from "path";
import os from "os";

const APP_NAME = "9router";

function defaultDir() {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), APP_NAME);
  }
  return path.join(os.homedir(), `.${APP_NAME}`);
}

export function getDataDir() {
  const configured = process.env.DATA_DIR;
  if (!configured) return defaultDir();

  // On Windows, ignore Unix-style absolute paths (e.g. /var/lib/...) that come
  // from a Linux-targeted .env or Docker config — they are not valid here.
  if (process.platform === "win32" && /^\//.test(configured)) {
    console.warn(`[DATA_DIR] '${configured}' is a Unix path on Windows → fallback to default`);
    return defaultDir();
  }

  try {
    fs.mkdirSync(configured, { recursive: true });
    return configured;
  } catch (e) {
    // Fail-open: ANY mkdir failure falls back to homedir. Previous allowlist
    // missed EEXIST/ENOTDIR/EINVAL/EBUSY/etc and re-threw at import time,
    // crashing instrumentation register() and taking down every route.
    console.warn(`[DATA_DIR] '${configured}' not usable (${e?.code || e?.message}) → fallback ~/.${APP_NAME}`);
    return defaultDir();
  }
}

export const DATA_DIR = getDataDir();
