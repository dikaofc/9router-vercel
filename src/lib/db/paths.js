import path from "node:path";
import fs from "node:fs";
import { DATA_DIR } from "@/lib/dataDir.js";

// Detect Vercel serverless environment
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

export const DB_DIR = IS_VERCEL ? "/tmp/9router/db" : path.join(DATA_DIR, "db");
export const DATA_FILE = IS_VERCEL ? "/tmp/9router/db/data.sqlite" : path.join(DB_DIR, "data.sqlite");
export const BACKUPS_DIR = IS_VERCEL ? "/tmp/9router/db/backups" : path.join(DB_DIR, "backups");
export const LEGACY_FILES = {
  main: path.join(DATA_DIR, "db.json"),
  usage: path.join(DATA_DIR, "usage.json"),
  disabled: path.join(DATA_DIR, "disabledModels.json"),
  details: path.join(DATA_DIR, "request-details.json"),
};
export function ensureDirs() {
  // On Vercel, /tmp is the only writable directory (but ephemeral)
  if (IS_VERCEL) {
    try {
      for (const dir of ["/tmp/9router", "/tmp/9router/db", "/tmp/9router/db/backups"]) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Ignore — in-memory adapter doesn't need dirs
    }
    return;
  }
  for (const dir of [DATA_DIR, DB_DIR, BACKUPS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}
