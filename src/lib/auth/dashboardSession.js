import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_DIR } from "@/lib/dataDir"
import { getSettings } from "@/lib/localDb";

const DEFAULT_PASSWORD = "123456";
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

// Simple HMAC secret for Vercel (deterministic, no JWT needed)
function getHmacSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  return crypto.createHash('sha256').update('9router-vercel-' + (process.env.VERCEL_PROJECT_NAME || 'default')).digest('hex');
}

function loadJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (IS_VERCEL) {
    return getHmacSecret();
  }

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

  // On Vercel: verify simple HMAC cookie
  if (IS_VERCEL) {
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());
      const expectedSig = crypto.createHmac("sha256", getHmacSecret()).update(decoded.p).digest("hex");
      if (decoded.s !== expectedSig) return false;
      const payload = JSON.parse(decoded.p);
      return payload.authenticated === true;
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
      return JSON.parse(decoded.p);
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
