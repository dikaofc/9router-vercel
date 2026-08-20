// Fast Code prompts injected into the system message to bias the model toward
// terse, production-quality code: shortest correct solution, minimal boilerplate.

export const FAST_CODE_LEVELS = {
  LIGHT: "light",
  FULL: "full",
};

export const FAST_CODE_PROMPTS = {
  [FAST_CODE_LEVELS.LIGHT]: [
    "Fast Code (light): shortest correct code; skip boilerplate and unrequested abstractions.",
  ],
  [FAST_CODE_LEVELS.FULL]: [
    "Fast Code mode: produce the shortest correct solution. Prefer stdlib and built-ins; avoid new dependencies and scaffolding.",
    "No boilerplate, no interfaces/factories for single implementations, no 'for later' config. Deletion over addition.",
    "Make it runnable: validate trust-boundary input, handle the error cases that cause data loss; skip ceremony.",
    "Reply with the code, then at most two lines on what was skipped and when to add it.",
  ],
};
