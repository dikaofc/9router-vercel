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

  // F3 defense-in-depth: require API key on Vercel. Zero imports, pure env check.
  // This MUST be in the route handler file (not shared modules) because Vercel
  // bundles each route as a separate serverless function.
  const _isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);
  if (_isVercel) {
    const _auth = request.headers.get("Authorization");
    const _key = _auth?.startsWith("Bearer ") ? _auth.slice(7) : request.headers.get("x-api-key");
    if (!_key) {
      return new Response(
        JSON.stringify({ error: "API key required. Set Authorization: Bearer <your-key>" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return await handleChat(request);
}
