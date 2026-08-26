import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export const dynamic = "force-dynamic";

// Server-side system info for the System Status dashboard. Runs inside the
// actual function, so process.memoryUsage() etc. are real here (on the browser
// client they don't exist — that's why the old page showed "0 B" everywhere).
async function collectHealth() {
  const mem = process.memoryUsage ? process.memoryUsage() : null;

  let db = "in-memory";
  let dbDriver = "sql.js";
  let providers = 0;
  let connections = 0;
  let apiKeys = 0;

  try {
    const { getAdapter } = await import("@/lib/db/driver.js");
    const adapter = await getAdapter();
    dbDriver = adapter.driver;
    db = adapter.driver === "vercel-supabase" ? "supabase" : db;
    connections = adapter.all("SELECT COUNT(*) AS c FROM providerConnections")?.[0]?.c || 0;
    providers = adapter.all("SELECT COUNT(DISTINCT provider) AS c FROM providerConnections")?.[0]?.c || 0;
    apiKeys = adapter.all("SELECT COUNT(*) AS c FROM apiKeys")?.[0]?.c || 0;
  } catch {
    // DB not initialized yet — leave defaults
  }

  return {
    ok: true,
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    version: (await import("@/shared/constants/config")).APP_CONFIG?.version || "0.5.55",
    nodeEnv: process.env.NODE_ENV || "production",
    nodeVersion: process.version || "",
    region: process.env.VERCEL_REGION || "iad1 (US East)",
    platform: process.env.VERCEL ? "Vercel Serverless" : "Local",
    memory: mem
      ? {
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          rss: mem.rss,
          external: mem.external,
        }
      : null,
    db,
    dbDriver,
    providers,
    connections,
    apiKeys,
  };
}

export async function GET() {
  try {
    const health = await collectHealth();
    // In production, return minimal info to avoid leaking version/env details
    const isProd = process.env.NODE_ENV === "production";
    const safeHealth = isProd
      ? { ok: health.ok, uptime: health.uptime }
      : health;
    return NextResponse.json(safeHealth, { headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}