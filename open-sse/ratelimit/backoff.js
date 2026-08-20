import { BACKOFF } from "./config.js";

/**
 * Parse a Retry-After header value into an absolute epoch-ms timestamp.
 * Supports both the delta-seconds form ("30") and the HTTP-date form
 * ("Wed, 21 Oct 2026 07:53:21 GMT").
 *
 * @param {string|number|null|undefined} value
 * @param {number} [now] - current epoch ms (injectable for tests)
 * @returns {number|null} epoch ms, or null if unparseable
 */
export function parseRetryAfter(value, now = Date.now()) {
  if (value == null) return null;
  const str = String(value).trim();
  if (!str) return null;

  // delta-seconds
  if (/^\d+$/.test(str)) {
    const secs = parseInt(str, 10);
    if (!Number.isFinite(secs) || secs < 0) return null;
    return now + secs * 1000;
  }

  // HTTP-date
  const asDate = Date.parse(str);
  if (!Number.isNaN(asDate)) {
    // ignore dates in the past (clock skew / garbage)
    return asDate > now ? asDate : null;
  }
  return null;
}

/**
 * Clamp an epoch-ms timestamp to [now, now + maxMs].
 */
export function clampCooldown(epochMs, { maxMs = BACKOFF.maxMs, now = Date.now() } = {}) {
  if (epochMs == null || Number.isNaN(epochMs)) return null;
  const min = now;
  const max = now + maxMs;
  return Math.min(Math.max(epochMs, min), max);
}

/**
 * Compute exponential backoff duration (ms) for a given level.
 * level 1 -> base (1s), level 2 -> 2s, level 3 -> 4s ... capped at maxMs.
 *
 * @param {number} level - 1-based backoff level
 * @param {{baseMs?:number,factor?:number,maxMs?:number}} [opts]
 * @returns {number} cooldown duration in ms
 */
export function computeBackoff(level, opts = {}) {
  const base = opts.baseMs ?? BACKOFF.baseMs;
  const factor = opts.factor ?? BACKOFF.factor;
  const max = opts.maxMs ?? BACKOFF.maxMs;
  const lvl = Math.max(1, Math.min(level || 1, BACKOFF.maxLevel));
  const ms = base * Math.pow(factor, lvl - 1);
  return Math.min(ms, max);
}

/**
 * Given a current backoff level, return the next level (capped).
 */
export function nextBackoffLevel(level) {
  return Math.min((level || 0) + 1, BACKOFF.maxLevel);
}
