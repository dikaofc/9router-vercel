// Context Saver injector: retains/compresses conversation context by appending
// a system-prompt instruction (alias "context7"). Works for all formats via the
// shared systemInject dispatcher.

import { injectSystemPrompt } from "./systemInject.js";
import { CONTEXT_SAVER_PROMPTS } from "./contextSaverPrompts.js";

export function injectContextSaver(body, format, level) {
  injectSystemPrompt(body, format, CONTEXT_SAVER_PROMPTS[level]);
}
