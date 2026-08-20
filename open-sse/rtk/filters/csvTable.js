// Compact large CSV / markdown tables. Keeps the header (schema) plus a sample
// of the first and last rows, and tells the model how many rows were dropped.
// The model keeps the column structure + representative data without paying for
// thousands of identical-shape rows. Fail-open: any error returns input unchanged.
import { CSV_MIN_LINES, CSV_HEAD, CSV_TAIL } from "../constants.js";

// Strict header check: comma-separated simple tokens (no code-like chars such as
// { } = ( )), so source code with commas is NOT misread as a CSV.
const RE_CSV_HEADER = /^[\w\s%$.\-]+,[\w\s%$.\-]+(,[\w\s%$.\-]+)*$/;
const RE_MD_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

export function looksLikeCsv(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return false;
  if (!RE_CSV_HEADER.test(lines[0])) return false;
  const cols = lines[0].split(",").length;
  if (cols < 2) return false;
  let consistent = 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].split(",").length === cols) consistent++;
  }
  return consistent / (lines.length - 1) >= 0.7;
}

export function looksLikeMarkdownTable(text) {
  const lines = text.split("\n");
  const hasSep = lines.some((l) => RE_MD_SEP.test(l));
  const hasBar = lines.some((l) => l.includes("|"));
  if (!hasSep || !hasBar) return false;
  // must have a real header row (>=2 cells) above the separator
  const sepIdx = lines.findIndex((l) => RE_MD_SEP.test(l));
  return sepIdx > 0 && lines[sepIdx - 1].split("|").filter(Boolean).length >= 2;
}

export function csvTable(input) {
  if (typeof input !== "string") return input;
  const lines = input.split("\n");
  if (lines.length < CSV_MIN_LINES) return input;

  const headN = Math.min(CSV_HEAD, lines.length);
  const tailN = Math.min(CSV_TAIL, lines.length);
  const top = lines.slice(0, headN);
  const bottom = lines.slice(lines.length - tailN);
  const dropped = lines.length - headN - tailN;

  const out = [...top];
  if (dropped > 0) out.push(`... (+${dropped} rows) ...`);
  out.push(...bottom);

  const result = out.join("\n");
  if (result.length >= input.length) return input; // never grow
  return result;
}

csvTable.filterName = "csv-table";
csvTable.looksLikeCsv = looksLikeCsv;
csvTable.looksLikeMarkdownTable = looksLikeMarkdownTable;
