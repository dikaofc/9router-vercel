/**
 * Rate-limit subsystem for the 9Router LLM gateway.
 *
 * Design (per the documented OmniRoute / 9Router model):
 *   - rate limit is treated as *state*, not a one-off error
 *   - hierarchical cooldown: provider  ->  provider+model  ->  connection+model
 *   - circuit breaker per connection (HEALTHY/DEGRADED/OPEN/HALF_OPEN)
 *   - candidate scoring (health + quota + latency + success + compat - cooldown)
 *   - explicit retry policy (429/5xx cooldown+fallback; 401 refresh; 400/403/404 drop)
 *   - Retry-After parsing with exponential backoff fallback
 *
 * Each concern is a separate module — never a single giant tryRequest().
 */
export * from "./config.js";
export * from "./backoff.js";
export * from "./retryPolicy.js";
export * from "./circuitBreaker.js";
export * from "./cooldown.js";
export * from "./scoring.js";
export * from "./manager.js";
