import { handleChat } from "@/sse/handlers/chat.js";
import { initTranslators } from "open-sse/translator/index.js";
import { getAdapter } from "@/lib/db/driver.js";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  // Reject oversized bodies early to prevent OOM on Vercel's 512MB memory limit
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1_048_576) { // 1MB
    return new Response(JSON.stringify({ error: "Request body too large (max 1MB)" }), {
      status: 413,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Pre-warm the DB adapter so the usage write path is not a cold-start chain
  // that races the serverless freeze after the SSE response finishes.
  if (!initialized) {
    try { await Promise.all([initTranslators(), getAdapter()]); }
    catch { await initTranslators(); }
    initialized = true;
  }

  return await handleChat(request);
}

