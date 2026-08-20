import { NextResponse } from "next/server";
import { createProxyPool, getProxyPools } from "@/models";
import { getSettings } from "@/lib/db/repos/settingsRepo";

// Hobby serverless budget is 60s. Per-region deploy + poll run in parallel
// (see POST), so N regions finish in ~one region's time, not N×.
export const maxDuration = 60;

const VERCEL_API = "https://api.vercel.com";

// Available Vercel regions for relay deployment
const REGIONS = [
  { id: "iad1", name: "US East (Virginia)" },
  { id: "sfo1", name: "US West (San Francisco)" },
  { id: "cdg1", name: "Europe (Paris)" },
  { id: "hnd1", name: "Asia (Tokyo)" },
  { id: "sin1", name: "Asia (Singapore)" },
  { id: "syd1", name: "Oceania (Sydney)" },
  { id: "gru1", name: "South America (São Paulo)" },
  { id: "bom1", name: "Asia (Mumbai)" },
];

// Relay function source - lightweight edge proxy
const RELAY_CODE = `
export const config = { runtime: "edge" };

export default async function handler(req) {
  const target = req.headers.get("x-relay-target");
  const relayPath = req.headers.get("x-relay-path") || "/";
  if (!target) {
    return new Response(JSON.stringify({ error: "Missing x-relay-target" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const targetUrl = target.replace(/\\/$/, "") + relayPath;
  const headers = new Headers(req.headers);
  headers.delete("x-relay-target");
  headers.delete("x-relay-path");
  headers.delete("host");

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      duplex: "half",
      // Cap outbound relay time so a slow/unreachable target can't hang the
      // function until Vercel kills it with FUNCTION_INVOCATION_TIMEOUT.
      signal: AbortSignal.timeout(20000),
    });
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}`;

async function readJson(res, fallback = undefined) {
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return { error: { message: text.slice(0, 500) } };
    }
  }
  return fallback ?? { error: { message: `HTTP ${res.status}` } };
}

async function pollDeployment(deploymentId, token, maxMs = 55000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const res = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readJson(res);
    if (data.readyState === "READY") return data;
    if (res.status !== 200) {
      throw new Error(`Deployment status check failed (HTTP ${res.status}): ${data.error?.message || JSON.stringify(data)}`);
    }
    if (data.readyState === "ERROR" || data.readyState === "CANCELED") {
      throw new Error(`Deployment ${data.readyState}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Deployment timeout");
}

// GET - List smart IP relays and status
export async function GET() {
  try {
    const pools = await getProxyPools({ type: "vercel" });
    const smartPools = pools.filter((p) => p.name?.startsWith("smart-ip-"));
    return NextResponse.json({ relays: smartPools, regions: REGIONS });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Deploy relays to multiple regions
export async function POST(request) {
  try {
    const body = await request.json();
    let { vercelToken, regions = ["iad1", "sfo1", "cdg1", "hnd1"], targetUrl } = body;

    // Fall back to the token saved from a previous deploy. It is stored
    // server-side and never returned to the browser, so an empty client
    // field is acceptable on re-deploy.
    if (!vercelToken || !vercelToken.trim()) {
      try {
        const s = await getSettings();
        vercelToken = (s && s.smartIpVercelToken) || "";
      } catch {}
    }

    if (!vercelToken || !vercelToken.trim()) {
      return NextResponse.json({ error: "Vercel API token required" }, { status: 400 });
    }
    if (!targetUrl) {
      return NextResponse.json({ error: "Target URL required (your 9Router Vercel URL)" }, { status: 400 });
    }

    const selectedRegions = REGIONS.filter((r) => regions.includes(r.id));
    // Deploy every selected region concurrently instead of sequentially, so
    // total runtime stays under the function timeout regardless of count.
    const results = await Promise.all(
      selectedRegions.map((region) => deployRegion(region, vercelToken)),
    );

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function deployRegion(region, vercelToken) {
  try {
    const projectName = `smart-ip-${region.id}-${Date.now().toString(36)}`;

    const deployRes = await fetch(`${VERCEL_API}/v13/deployments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        regions: [region.id],
        files: [
          { file: "api/relay.js", data: RELAY_CODE },
          { file: "package.json", data: JSON.stringify({ name: projectName, version: "1.0.0" }) },
          { file: "vercel.json", data: JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/api/relay" }] }) },
        ],
        projectSettings: { framework: null },
        target: "production",
      }),
    });

    if (!deployRes.ok) {
      const err = await readJson(deployRes, {});
      const text = err.error?.message || (typeof err === "string" ? err : JSON.stringify(err));
      return { region: region.id, error: text || `Deploy failed (HTTP ${deployRes.status})` };
    }

    const deployment = await deployRes.json().catch(() => null);
    if (!deployment || !deployment.id) {
      return { region: region.id, error: "Deployment created but returned no valid response" };
    }
    const ready = await pollDeployment(deployment.id, vercelToken);
    const relayUrl = `https://${ready.url}`;

    // Best-effort: drop deployment protection so 9Router can call the relay.
    const projectId = deployment.projectId || projectName;
    await fetch(`${VERCEL_API}/v9/projects/${projectId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ssoProtection: null }),
    }).catch(() => {});

    const pool = await createProxyPool({
      name: `smart-ip-${region.id}`,
      proxyUrl: relayUrl,
      type: "vercel",
      noProxy: "",
      isActive: true,
      strictProxy: false,
    });

    return {
      region: region.id,
      regionName: region.name,
      relayUrl,
      poolId: pool.id,
      status: "deployed",
    };
  } catch (err) {
    return { region: region.id, error: err.message };
  }
}
