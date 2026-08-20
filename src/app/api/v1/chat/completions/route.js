import { handleChat } from "@/sse/handlers/chat.js";
import { initTranslators } from "open-sse/translator/index.js";
import { getAdapter } from "@/lib/db/driver.js";

let initialized = false;

/**
 * Initialize translators once
 */
async function ensureInitialized() {
  if (!initialized) {
    await initTranslators();
    initialized = true;
  }
}

/**
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    }
  });
}

export async function POST(request) {
  // Pre-warm the DB adapter so the usage write path is not a cold-start chain
  // that races the serverless freeze after the SSE response finishes.
  if (!initialized) {
    try { await Promise.all([initTranslators(), getAdapter()]); }
    catch { await initTranslators(); }
    initialized = true;
  }

  return await handleChat(request);
}

