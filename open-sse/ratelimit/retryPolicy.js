import { RETRY_POLICY, RATE_LIMIT_PHRASES, PERMANENT_PHRASES, FALLTHROUGH_PHRASES, COOLDOWN } from "./config.js";

/**
 * Classify an upstream error into an action the router should take.
 *
 *   cooldown : back off + fall through to the next candidate
 *             (account / model / provider). This is how rate limits are
 *             treated as *state*, not a one-off failure.
 *   refresh  : credential problem -> refresh token / rotate to next account,
 *             do NOT ban the model.
 *   retry    : safe to retry in place a limited number of times.
 *   drop     : permanent client error -> do NOT retry or fall back.
 *
 * @param {object} args
 * @param {number} args.status      - HTTP status code
 * @param {string} [args.errorText] - upstream error message
 * @param {boolean} [args.hasRetryAfter] - upstream gave a Retry-After hint
 * @returns {{ action: 'cooldown'|'refresh'|'retry'|'drop', retryable: boolean, reason: string }}
 */
export function classifyError({ status, errorText = "", hasRetryAfter = false } = {}) {
  const code = Number(status);
  const text = typeof errorText === "string" ? errorText.toLowerCase() : "";
  const hasRatePhrase = RATE_LIMIT_PHRASES.some((p) => text.includes(p));
  const hasPermanentPhrase = PERMANENT_PHRASES.some((p) => text.includes(p));
  const hasFallthroughPhrase = FALLTHROUGH_PHRASES.some((p) => text.includes(p));

  // Explicit status wins first.
  if (RETRY_POLICY.refresh.has(code)) {
    return { action: "refresh", retryable: true, reason: `credential (${code})` };
  }
  // A 400 that names an unavailable model is a fall-through, not a drop: on a
  // combo the router should try the next candidate instead of failing. Check
  // this BEFORE the generic drop rule so "Model is unavailable" wins.
  if (hasFallthroughPhrase) {
    return { action: "cooldown", retryable: true, reason: "model_unavailable_fallthrough" };
  }
  if (RETRY_POLICY.drop.has(code) || hasPermanentPhrase) {
    return { action: "drop", retryable: false, reason: `permanent (${code})` };
  }
  if (hasRatePhrase || code === 429) {
    return { action: "cooldown", retryable: true, reason: "rate_limit" };
  }
  if (RETRY_POLICY.retry.has(code)) {
    return { action: "retry", retryable: true, reason: `transient_retry (${code})` };
  }
  if (RETRY_POLICY.cooldown.has(code)) {
    return { action: "cooldown", retryable: true, reason: `transient (${code})` };
  }

  // No clear signal: if the upstream hinted a retry, treat as cooldown,
  // otherwise a generic short transient cooldown is the safe default.
  if (hasRetryAfter) {
    return { action: "cooldown", retryable: true, reason: "retry_after_hint" };
  }
  return { action: "cooldown", retryable: true, reason: `unknown (${code || "no-status"})` };
}

/**
 * Cooldown duration for a non-rate-limit transient error.
 */
export function transientCooldownMs(code) {
  return COOLDOWN.transient;
}

/**
 * Should the router fall back to the next candidate for this error?
 * 400/403/404/etc. must NOT trigger fallback (they would just fail again).
 */
export function shouldFallback(status, errorText = "") {
  const { action } = classifyError({ status, errorText });
  return action !== "drop";
}
