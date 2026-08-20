import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import { applyOutboundProxyEnv } from "@/lib/network/outboundProxy";
import { resetComboRotation } from "open-sse/services/combo.js";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SETTINGS_RESPONSE_HEADERS = {
  "Cache-Control": "no-store"
};

// Secrets must never be mass-assigned from request body (CWE-915)
const PROTECTED_SETTING_KEYS = ["password", "mitmSudoEncrypted"];

// Storage/cloud keys must never be returned to the dashboard client in plaintext.
// They are written to process.env at runtime and stored in the DB — redact on read.
const SECRET_PREFIXES = ["DIKA_", "NEXT_PUBLIC_DIKA_", "MONGODB_", "KV_REST_", "UPSTASH_REDIS_REST_"];
// Secrets stored server-side but that must never be returned to the browser.
const NEVER_RETURN_KEYS = ["smartIpVercelToken"];

function redactSecretKey(key) {
  for (const prefix of SECRET_PREFIXES) {
    if (key.startsWith(prefix)) return `*`.repeat(8);
  }
  if (NEVER_RETURN_KEYS.includes(key)) return `*`.repeat(8);
  return false;
}

function redactSecrets(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj || {})) {
    out[key] = redactSecretKey(key) || value;
  }
  return out;
}

async function detectPersistence() {
  try {
    const { getAdapter } = await import("@/lib/db/driver.js");
    const adapter = await getAdapter();
    const hasSupabaseEnv = !!(
      (process.env.NEXT_PUBLIC_DIKA_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL) &&
      (process.env.DIKA_SUPABASE_SERVICE_ROLE_KEY ||
        process.env.DIKA_SUPABASE_SECRET_KEY ||
        process.env.DIKA_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY)
    );
    let supabaseWriteOk = null;
    let supabaseError = null;
    let keyKind = null;
    if (adapter.driver === "vercel-supabase") {
      supabaseWriteOk = !adapter._failed && !adapter._readonly;
      supabaseError = adapter._lastError || null;
      keyKind = adapter._keyKind || null;
    }
    return { driver: adapter.driver, supabaseConfigured: hasSupabaseEnv, supabaseWriteOk, supabaseError, keyKind };
  } catch {
    return { driver: "uninitialized", supabaseConfigured: false };
  }
}

export async function GET() {
  try {
    const settings = await getSettings();
    const { password, oidcClientSecret, ...rest } = settings;
    const safeSettings = redactSecrets(rest);
    safeSettings.oidcConfigured = !!(safeSettings.oidcIssuerUrl && safeSettings.oidcClientId && oidcClientSecret);

    const enableRequestLogs = process.env.ENABLE_REQUEST_LOGS === "true";
    const enableTranslator = process.env.ENABLE_TRANSLATOR === "true";

    // On Vercel, password lives in INITIAL_PASSWORD env var, not in DB
    const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);
    const passwordExists = !!password || (IS_VERCEL && !!process.env.INITIAL_PASSWORD);

    const persistence = await detectPersistence();

    return NextResponse.json({
      ...safeSettings,
      enableRequestLogs,
      enableTranslator,
      hasPassword: passwordExists,
      persistence
    }, { headers: SETTINGS_RESPONSE_HEADERS });
  } catch (error) {
    console.log("Error getting settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();

    // Strip protected secrets before any internal handling sets them
    for (const key of PROTECTED_SETTING_KEYS) delete body[key];

    // If updating password, hash it
    if (body.newPassword) {
      const settings = await getSettings();
      const currentHash = settings.password;

      // Verify current password if it exists
      if (currentHash) {
        if (!body.currentPassword) {
          return NextResponse.json({ error: "Current password required" }, { status: 400 });
        }
        const isValid = await bcrypt.compare(body.currentPassword, currentHash);
        if (!isValid) {
          return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
        }
      } else {
        // First time setting password, no current password needed
        // Allow empty currentPassword or default "123456"
        if (body.currentPassword && body.currentPassword !== "123456") {
           return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
        }
      }

      const salt = await bcrypt.genSalt(10);
      body.password = await bcrypt.hash(body.newPassword, salt);
      delete body.newPassword;
      delete body.currentPassword;
    }

    if (Object.prototype.hasOwnProperty.call(body, "oidcClientSecret")) {
      if (!body.oidcClientSecret || !String(body.oidcClientSecret).trim()) {
        delete body.oidcClientSecret;
      }
    }

    const settings = await updateSettings(body);

    // If Supabase connection keys were updated, apply them to the running
    // instance's env and re-init the DB adapter so persistence takes effect
    // without a full restart. (Vercel still needs these as project env vars
    // for cold-start survival — see Supabase settings tab.)
    const supabaseKeys = Object.keys(body).filter(
      (k) => k.startsWith("DIKA_SUPABASE") || k.startsWith("NEXT_PUBLIC_DIKA_SUPABASE")
    );
    if (supabaseKeys.length) {
      for (const k of supabaseKeys) {
        if (body[k]) process.env[k] = body[k];
      }
      try {
        const { resetAdapter, getAdapterSync } = await import("@/lib/db/driver.js");
        let current = null;
        try { current = getAdapterSync().driver; } catch {}
        if (current !== "vercel-supabase") resetAdapter();
      } catch (e) {
        console.warn(`[settings] Supabase adapter re-init skipped: ${e.message}`);
      }
    }

    // Apply outbound proxy settings immediately (no restart required)
    if (
      Object.prototype.hasOwnProperty.call(body, "outboundProxyEnabled") ||
      Object.prototype.hasOwnProperty.call(body, "outboundProxyUrl") ||
      Object.prototype.hasOwnProperty.call(body, "outboundNoProxy")
    ) {
      applyOutboundProxyEnv(settings);
    }

    // Invalidate combo rotation state when strategy settings change
    if (
      Object.prototype.hasOwnProperty.call(body, "comboStrategy") ||
      Object.prototype.hasOwnProperty.call(body, "comboStickyRoundRobinLimit") ||
      Object.prototype.hasOwnProperty.call(body, "comboStrategies")
    ) {
      resetComboRotation();
    }

    if (
      Object.prototype.hasOwnProperty.call(body, "claudeAutoPing") ||
      Object.prototype.hasOwnProperty.call(body, "codexAutoPing")
    ) {
      // Keep the scheduler absent when no account opted in; load its provider graph only on demand.
      import("@/shared/services/quotaAutoPing")
        .then(({ configureQuotaAutoPing }) => {
          configureQuotaAutoPing(settings);
        })
        .catch((error) => console.warn("[AutoPing] settings update failed:", error.message));
    }

    const { password, oidcClientSecret, ...rest } = settings;
    const safeSettings = redactSecrets(rest);
    safeSettings.oidcConfigured = !!(safeSettings.oidcIssuerUrl && safeSettings.oidcClientId && oidcClientSecret);
    return NextResponse.json(safeSettings, { headers: SETTINGS_RESPONSE_HEADERS });
  } catch (error) {
    console.log("Error updating settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
