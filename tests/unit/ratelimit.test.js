// Smart rate-limit subsystem tests (9Router/OmniRoute-style).
// Pure logic only — no Next/DB. Run with: npx vitest run unit/ratelimit.test.js
import { describe, it, expect } from "vitest";
import {
  parseRetryAfter,
  computeBackoff,
  classifyError,
  CircuitBreaker,
  BreakerState,
  hydrateBreaker,
  RateLimitManager,
  rankConnections,
} from "open-sse/ratelimit/index.js";

describe("backoff", () => {
  it("parses Retry-After delta-seconds", () => {
    expect(parseRetryAfter("30", 1000)).toBe(31000);
  });
  it("parses Retry-After HTTP-date", () => {
    expect(parseRetryAfter("Wed, 21 Oct 2026 00:00:10 GMT", 1000)).toBe(
      Date.parse("Wed, 21 Oct 2026 00:00:10 GMT")
    );
  });
  it("returns null on garbage / past date", () => {
    expect(parseRetryAfter("abc", 1000)).toBeNull();
    expect(parseRetryAfter(new Date(0).toUTCString(), 1000)).toBeNull();
  });
  it("computes exponential backoff capped at 30s", () => {
    expect(computeBackoff(1)).toBe(1000);
    expect(computeBackoff(3)).toBe(4000);
    expect(computeBackoff(20)).toBe(30000);
  });
});

describe("retry policy", () => {
  it("classifies status codes", () => {
    expect(classifyError({ status: 429 }).action).toBe("cooldown");
    expect(classifyError({ status: 400 }).action).toBe("drop");
    expect(classifyError({ status: 403 }).action).toBe("drop");
    expect(classifyError({ status: 404 }).action).toBe("drop");
    expect(classifyError({ status: 401 }).action).toBe("refresh");
    expect(classifyError({ status: 503 }).action).toBe("cooldown");
  });
  it("classifies by error phrase", () => {
    expect(classifyError({ status: 200, errorText: "you are being rate limited" }).action).toBe("cooldown");
    expect(classifyError({ status: 200, errorText: "model not found" }).action).toBe("drop");
  });
});

describe("circuit breaker", () => {
  it("transitions HEALTHY -> DEGRADED -> OPEN", () => {
    let br = new CircuitBreaker(null, 0);
    for (let i = 0; i < 3; i++) br.recordFailure();
    expect(br.state).toBe(BreakerState.DEGRADED);
    for (let i = 0; i < 5; i++) br.recordFailure();
    expect(br.state).toBe(BreakerState.OPEN);
    expect(br.canPass()).toBe(false);
  });
  it("recovers OPEN -> HALF_OPEN -> HEALTHY after cooldown", () => {
    let br = new CircuitBreaker(null, 0);
    for (let i = 0; i < 10; i++) br.recordFailure();
    const ho = hydrateBreaker(br.serialize(), 40000);
    expect(ho.state).toBe(BreakerState.HALF_OPEN);
    ho.recordSuccess();
    ho.recordSuccess();
    expect(ho.state).toBe(BreakerState.HEALTHY);
  });
  it("reopens on failure during HALF_OPEN", () => {
    let br = new CircuitBreaker(null, 0);
    for (let i = 0; i < 10; i++) br.recordFailure();
    const ho = hydrateBreaker(br.serialize(), 40000);
    ho.recordFailure();
    expect(ho.state).toBe(BreakerState.OPEN);
  });
});

describe("RateLimitManager", () => {
  const T = Date.now();
  const MODEL = "hy3free";

  it("429 locks model + provider cooldown and falls back, 400 does not", () => {
    const mgr = new RateLimitManager(T);
    const conn = {
      id: "c1", backoffLevel: 0,
      [`modelLock_${MODEL}`]: null,
      breakerState: "HEALTHY", breakerSince: new Date(T).toISOString(),
      breakerFailures: 0, breakerSuccessCount: 0, breakerHalfOpenProbes: 0, breakerLastFailureAt: null,
    };
    const r1 = mgr.markFailure({ provider: "oc", conn, model: MODEL, status: 429, errorText: "rate limit", now: T });
    expect(r1.shouldFallback).toBe(true);
    expect(r1.updates[`modelLock_${MODEL}`]).toBeTruthy();
    expect(r1.updates.providerCooldownUntil).toBeTruthy();

    const connAfter = { ...conn, ...r1.updates };
    expect(mgr.isConnBlocked(connAfter, { provider: "oc", model: MODEL, now: T })).toBe(true);
    const expired = new Date(T - 10000).toISOString();
    const connExpired = { ...connAfter, [`modelLock_${MODEL}`]: expired, providerCooldownUntil: expired, providerModelCooldownUntil: expired };
    expect(mgr.isConnBlocked(connExpired, { provider: "oc", model: MODEL, now: T })).toBe(false);

    const r2 = mgr.markFailure({ provider: "oc", conn, model: MODEL, status: 400, errorText: "bad", now: T });
    expect(r2.shouldFallback).toBe(false);
    expect(`modelLock_${MODEL}` in r2.updates).toBe(false);

    const r3 = mgr.markSuccess({ provider: "oc", conn: connAfter, model: MODEL, now: T });
    expect(r3.updates[`modelLock_${MODEL}`]).toBeNull();
    expect(r3.updates.breakerState).toBe("HEALTHY");
  });

  it("respects Retry-After (resetsAtMs)", () => {
    const mgr = new RateLimitManager(T);
    const conn = { id: "c1", backoffLevel: 0, breakerState: "HEALTHY", breakerSince: new Date(T).toISOString() };
    const r = mgr.markFailure({ provider: "oc", conn, model: MODEL, status: 429, errorText: "x", resetsAtMs: T + 90000, now: T });
    expect(r.cooldownMs).toBeGreaterThanOrEqual(89000);
    expect(r.cooldownMs).toBeLessThanOrEqual(91000);
  });

  it("no-auth provider: in-memory breaker escalates + provider cooldown", () => {
    const mgr = new RateLimitManager(T);
    const r1 = mgr.markFailure({ provider: "oc", conn: null, model: MODEL, status: 429, errorText: "x", now: T });
    const r2 = mgr.markFailure({ provider: "oc", conn: null, model: MODEL, status: 429, errorText: "x", now: T });
    expect(r2.cooldownMs).toBeGreaterThan(r1.cooldownMs);
    expect(r2.cooldownMs).toBeGreaterThanOrEqual(2000);
    expect(mgr.isProviderBlocked("oc", MODEL, T).blocked).toBe(true);
    expect(mgr.isProviderBlocked("oc", MODEL, T + 60000).blocked).toBe(false);
    const rs = mgr.markSuccess({ provider: "oc", conn: null, model: MODEL, now: T });
    expect(rs.updates.providerCooldownUntil).toBeNull();
  });
});

describe("scoring", () => {
  const T = Date.now();
  const MODEL = "hy3free";
  it("ranks healthy above degraded and sinks cooling candidates", () => {
    const a = { id: "a", backoffLevel: 0, [`modelLock_${MODEL}`]: null, breakerState: "HEALTHY", successCount: 10, failureCount: 0 };
    const b = { id: "b", backoffLevel: 3, [`modelLock_${MODEL}`]: null, breakerState: "DEGRADED", successCount: 2, failureCount: 8 };
    const ranked = rankConnections([b, a], { model: MODEL, now: T });
    expect(ranked[0].id).toBe("a");
    const c = { id: "c", backoffLevel: 0, [`modelLock_${MODEL}`]: new Date(T + 60000).toISOString(), breakerState: "HEALTHY", successCount: 10, failureCount: 0 };
    expect(rankConnections([c, a], { model: MODEL, now: T })[0].id).toBe("a");
  });
});
