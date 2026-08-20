import { describe, it, expect } from "vitest";
import { parseEnvBlock } from "../../src/lib/db/parseEnv.js";

describe("parseEnvBlock", () => {
  it("returns empty object for empty input", () => {
    expect(parseEnvBlock("")).toEqual({});
    expect(parseEnvBlock(null)).toEqual({});
  });

  it("strips double quotes", () => {
    expect(parseEnvBlock('DIKA_SUPABASE_ANON_KEY="abc.def"')).toEqual({
      DIKA_SUPABASE_ANON_KEY: "abc.def",
    });
  });

  it("handles unquoted values", () => {
    expect(parseEnvBlock("DIKA_POSTGRES_USER=postgres")).toEqual({
      DIKA_POSTGRES_USER: "postgres",
    });
  });

  it("strips single quotes", () => {
    expect(parseEnvBlock("DIKA_SUPABASE_PUBLISHABLE_KEY='sb_pub_xyz'")).toEqual({
      DIKA_SUPABASE_PUBLISHABLE_KEY: "sb_pub_xyz",
    });
  });

  it("ignores comments and blank lines", () => {
    const block = `# comment\n\nNEXT_PUBLIC_DIKA_SUPABASE_URL=https://x.supabase.co\n  # another\nDIKA_POSTGRES_HOST=db.x.supabase.co`;
    expect(parseEnvBlock(block)).toEqual({
      NEXT_PUBLIC_DIKA_SUPABASE_URL: "https://x.supabase.co",
      DIKA_POSTGRES_HOST: "db.x.supabase.co",
    });
  });

  it("parses a full pasted block (user format)", () => {
    const block = [
      'DIKA_SUPABASE_ANON_KEY="eyJ.anon"',
      'DIKA_SUPABASE_PUBLISHABLE_KEY="sb_pub_ppY7"',
      'NEXT_PUBLIC_DIKA_SUPABASE_URL="https://ctpqdwuzvsognanrwxct.supabase.co"',
      'DIKA_POSTGRES_PASSWORD="kdyW0gbodaI00xJI"',
      'DIKA_POSTGRES_URL="postgres://postgres.x:6543/postgres?sslmode=require"',
    ].join("\n");
    const out = parseEnvBlock(block);
    expect(out.NEXT_PUBLIC_DIKA_SUPABASE_URL).toBe("https://ctpqdwuzvsognanrwxct.supabase.co");
    expect(out.DIKA_POSTGRES_PASSWORD).toBe("kdyW0gbodaI00xJI");
    expect(Object.keys(out).length).toBe(5);
  });
});
