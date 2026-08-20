// Collapse long lists of URLs/endpoints (e.g. "https://example.com/a/b?id=.."
// one per line, or a JSON array of url strings) into a compact unique set.
// Keeps every distinct origin + path prefix so the LLM knows what exists,
// but drops query strings, fragments, and exact duplicates.
// Fail-open: any error returns the input unchanged.
import { MIN_COMPRESS_SIZE } from "../constants.js";

const MAX_URL_KEPT = 200;
const URL_LINE_RE = /^(https?|wss?):\/\/\S+$/i;

export function looksLikeUrlList(input) {
  const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return false;
  let urlCount = 0;
  for (const line of lines) {
    if (URL_LINE_RE.test(line)) urlCount++;
  }
  return urlCount / lines.length >= 0.6;
}

function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.search = "";
    // Keep scheme + host + pathname (trim trailing slash), drop query/fragment
    const out = u.origin + u.pathname.replace(/\/+$/, "");
    return out;
  } catch {
    return null;
  }
}

export function urlCollapse(input) {
  if (typeof input !== "string") return input;
  if (input.length < MIN_COMPRESS_SIZE) return input;

  try {
    if (!looksLikeUrlList(input)) return input;

    const seen = new Set();
    const ordered = [];
    for (const raw of input.split("\n")) {
      const line = raw.trim();
      if (!URL_LINE_RE.test(line)) continue;
      const norm = normalizeUrl(line);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      ordered.push(norm);
    }

    if (ordered.length === 0) return input;

    const total = input.trim().split("\n").filter(Boolean).length;
    let out = `URLs (${ordered.length} unique):\n`;
    const keep = ordered.slice(0, MAX_URL_KEPT);
    out += keep.join("\n");
    if (ordered.length > MAX_URL_KEPT) {
      out += `\n+${ordered.length - MAX_URL_KEPT} more`;
    }
    if (total > ordered.length) {
      out += `\n(${total - ordered.length} duplicates dropped)`;
    }
    if (out.length >= input.length) return input;
    return `${out}\n`;
  } catch {
    return input;
  }
}

urlCollapse.filterName = "url-collapse";