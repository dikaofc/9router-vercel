import { BreakerState, hydrateBreaker } from "./circuitBreaker.js";
import { connModelCooling } from "./cooldown.js";

const HEALTH_SCORE = {
  [BreakerState.HEALTHY]: 1.0,
  [BreakerState.DEGRADED]: 0.6,
  [BreakerState.HALF_OPEN]: 0.4,
  [BreakerState.OPEN]: 0.1,
};

function clamp01(n) {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function healthScore(conn, now) {
  const br = hydrateBreaker(conn, now);
  return HEALTH_SCORE[br.state] ?? 0.5;
}

function successRateScore(conn) {
  const s = conn.successCount ?? conn.okCount ?? 0;
  const fails = conn.failureCount ?? conn.failCount ?? 0;
  const total = s + fails;
  if (total <= 0) return 0.8; // unknown -> neutral-positive
  return clamp01(s / total);
}

function latencyScore(conn) {
  const lat = conn.avgLatencyMs ?? conn.lastLatencyMs;
  if (!lat || lat <= 0) return 0.7;
  // 200ms -> ~0.9, 2000ms -> ~0.1
  return clamp01(1 - (lat - 200) / 1800);
}

function costScore(conn) {
  const c = conn.costPer1k;
  if (c == null || c <= 0) return 0.7;
  // cheaper is better: $0 -> 1, $10/1k -> ~0.1
  return clamp01(1 - c / 10);
}

function compatibilityScore(conn, ctx) {
  const caps = ctx?.requiredCapabilities;
  if (!caps || Object.keys(caps).length === 0) return 1;
  const have = conn.capabilities || {};
  let ok = 0;
  let total = 0;
  for (const [k, v] of Object.entries(caps)) {
    total += 1;
    if (have[k] === v || have[k] === true) ok += 1;
  }
  if (total === 0) return 1;
  return ok / total;
}

/**
 * Score a single candidate connection. Higher = better. Range ~0..100.
 *
 * @param {object} conn - connection record (may include breaker + modelLock_*)
 * @param {object} ctx - { model, requiredCapabilities, now }
 * @returns {number}
 */
export function scoreConnection(conn, ctx = {}) {
  const now = ctx.now ?? Date.now();
  try {
    const health = healthScore(conn, now);
    const cooling = connModelCooling(conn, ctx.model, now);
    const availability = cooling ? 0 : 1;
    const success = successRateScore(conn);
    const latency = latencyScore(conn);
    const cost = costScore(conn);
    const compat = compatibilityScore(conn, ctx);
    const backoffPenalty = Math.min(0.3, (conn.backoffLevel || 0) * 0.05);

    // Weighted sum (availability + health dominate).
    const raw =
      availability * 0.30 +
      health * 0.25 +
      success * 0.15 +
      compat * 0.12 +
      latency * 0.10 +
      cost * 0.08 -
      backoffPenalty;

    return Math.round(clamp01(raw) * 1000) / 10; // 0..100, 1 decimal
  } catch {
    return 50; // never let scoring crash selection
  }
}

/**
 * Rank connections best-first. Filters out cooling / OPEN-breaker candidates
 * unless `keepAll` is set (used as a last-resort fallback).
 *
 * @param {object[]} conns
 * @param {object} ctx
 * @param {{keepBlocked?: boolean}} [opts]
 * @returns {object[]} sorted copy (best first)
 */
export function rankConnections(conns, ctx = {}, opts = {}) {
  const now = ctx.now ?? Date.now();
  const scored = (conns || []).map((c) => ({
    conn: c,
    score: scoreConnection(c, ctx),
    blocked:
      connModelCooling(c, ctx.model, now) ||
      hydrateBreaker(c, now).state === BreakerState.OPEN,
  }));

  scored.sort((a, b) => {
    // never pick a blocked candidate over an available one
    if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    return b.score - a.score;
  });

  if (opts.keepBlocked) return scored.map((s) => s.conn);
  // drop blocked unless nothing else remains
  const available = scored.filter((s) => !s.blocked).map((s) => s.conn);
  return available.length > 0 ? available : scored.map((s) => s.conn);
}
