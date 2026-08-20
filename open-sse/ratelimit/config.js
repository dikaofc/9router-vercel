/**
 * Central configuration for the rate-limit subsystem.
 *
 * Everything that controls timing / thresholds lives here so the behaviour
 * can be tuned in one place and is not scattered across executor code.
 */

// ---------------------------------------------------------------------------
// Exponential backoff (used for 429 / rate-limit state)
// attempt 1 -> 1s, 2 -> 2s, 3 -> 4s, 4 -> 8s, 5 -> 16s, then capped at 30s.
// ---------------------------------------------------------------------------
export const BACKOFF = {
  baseMs: 1000,
  factor: 2,
  maxMs: 30 * 1000,
  maxLevel: 12,
};

// ---------------------------------------------------------------------------
// Circuit breaker
//   HEALTHY  --(repeated failures)-->  DEGRADED  --(threshold)-->  OPEN
//   OPEN  --(cooldown)-->  HALF_OPEN  --(success)--> HEALTHY
//                                  \--(failure)--> OPEN
// ---------------------------------------------------------------------------
export const BREAKER = {
  // consecutive failures on a single (provider/connection) before DEGRADED
  degradedAfter: 3,
  // total failures within the window before OPEN
  openThreshold: 6,
  // how long OPEN stays open before moving to HALF_OPEN
  openCooldownMs: 30 * 1000,
  // how many probes are allowed while HALF_OPEN
  halfOpenMaxProbes: 3,
  // successful probes needed to close the breaker
  halfOpenSuccessToClose: 2,
  // sliding window length for the failure counter
  windowMs: 5 * 60 * 1000,
};

// ---------------------------------------------------------------------------
// Cooldown durations (ms)
// ---------------------------------------------------------------------------
export const COOLDOWN = {
  transient: 30 * 1000, // generic / unknown transient error
  long: 2 * 60 * 1000, // auth / quota / permanent-ish
  providerTransient: 15 * 1000, // provider-wide transient (all accounts limited)
  maxRateLimit: 30 * 60 * 1000, // hard cap on upstream-reported limits
};

// ---------------------------------------------------------------------------
// Retry policy — which HTTP statuses are retryable / fallable, which are not.
//   retry     : safe to retry in place (limited attempts)
//   cooldown  : back off + fall through to next candidate
//   refresh   : credential problem -> refresh token / try next account
//   drop      : permanent client-side error -> do NOT retry or fall back
// ---------------------------------------------------------------------------
export const RETRY_POLICY = {
  // back-off + fall through to the next candidate (account / model / provider)
  cooldown: new Set([429, 500, 502, 503, 504, 507, 509]),
  // limited in-place retry
  retry: new Set([408, 425, 429]),
  // credential issue -> refresh / rotate account, do not ban the model
  refresh: new Set([401, 407]),
  // permanent -> do not retry / fall back
  drop: new Set([400, 403, 404, 405, 406, 410, 422]),
};

// Phrases that always mean "rate limited" even when the status is ambiguous.
export const RATE_LIMIT_PHRASES = [
  "rate limit",
  "too many requests",
  "quota exceeded",
  "quota exhausted",
  "capacity",
  "overloaded",
  "slow down",
  "try again later",
  "request limit",
  "usage limit",
];

// Phrases that mean a permanent client error (drop, no retry).
export const PERMANENT_PHRASES = [
  "model not found",
  "does not exist",
  "invalid request",
  "improperly formed",
  "bad request",
  "forbidden",
  "permission denied",
  "not allowed",
];
