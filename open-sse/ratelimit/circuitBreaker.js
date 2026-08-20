import { BREAKER } from "./config.js";

export const BreakerState = {
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN",
};

/**
 * A pure circuit breaker.
 *
 * State transitions:
 *   HEALTHY  --(>=degradedAfter consecutive fails)--> DEGRADED
 *   DEGRADED --(>=openThreshold fails in window)--> OPEN
 *   OPEN     --(openCooldownMs passes)--> HALF_OPEN
 *   HALF_OPEN --(>=halfOpenSuccessToClose successes)--> HEALTHY
 *   HALF_OPEN --(any failure)--> OPEN
 *
 * The breaker is intentionally side-effect free: callers persist its
 * serialised form ({ state, since, failures, successCount, halfOpenProbes })
 * onto the connection / provider record so it survives process restarts
 * (important on serverless / Vercel where in-memory state is lost).
 */
export class CircuitBreaker {
  constructor(serialized = null, now = Date.now()) {
    const s = serialized || {};
    // NOTE: use ?? not || for `since` — a valid epoch of 0 must be preserved.
    this.state = s.state || BreakerState.HEALTHY;
    this.since = s.since ?? now;
    this.failures = s.failures || 0;
    this.successCount = s.successCount || 0;
    this.halfOpenProbes = s.halfOpenProbes || 0;
    this.lastFailureAt = s.lastFailureAt || 0;
    this._now = now;
  }

  serialize() {
    return {
      state: this.state,
      since: this.since,
      failures: this.failures,
      successCount: this.successCount,
      halfOpenProbes: this.halfOpenProbes,
      lastFailureAt: this.lastFailureAt,
    };
  }

  /** Can a request be let through right now? */
  canPass() {
    if (this.state === BreakerState.OPEN) {
      return this._now - this.since >= BREAKER.openCooldownMs;
    }
    if (this.state === BreakerState.HALF_OPEN) {
      return this.halfOpenProbes < BREAKER.halfOpenMaxProbes;
    }
    return true;
  }

  /** True only at the moment OPEN transitions to HALF_OPEN. */
  isHalfOpen() {
    return this.state === BreakerState.HALF_OPEN || (this.state === BreakerState.OPEN && this.canPass());
  }

  recordSuccess() {
    const now = this._now;
    if (this.state === BreakerState.HALF_OPEN) {
      this.successCount += 1;
      if (this.successCount >= BREAKER.halfOpenSuccessToClose) {
        this._to(BreakerState.HEALTHY, now);
        this.failures = 0;
        this.successCount = 0;
        this.halfOpenProbes = 0;
      }
      return this;
    }
    // Any success from DEGRADED/HEALTHY heals gradually.
    this.failures = 0;
    this.successCount = 0;
    if (this.state === BreakerState.DEGRADED) {
      this._to(BreakerState.HEALTHY, now);
    }
    return this;
  }

  recordFailure() {
    const now = this._now;
    // Reset window if last failure is old.
    if (this.lastFailureAt && now - this.lastFailureAt > BREAKER.windowMs) {
      this.failures = 0;
    }
    this.lastFailureAt = now;
    this.failures += 1;

    if (this.state === BreakerState.OPEN) {
      // Still open -> stay open, refresh timer if half-open window reached.
      if (this._now - this.since >= BREAKER.openCooldownMs) {
        this._to(BreakerState.HALF_OPEN, now);
        this.halfOpenProbes = 0;
        this.successCount = 0;
      }
      return this;
    }

    if (this.state === BreakerState.HALF_OPEN) {
      // A single failure while probing re-opens immediately.
      this._to(BreakerState.OPEN, now);
      this.halfOpenProbes = 0;
      this.successCount = 0;
      return this;
    }

    // HEALTHY or DEGRADED
    if (this.state === BreakerState.HEALTHY && this.failures >= BREAKER.degradedAfter) {
      this._to(BreakerState.DEGRADED, now);
    }
    if (this.failures >= BREAKER.openThreshold) {
      this._to(BreakerState.OPEN, now);
    }
    return this;
  }

  _to(state, now) {
    this.state = state;
    this.since = now;
  }
}

/**
 * Rehydrate a breaker from a persisted record, advancing OPEN->HALF_OPEN
 * based on elapsed time. Returns a CircuitBreaker instance.
 */
export function hydrateBreaker(record = {}, now = Date.now()) {
  const hasBreakerShape =
    record && (record.breakerState || record.breaker || record.state);
  let br;
  if (hasBreakerShape) {
    // Accept both the persisted connection form (breakerState/breakerSince/...)
    // and the serialize() form (state/since/...) for robustness.
    const s = record.breaker || record;
    br = new CircuitBreaker(
      {
        state: s.breakerState ?? s.state,
        since: s.breakerSince ?? s.since,
        failures: s.breakerFailures ?? s.failures ?? 0,
        successCount: s.breakerSuccessCount ?? s.successCount ?? 0,
        halfOpenProbes: s.breakerHalfOpenProbes ?? s.halfOpenProbes ?? 0,
        lastFailureAt: s.breakerLastFailureAt ?? s.lastFailureAt ?? 0,
      },
      now
    );
  } else {
    br = new CircuitBreaker(null, now);
  }
  // Advance time-based transitions (OPEN -> HALF_OPEN) on read.
  if (br.state === BreakerState.OPEN && br.canPass()) {
    br.state = BreakerState.HALF_OPEN;
    br.since = now;
    br.halfOpenProbes = 0;
    br.successCount = 0;
  }
  return br;
}
