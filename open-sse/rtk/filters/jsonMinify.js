// Smart JSON compressor for tool_result content.
//  - Lossless whitespace minify (string-aware, O(n), never breaks strings).
//  - If the minified payload is still large, structurally sample huge
//    arrays/objects (keep both ends + a valid count placeholder) so the model
//    still receives parseable JSON without paying for thousands of items.
//  - Self-validating: if the result isn't valid JSON (input wasn't JSON), the
//    caller's fail-open path keeps the original text untouched.
import {
  JSON_VALIDATE_MAX, JSON_WALK_MIN, JSON_COMPACT_THRESHOLD, JSON_COMPACT_MAX,
  JSON_ARRAY_HEAD, JSON_ARRAY_TAIL, JSON_ARRAY_MIN, JSON_OBJ_MAX_KEYS, JSON_OBJ_SHOW,
  STRING_MAX,
} from "../constants.js";

// Truncate a single oversized string value (e.g. a 50KB log line or a base64
// blob). For data: URIs we replace the payload with a compact note — the model
// can't read raw base64 anyway, and keeping it would torch the token budget.
function truncateString(s) {
  if (s.length <= STRING_MAX) return s;
  const dataUri = s.match(/^(data:[\w/+-]+;base64,)/i);
  if (dataUri) {
    const approxBytes = Math.round((s.length - dataUri[1].length) * 0.75);
    return dataUri[1] + `…(${approxBytes} bytes base64 omitted)`;
  }
  return s.slice(0, STRING_MAX) + `…(+${s.length - STRING_MAX} chars)`;
}

// Strip insignificant whitespace WITHOUT touching string contents.
function stripWs(json) {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < json.length; i++) {
    const c = json[i];
    if (inStr) {
      out += c;
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === " " || c === "\t" || c === "\r" || c === "\n") continue;
    out += c;
  }
  return out;
}

// Recursively sample oversized arrays/objects, keeping both ends.
// The inserted placeholders are valid JSON values (strings), so the result
// always parses.
function sampleDeep(value) {
  if (typeof value === "string") return truncateString(value);

  if (Array.isArray(value)) {
    if (value.length > JSON_ARRAY_MIN) {
      const head = value.slice(0, JSON_ARRAY_HEAD);
      const tail = value.slice(value.length - JSON_ARRAY_TAIL);
      const omitted = value.length - JSON_ARRAY_HEAD - JSON_ARRAY_TAIL;
      return [...head.map(sampleDeep), `(…${omitted} more items)`, ...tail.map(sampleDeep)];
    }
    return value.map(sampleDeep);
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length > JSON_OBJ_MAX_KEYS) {
      const out = {};
      for (const k of keys.slice(0, JSON_OBJ_SHOW)) out[k] = sampleDeep(value[k]);
      out["(…omitted keys)"] = keys.length - JSON_OBJ_SHOW;
      return out;
    }
    const out = {};
    for (const k of keys) out[k] = sampleDeep(value[k]);
    return out;
  }
  return value;
}

export function jsonMinify(input) {
  const trimmed = input.trim();
  if (trimmed.length === 0) return input;
  if (trimmed[0] !== "{" && trimmed[0] !== "[") return input;

  const minified = stripWs(input);

  // Cheap validation: ensure we didn't corrupt valid JSON.
  if (minified.length <= JSON_VALIDATE_MAX) {
    try { JSON.parse(minified); } catch { return input; }
  }

  // Parse + walk (string truncation / array sampling) when the payload is big
  // enough that the walk is worth it. Truncating a single huge string value
  // matters even below the structural-compaction threshold.
  if (minified.length > JSON_WALK_MIN && minified.length <= JSON_COMPACT_MAX) {
    try {
      const compacted = sampleDeep(JSON.parse(minified));
      const out = JSON.stringify(compacted);
      if (out.length < minified.length) return out;
    } catch {
      // fall through to the lossless minified form
    }
  }

  return minified;
}

jsonMinify.filterName = "json-minify";
