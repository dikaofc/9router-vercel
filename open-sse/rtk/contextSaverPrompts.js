// Context Saver (alias "context7") prompts injected into the system message to
// retain/compress conversation context across turns. Prompt-based — not a live
// Context7/MCP docs fetch. See injectContextSaver for the upgrade path.

export const CONTEXT_SAVER_LEVELS = {
  LIGHT: "light",
  FULL: "full",
};

const SHARED = "Treat this conversation as cumulative working memory. Preserve key facts, decisions, constraints, file paths and open questions across turns; do not re-ask what was already established.";

export const CONTEXT_SAVER_PROMPTS = {
  [CONTEXT_SAVER_LEVELS.LIGHT]: [
    "Context Saver (light): keep prior decisions in mind; don't repeat established facts or recap unnecessarily.",
  ],
  [CONTEXT_SAVER_LEVELS.FULL]: [
    SHARED,
    "When context is large, prefer concise references to earlier conclusions over restating them. Drop pleasantries and recaps unless asked.",
    "If a request depends on earlier context that is missing or ambiguous, ask ONE targeted question — do not reload the whole history verbatim.",
  ],
};
