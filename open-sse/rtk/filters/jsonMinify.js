// Smart JSON compressor for tool_result content.
//  - Lossless whitespace minify (string-aware, O(n), never breaks strings).
//  - If the minified payload is still large, structurally sample huge
//    arrays/objects (keep both ends + a valid count placeholder) so the model
//    still receives parseable JSON without paying for thousands of items.
//  - Self-validating: if the result isn't valid JSON (input wasn't JSON), the
//    caller's fail-open path keeps the original text untouched.
import {
  JSON_VALIDATE_MAX, JSON_COMPACT_THRESHOLD, JSON_COMPACT_MAX,
  JSON_ARRAY_HEAD, JSON_ARRAY_TAIL, JSON_ARRAY_MIN, JSON_OBJ_MAX_KEYS, JSON_OBJ_SHOW,
} from "../constants.js";

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

  // Structurally compact only when still large AND safely parseable.
  if (minified.length > JSON_COMPACT_THRESHOLD && minified.length <= JSON_COMPACT_MAX) {
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
