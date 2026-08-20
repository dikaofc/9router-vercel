// Smart generic truncation (port concept of filter::smart_truncate).
// Keeps HEAD + TAIL, but also preserves high-signal lines (errors, warnings,
// failures, panics, "not found", etc.) from the MIDDLE so the model never
// loses the actual problem or answer when it sits between the head and tail.
import {
  SMART_TRUNCATE_HEAD, SMART_TRUNCATE_TAIL, SMART_TRUNCATE_MIN_LINES,
  SIGNAL_LINE_RE, SMART_TRUNCATE_MID_KEEP,
} from "../constants.js";

export function smartTruncate(input) {
  const lines = input.split("\n");
  if (lines.length < SMART_TRUNCATE_MIN_LINES) return input;

  const head = lines.slice(0, SMART_TRUNCATE_HEAD);
  const tail = lines.slice(lines.length - SMART_TRUNCATE_TAIL);
  const mid = lines.slice(SMART_TRUNCATE_HEAD, lines.length - SMART_TRUNCATE_TAIL);

  // De-duplicate signal lines so a repeated error doesn't bloat the middle.
  const midKept = [];
  const seen = new Set();
  for (const l of mid) {
    if (SIGNAL_LINE_RE.test(l)) {
      const key = l.trim().slice(0, 140);
      if (!seen.has(key)) { seen.add(key); midKept.push(l); }
    }
    if (midKept.length >= SMART_TRUNCATE_MID_KEEP) break;
  }

  const droppedMiddle = mid.length - midKept.length;
  const parts = [...head];

  if (midKept.length > 0) {
    parts.push(`... (${droppedMiddle} lines omitted; ${midKept.length} high-signal kept) ...`);
    parts.push(...midKept);
  } else if (droppedMiddle > 0) {
    parts.push(`... +${droppedMiddle} lines truncated`);
  }

  parts.push(...tail);
  return parts.join("\n");
}

smartTruncate.filterName = "smart-truncate";
