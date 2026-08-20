import { isModelLockActive, buildModelLockUpdate, getEarliestModelLockUntil } from "../services/accountFallback.js";

/**
 * Hierarchical cooldown store.
 *
 * Three levels (most-specific wins for "is this candidate blocked?"):
 *   1. provider            — whole provider temporarily unusable
 *   2. provider + model    — one model is limited across the provider
 *   3. connection + model  — one account is limited on one model
 *
 * Levels 1 & 2 live in an in-memory Map (per process). On serverless they are
 * rebuilt each cold start, which is fine — level 3 (the connection's
 * `modelLock_*` fields, persisted to the DB) is the durable, cross-invocation
 * state and is handled by the helpers at the bottom of this file.
 */
export class CooldownStore {
  constructor(now = Date.now()) {
    /** @type {Map<string, number>} key -> epoch ms until */
    this.map = new Map();
    this._now = now;
  }

  static providerKey(provider) {
    return `p::${provider}`;
  }
  static providerModelKey(provider, model) {
    return `pm::${provider}::${model}`;
  }

  set(key, untilMs) {
    if (untilMs == null) return;
    this.map.set(key, untilMs);
  }

  isActive(key, now = this._now) {
    const until = this.map.get(key);
    if (!until) return false;
    if (until <= now) {
      this.map.delete(key);
      return false;
    }
    return true;
  }

  remaining(key, now = this._now) {
    const until = this.map.get(key);
    if (!until) return 0;
    if (until <= now) {
      this.map.delete(key);
      return 0;
    }
    return until - now;
  }

  clear(key) {
    this.map.delete(key);
  }

  // --- provider level ---
  markProvider(provider, untilMs) {
    this.set(CooldownStore.providerKey(provider), untilMs);
  }
  isProviderActive(provider, now) {
    return this.isActive(CooldownStore.providerKey(provider), now);
  }
  providerRemaining(provider, now) {
    return this.remaining(CooldownStore.providerKey(provider), now);
  }

  // --- provider + model level ---
  markProviderModel(provider, model, untilMs) {
    if (!model) return;
    this.set(CooldownStore.providerModelKey(provider, model), untilMs);
  }
  isProviderModelActive(provider, model, now) {
    if (!model) return false;
    return this.isActive(CooldownStore.providerModelKey(provider, model), now);
  }
  providerModelRemaining(provider, model, now) {
    if (!model) return 0;
    return this.remaining(CooldownStore.providerModelKey(provider, model), now);
  }
}

// ---------------------------------------------------------------------------
// Connection + model level — backed by the persisted `modelLock_*` fields so
// the cooldown survives cold starts / multiple serverless instances.
// (Re-uses existing accountFallback helpers to stay compatible with the UI.)
// ---------------------------------------------------------------------------

export function connModelCooling(conn, model, now = Date.now()) {
  return isModelLockActive(conn, model);
}

export function connModelRemaining(conn, model, now = Date.now()) {
  const until = getEarliestModelLockUntil(conn);
  if (!until) return 0;
  const ms = new Date(until).getTime() - now;
  return ms > 0 ? ms : 0;
}

export function buildConnModelCooldown(model, cooldownMs, now = Date.now()) {
  return buildModelLockUpdate(model, cooldownMs);
}

export function buildConnModelClear(model) {
  const key = model ? `modelLock_${model}` : "modelLock___all";
  return { [key]: null };
}
