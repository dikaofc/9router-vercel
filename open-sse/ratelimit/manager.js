import { CooldownStore, connModelCooling, buildConnModelCooldown, buildConnModelClear } from "./cooldown.js";
import { CircuitBreaker, hydrateBreaker, BreakerState } from "./circuitBreaker.js";
import { classifyError } from "./retryPolicy.js";
import { parseRetryAfter, computeBackoff, nextBackoffLevel, clampCooldown } from "./backoff.js";
import { COOLDOWN } from "./config.js";

/**
 * RateLimitManager — the orchestrator that ties together:
 *   - retry-policy classification (what to do with a given status)
 *   - exponential backoff + Retry-After parsing
 *   - hierarchical cooldown (provider / provider+model / connection+model)
 *   - circuit breaker (HEALTHY/DEGRADED/OPEN/HALF_OPEN)
 *
 * It is deliberately stateless about *where* state is stored: durable state
 * (breaker fields, modelLock_*, provider*CooldownUntil) lives on the
 * connection DB record and is passed in/out via the `conn` argument and the
 * returned `updates` object. The in-memory CooldownStore is a per-process
 * cache for the provider / provider+model levels.
 */
export class RateLimitManager {
  constructor(now = Date.now()) {
    this.store = new CooldownStore(now);
    this._now = now;
    // In-memory circuit-breaker state for no-auth / free providers that have
    // no DB connection record. Persisted across calls within a process; resets
    // on a serverless cold start (acceptable — re-learned within seconds).
    this.providerBreaker = new Map();
  }

  now() {
    return this._now;
  }

  // -------------------------------------------------------------------------
  // Record a failure (upstream error for a provider/connection/model).
  // Returns the action + a DB `updates` object the caller should persist.
  // -------------------------------------------------------------------------
  markFailure({ provider, conn = null, model = null, status, errorText = "", resetsAtMs = null, now = this._now }) {
    // For no-auth / free providers there is no DB connection, so keep the
    // circuit-breaker + backoff state in an in-memory map keyed by provider.
    const effConn = conn || (provider ? this.providerBreaker.get(provider) || {} : null);
    const policy = classifyError({ status, errorText });
    const isRateOrTransient = policy.action === "cooldown" || policy.action === "retry";

    // --- decide cooldown duration ---
    let cooldownMs = 0;
    let retryAfterEpoch = null;

    if (resetsAtMs && resetsAtMs > now) {
      retryAfterEpoch = clampCooldown(resetsAtMs, { maxMs: COOLDOWN.maxRateLimit, now });
      cooldownMs = retryAfterEpoch - now;
    } else if (policy.action === "cooldown") {
      const level = nextBackoffLevel(effConn?.backoffLevel || 0);
      cooldownMs = computeBackoff(level);
      retryAfterEpoch = now + cooldownMs;
    } else if (policy.action === "retry") {
      cooldownMs = COOLDOWN.transient;
      retryAfterEpoch = now + cooldownMs;
    } else if (policy.action === "refresh") {
      cooldownMs = COOLDOWN.long;
      retryAfterEpoch = now + cooldownMs;
    }
    // 'drop' -> no cooldown lock (would just fail again); still record breaker.

    // --- circuit breaker (durable, on the connection record) ---
    const br = hydrateBreaker(effConn, now);
    br.recordFailure();
    const breakerFields = serializeBreaker(br);

    // --- hierarchical cooldown writes ---
    const updates = { ...breakerFields };

    // connection + model lock (only for rate/transient — not for permanent drops)
    if (isRateOrTransient && model) {
      Object.assign(updates, buildConnModelCooldown(model, cooldownMs));
    }

    // provider + model + provider levels (in-memory cache + durable field)
    if (isRateOrTransient) {
      if (model) {
        this.store.markProviderModel(provider, model, retryAfterEpoch);
        updates.providerModelCooldownUntil = new Date(retryAfterEpoch).toISOString();
      }
      this.store.markProvider(provider, retryAfterEpoch);
      updates.providerCooldownUntil = new Date(retryAfterEpoch).toISOString();
    }

    if (policy.action === "cooldown" || policy.action === "retry") {
      updates.backoffLevel = nextBackoffLevel(effConn?.backoffLevel || 0);
    }

    updates.testStatus = "unavailable";
    updates.lastError = typeof errorText === "string" ? errorText.slice(0, 200) : "Provider error";
    updates.errorCode = status;
    updates.lastErrorAt = new Date(now).toISOString();

    // Persist provider-breaker state for no-auth providers (in-memory only).
    if (!conn && provider) {
      this.providerBreaker.set(provider, {
        breakerState: updates.breakerState,
        breakerSince: updates.breakerSince,
        breakerFailures: updates.breakerFailures,
        breakerSuccessCount: updates.breakerSuccessCount,
        breakerHalfOpenProbes: updates.breakerHalfOpenProbes,
        breakerLastFailureAt: updates.breakerLastFailureAt,
        backoffLevel: updates.backoffLevel,
      });
    }

    return {
      action: policy.action,
      shouldFallback: policy.action !== "drop",
      cooldownMs,
      retryAfterEpoch,
      retryAfterHuman: formatHuman(retryAfterEpoch, now),
      breakerState: br.state,
      updates,
    };
  }

  // -------------------------------------------------------------------------
  // Record a success.
  // -------------------------------------------------------------------------
  markSuccess({ provider, conn = null, model = null, now = this._now }) {
    const effConn = conn || (provider ? this.providerBreaker.get(provider) || {} : null);
    const br = hydrateBreaker(effConn, now);
    br.recordSuccess();
    const breakerFields = serializeBreaker(br);

    const updates = { ...breakerFields };
    if (model) Object.assign(updates, buildConnModelClear(model));
    // a success anywhere on this provider/model heals the shared levels
    if (model) {
      this.store.clear(CooldownStore.providerModelKey(provider, model));
      updates.providerModelCooldownUntil = null;
    }
    this.store.clear(CooldownStore.providerKey(provider));
    updates.providerCooldownUntil = null;
    updates.backoffLevel = 0;
    updates.testStatus = "active";
    updates.lastError = null;
    updates.errorCode = null;
    updates.lastErrorAt = null;
    // Heal provider-breaker state for no-auth providers (in-memory only).
    if (!conn && provider) {
      this.providerBreaker.set(provider, {
        breakerState: updates.breakerState,
        breakerSince: updates.breakerSince,
        breakerFailures: updates.breakerFailures,
        breakerSuccessCount: updates.breakerSuccessCount,
        breakerHalfOpenProbes: updates.breakerHalfOpenProbes,
        breakerLastFailureAt: updates.breakerLastFailureAt,
        backoffLevel: 0,
      });
    }
    return { updates };
  }

  // -------------------------------------------------------------------------
  // Is a specific connection blocked right now for this model?
  // -------------------------------------------------------------------------
  isConnBlocked(conn, { provider, model = null, now = this._now } = {}) {
    if (!conn) return false;
    const br = hydrateBreaker(conn, now);
    if (br.state === BreakerState.OPEN) return true;
    if (connModelCooling(conn, model, now)) return true;
    if (model && this.store.isProviderModelActive(provider, model, now)) return true;
    if (this.store.isProviderActive(provider, now)) return true;
    // durable provider-level field (set by a sibling connection)
    const pUntil = conn.providerCooldownUntil ? new Date(conn.providerCooldownUntil).getTime() : 0;
    if (pUntil > now) return true;
    const pmUntil = model && conn.providerModelCooldownUntil ? new Date(conn.providerModelCooldownUntil).getTime() : 0;
    if (pmUntil > now) return true;
    return false;
  }

  /**
   * Provider-level block check (for no-auth / free providers that have no DB
   * connection record). Reads the in-memory hierarchical store only.
   * @returns {{ blocked: boolean, retryAfterMs: number }}
   */
  isProviderBlocked(provider, model = null, now = this._now) {
    if (!provider) return { blocked: false, retryAfterMs: 0 };
    if (model && this.store.isProviderModelActive(provider, model, now)) {
      return { blocked: true, retryAfterMs: this.store.providerModelRemaining(provider, model, now) };
    }
    if (this.store.isProviderActive(provider, now)) {
      return { blocked: true, retryAfterMs: this.store.providerRemaining(provider, now) };
    }
    return { blocked: false, retryAfterMs: 0 };
  }

  /** Read remaining cooldown (ms) for a connection, for UI / retry timing. */
  remainingMs(conn, { provider, model = null, now = this._now } = {}) {
    if (!conn) return 0;
    if (connModelCooling(conn, model, now)) return connModelRemain(conn, model, now);
    if (model && this.store.isProviderModelActive(provider, model, now))
      return this.store.providerModelRemaining(provider, model, now);
    if (this.store.isProviderActive(provider, now)) return this.store.providerRemaining(provider, now);
    return 0;
  }
}

function serializeBreaker(br) {
  const s = br.serialize();
  return {
    breakerState: s.state,
    breakerSince: new Date(s.since).toISOString(),
    breakerFailures: s.failures,
    breakerSuccessCount: s.successCount,
    breakerHalfOpenProbes: s.halfOpenProbes,
    breakerLastFailureAt: s.lastFailureAt ? new Date(s.lastFailureAt).toISOString() : null,
  };
}

function connModelRemain(conn, model, now) {
  const until = conn[`modelLock_${model}`] || conn.modelLock___all;
  if (!until) return 0;
  const ms = new Date(until).getTime() - now;
  return ms > 0 ? ms : 0;
}

function formatHuman(epochMs, now) {
  if (!epochMs || epochMs <= now) return "now";
  const sec = Math.ceil((epochMs - now) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// Singleton per process (acceptable: durable state lives on the connection).
export const rateLimitManager = new RateLimitManager();
