// Fast Code injector: biases the model toward terse, production-quality code by
// appending a system-prompt instruction. Works for all formats via systemInject.

import { injectSystemPrompt } from "./systemInject.js";
import { FAST_CODE_PROMPTS } from "./fastCodePrompts.js";

export function injectFastCode(body, format, level) {
  injectSystemPrompt(body, format, FAST_CODE_PROMPTS[level]);
}
