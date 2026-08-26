import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_DIR } from "@/lib/dataDir"
import { getSettings } from "@/lib/localDb";

const DEFAULT_PASSWORD = "123456";
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

// Session expiry: 24 hours in milliseconds
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Get HMAC secret — CRITICAL: must be set via JWT_SECRET env var on Vercel.
// The old deterministic fallback (sha256 of project name) was guessable
// because VERCEL_PROJECT_NAME is public in the deploy URL.
function getHmacSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (IS_VERCEL) {
      // On Vercel without JWT_SECRET: generate a random per-cold-start secret.
      // Sessions won't survive cold starts, but the app works. Once the user
      // sets JWT_SECRET, sessions become stable. This replaces the old
      // deterministic fallback (sha256 of project name) which was guessable.
      if (!_perColdStartSecret) {
        _perColdStartSecret = crypto.randomBytes(32).toString("hex");
        console.warn("[Auth] No JWT_SECRET set on Vercel — using random per-cold-start secret. " +
          "Sessions will not survive cold starts. Set JWT_SECRET in Vercel env vars.");
      }
      return _perColdStartSecret;
    }
    // Local dev: generate a random secret (stored in file by loadJwtSecret)
    return null;
  }
  return secret;
}
let _perColdStartSecret = null;

function loadJwtSecret() {
  const envSecret = process.env.JWT_SECRET;
  if (envSecret) return envSecret;

  if (IS_VERCEL) {
    // Use per-cold-start random secret (getHmacSecret handles this)
    return getHmacSecret();
  }

  // Local dev: use file-based random secret
  const file = path.join(DATA_DIR, "jwt-secret");
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {}
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
  const generated = crypto.randomBytes(32).toString("hex");
  try {
    fs.writeFileSync(file, generated, { mode: 0o600 });
  } catch {}
  return generated;
}

const SECRET = new TextEncoder().encode(loadJwtSecret());

export function shouldUseSecureCookie(request) {
  const forceSecureCookie = process.env.AUTH_COOKIE_SECURE === "true";
  const forwardedProto = request?.headers?.get?.("x-forwarded-proto");
  const isHttpsRequest = forwardedProto === "https";
  return forceSecureCookie || isHttpsRequest;
}

export async function createDashboardAuthToken(claims = {}) {
  // On Vercel: use simple HMAC cookie instead of JWT (stable across cold starts)
  if (IS_VERCEL) {
    const payload = JSON.stringify({ authenticated: true, ...claims, ts: Date.now() });
    const sig = crypto.createHmac("sha256", getHmacSecret()).update(payload).digest("hex");
    return Buffer.from(JSON.stringify({ p: payload, s: sig })).toString("base64");
  }

  return new SignJWT({ authenticated: true, ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyDashboardAuthToken(token) {
  if (!token) return false;

  // On Vercel: verify simple HMAC cookie with expiry check
  if (IS_VERCEL) {
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());
      const expectedSig = crypto.createHmac("sha256", getHmacSecret()).update(decoded.p).digest("hex");
      if (decoded.s !== expectedSig) return false;
      const payload = JSON.parse(decoded.p);
      // F2 fix: validate session expiry — forged/leaked cookies expire after 24h
      if (payload.authenticated !== true) return false;
      if (payload.ts && (Date.now() - payload.ts) > SESSION_MAX_AGE_MS) return false;
      return true;
    } catch {
      return false;
    }
  }

  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function getDashboardAuthSession(token) {
  if (!token) return null;

  if (IS_VERCEL) {
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());
      const expectedSig = crypto.createHmac("sha256", getHmacSecret()).update(decoded.p).digest("hex");
      if (decoded.s !== expectedSig) return null;
      const payload = JSON.parse(decoded.p);
      // F2 fix: validate session expiry
      if (payload.ts && (Date.now() - payload.ts) > SESSION_MAX_AGE_MS) return null;
      return payload;
    } catch {
      return null;
    }
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function setDashboardAuthCookie(cookieStore, request, claims = {}) {
  const token = await createDashboardAuthToken(claims);
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "lax",
    path: "/",
  });
}

export function clearDashboardAuthCookie(cookieStore) {
  cookieStore.delete("auth_token");
}

export async function verifyDashboardPassword(password) {
  if (typeof password !== "string" || !password) return false;
  const settings = await getSettings();
  const storedHash = settings?.password;
  if (storedHash) return bcrypt.compare(password, storedHash);
  const initialPassword = process.env.INITIAL_PASSWORD || DEFAULT_PASSWORD;
  return password === initialPassword;
}
