// Parse a shell/env block (KEY="value" or KEY=value, # comments, blank lines)
// into a plain object. Used by the Supabase settings tab so users can paste a
// whole .env-style block at once instead of entering keys one by one.
export function parseEnvBlock(text) {
  const out = {};
  if (!text) return out;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}
