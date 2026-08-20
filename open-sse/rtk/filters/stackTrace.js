// Smart stack-trace compressor (JS/TS, Python, Java/C#, Rust panic).
// Keeps the root-cause message + the most specific frames + Caused-by chains,
// drops deep/repetitive frames and code-snippet lines. The model keeps enough
// to diagnose the bug without paying for a 2000-line trace.
import { STACK_TRACE_TOTAL_FRAMES_MAX, STACK_TRACE_NOTE_MAX } from "../constants.js";

const RE_ROOT = /^(?:Uncaught\s+)?[\w.]*(?:Error|Exception|Panic|Fault)\b\s*[:\n]|^panic:|^Traceback \(most recent call last\):|\s*panicked at /i;

const RE_JS_FRAME = /^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)\s*$/;
const RE_JS_FRAME_BARE = /^\s*at\s+(.+?):(\d+):(\d+)\s*$/;
const RE_PY_FRAME = /^\s*File "(.+?)", line (\d+), in (.+)$/;
const RE_JAVA_FRAME = /^\s*at\s+[\w$.<>]+\s*\([^)]*\)\s*(~\[.*\])?$/;
const RE_RUST_FRAME = /^\s*\d+:\s+[\w:]+/;
const RE_CAUSED = /^(Caused by|Suppressed):/i;
const RE_CODE_LINE = /^\s*\d+\s*\|\s/;
const RE_NOTE = /^\s*(= note:|warning:|help:)/i;

export function stackTrace(input) {
  const lines = input.split("\n");
  if (lines.length === 0) return input;

  const out = [];
  let frameBudget = STACK_TRACE_TOTAL_FRAMES_MAX;
  let omitted = 0;
  let notes = 0;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const t = line.trim();
    if (t === "") continue;

    // Root-cause / panic / traceback header — always keep.
    if (RE_ROOT.test(line)) { out.push(line); continue; }

    // Caused-by / Suppressed chains get a fresh frame budget so the nested
    // chain stays useful for diagnosis. (Keep the cumulative `omitted` count
    // so frames dropped before the chain are still reported.)
    if (RE_CAUSED.test(t)) { out.push(line); frameBudget = STACK_TRACE_TOTAL_FRAMES_MAX; continue; }

    // Frame lines (JS/TS, Python, Java/C#, Rust).
    if (RE_JS_FRAME.test(t) || RE_JS_FRAME_BARE.test(t) || RE_PY_FRAME.test(t) || RE_JAVA_FRAME.test(t) || RE_RUST_FRAME.test(t)) {
      if (frameBudget > 0) { out.push(line); frameBudget--; }
      else omitted++;
      continue;
    }

    // Code-snippet lines that sit under a frame — drop (no diagnostic value).
    if (RE_CODE_LINE.test(t)) continue;

    // Notes/warnings — keep a bounded number.
    if (RE_NOTE.test(t)) {
      if (notes < STACK_TRACE_NOTE_MAX) { out.push(line); notes++; }
      continue;
    }

    // Anything else: keep, but bounded so a wall of context doesn't slip through.
    if (out.length < STACK_TRACE_TOTAL_FRAMES_MAX) out.push(line);
  }

  if (omitted > 0) out.push(`... (${omitted} more frames omitted)`);

  const result = out.join("\n");
  // Never grow the input; fail-open to the original on any regression.
  if (result.length >= input.length) return input;
  return result;
}

stackTrace.filterName = "stack-trace";
