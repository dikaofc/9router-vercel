import { describe, expect, it } from "vitest";
import { jsonMinify } from "open-sse/rtk/filters/jsonMinify.js";
import { stackTrace } from "open-sse/rtk/filters/stackTrace.js";
import { smartTruncate } from "open-sse/rtk/filters/smartTruncate.js";
import { autoDetectFilter } from "open-sse/rtk/autodetect.js";
import { compressMessages } from "open-sse/rtk/index.js";
import { urlCollapse } from "open-sse/rtk/filters/urlCollapse.js";
import { csvTable, looksLikeCsv } from "open-sse/rtk/filters/csvTable.js";

describe("jsonMinify (smart, lossless)", () => {
  it("minifies pretty JSON while staying valid and parseable", () => {
    const pretty = '{\n  "name": "x",\n  "nested": { "a": 1, "b": [1, 2, 3] }\n}';
    const out = jsonMinify(pretty);
    expect(out.length).toBeLessThan(pretty.length);
    const parsed = JSON.parse(out);
    expect(parsed.name).toBe("x");
    expect(parsed.nested.b.length).toBe(3);
  });

  it("samples huge arrays into valid JSON, keeping both ends + a count", () => {
    const big = JSON.stringify({
      items: Array.from({ length: 5000 }, (_, i) => ({ id: i, v: "value-" + i })),
    });
    const out = jsonMinify(big);
    expect(out.length).toBeLessThan(big.length);
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed.items)).toBe(true);
    expect(parsed.items.length).toBeLessThan(5000);
    expect(parsed.items[0].id).toBe(0);
    expect(parsed.items[parsed.items.length - 1].id).toBe(4999);
    expect(parsed.items.some((x) => typeof x === "string" && x.includes("more items"))).toBe(true);
  });

  it("passes through invalid JSON (fail-open)", () => {
    const notJson = "{\n  this is not json\n}";
    expect(jsonMinify(notJson)).toBe(notJson);
  });

  it("passes through non-JSON lists that look like arrays", () => {
    const list = "[a, b, c]";
    expect(jsonMinify(list)).toBe(list);
  });
});

describe("stackTrace (smart, keep root cause)", () => {
  const buildTrace = () => {
    const many = Array.from({ length: 60 }, (_, i) => `    at async run${i} (/app/server.js:${200 + i}:10)`);
    return [
      "TypeError: Cannot read properties of undefined (reading 'foo')",
      "    at handler (/app/server.js:12:34)",
      "    at processTicksAndRejections (node:internal/process/task_queues:95:5)",
      ...many,
      "Caused by: Error: db connection refused",
      "    at connect (/db/pool.js:5:1)",
      "    at async init (/db/pool.js:20:3)",
      "some context line that should be dropped",
    ].join("\n");
  };

  it("keeps root cause, caused-by, first frame; drops deep frames", () => {
    const trace = buildTrace();
    const out = stackTrace(trace);
    expect(out).toContain("TypeError: Cannot read properties of undefined");
    expect(out).toContain("Caused by: Error: db connection refused");
    expect(out).toContain("/app/server.js:12:34");
    expect(out.length).toBeLessThan(trace.length);
    expect(out).toContain("more frames omitted");
  });

  it("never grows the input", () => {
    const tiny = "TypeError: boom\n    at f (a.js:1:2)";
    expect(stackTrace(tiny).length).toBeLessThanOrEqual(tiny.length);
  });
});

describe("smartTruncate (signal-aware)", () => {
  const buildNoisy = () => [
    ...Array.from({ length: 300 }, (_, i) => `line ${i + 1}`),
    "ERROR: the real failure is here in the middle",
    ...Array.from({ length: 100 }, (_, i) => `line ${i + 301}`),
    ...Array.from({ length: 8 }, (_, i) => `tail ${i + 1}`),
  ].join("\n");

  it("keeps head, tail, and high-signal middle lines", () => {
    const noisy = buildNoisy();
    const out = smartTruncate(noisy);
    expect(out).toContain("line 1");
    expect(out).toContain("tail 8");
    expect(out).toContain("ERROR: the real failure is here in the middle");
    expect(out.length).toBeLessThan(noisy.length);
  });

  it("is a no-op below the line threshold", () => {
    const small = Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n");
    expect(smartTruncate(small)).toBe(small);
  });
});

describe("urlCollapse (dedupe endpoint/URL lists)", () => {
  it("collapses a list of URLs to a unique normalized set", () => {
    const list = Array.from({ length: 50 }, (_, i) => `https://api.example.com/users/${i}?token=abc${i}`).join("\n");
    const out = urlCollapse(list);
    expect(out).toContain("unique");
    expect(out).not.toContain("?token="); // query strings stripped
    expect(out.length).toBeLessThan(list.length);
  });

  it("passes through non-URL text", () => {
    const text = "just some logs\nwith no urls at all\nline three";
    expect(urlCollapse(text)).toBe(text);
  });
});

describe("autoDetectFilter routing", () => {
  it("routes JSON to json-minify", () => {
    expect(autoDetectFilter('{\n  "a": 1\n}')?.filterName).toBe("json-minify");
  });
  it("routes stack traces to stack-trace", () => {
    expect(autoDetectFilter("TypeError: boom\n    at f (a.js:1:2)")?.filterName).toBe("stack-trace");
  });
  it("routes git diffs to git-diff", () => {
    expect(autoDetectFilter("diff --git a/x b/x\n@@ -1 +1 @@")?.filterName).toBe("git-diff");
  });
  it("routes URL lists to url-collapse", () => {
    const list = Array.from({ length: 10 }, (_, i) => `https://x.com/a${i}?q=1`).join("\n");
    expect(autoDetectFilter(list)?.filterName).toBe("url-collapse");
  });
});

describe("compressMessages integration", () => {
  it("minifies a JSON tool_result and reports stats", () => {
    const bigJson =
      '{\n' +
      Array.from({ length: 60 }, (_, i) => `  "key_${i}": "value number ${i} with padding text to exceed the compress threshold",`).join("\n") +
      '\n  "status": "ok"\n}';
    const body = {
      messages: [
        { role: "user", content: "run it" },
        { role: "tool", content: bigJson },
      ],
    };
    const stats = compressMessages(body, true);
    const toolContent = body.messages[1].content;
    expect(JSON.parse(toolContent).status).toBe("ok");
    expect(toolContent.length).toBeLessThan(bigJson.length);
    expect(stats.bytesAfter).toBeLessThan(stats.bytesBefore);
  });

  it("preserves is_error traces (fail-open for debugging)", () => {
    const body = {
      messages: [{ role: "tool", content: '{\n  "error": "trace"\n}', is_error: true }],
    };
    const before = body.messages[0].content;
    compressMessages(body, true);
    expect(body.messages[0].content).toBe(before);
  });
});

describe("jsonMinify long-string / base64 truncation", () => {
  it("truncates a huge base64 data URI into a compact note", () => {
    const blob = "A".repeat(20000);
    const input = JSON.stringify({ name: "img", data: `data:image/png;base64,${blob}` });
    const out = jsonMinify(input);
    const parsed = JSON.parse(out);
    expect(parsed.data).toContain("data:image/png;base64,");
    expect(parsed.data).toContain("bytes base64 omitted");
    expect(parsed.data.length).toBeLessThan(blob.length);
    expect(out.length).toBeLessThan(input.length);
  });

  it("truncates an over-long plain string value with a note", () => {
    const long = "x".repeat(5000);
    const input = JSON.stringify({ note: long });
    const out = jsonMinify(input);
    const parsed = JSON.parse(out);
    expect(parsed.note).toContain("(+");
    expect(parsed.note.length).toBeLessThan(long.length);
  });

  it("keeps short strings intact (lossless)", () => {
    const input = JSON.stringify({ a: "short value", b: "another" });
    expect(jsonMinify(input)).toBe(input);
  });
});

describe("csvTable (large table compaction)", () => {
  const buildCsv = (rows) => [
    "id,name,score",
    ...Array.from({ length: rows }, (_, i) => `${i},user${i},${i * 7}`),
  ].join("\n");

  it("keeps header + sample rows, drops the middle", () => {
    const csv = buildCsv(200);
    const out = csvTable(csv);
    expect(out).toContain("id,name,score");
    expect(out).toContain("+189 rows"); // 201 total lines − 8 head − 4 tail = 189 dropped
    expect(out).toContain("199,user199"); // last row kept
    expect(out.length).toBeLessThan(csv.length);
  });

  it("routes CSV to csv-table", () => {
    expect(autoDetectFilter(buildCsv(200))?.filterName).toBe("csv-table");
  });

  it("routes a markdown table to csv-table", () => {
    const md = [
      "| col | val |",
      "| --- | --- |",
      ...Array.from({ length: 50 }, (_, i) => `| a${i} | b${i} |`),
    ].join("\n");
    expect(autoDetectFilter(md)?.filterName).toBe("csv-table");
  });

  it("does not misread source code as CSV", () => {
    const code = Array.from({ length: 20 }, (_, i) => `const x${i} = fn(a, b, c);`).join("\n");
    expect(looksLikeCsv(code)).toBe(false);
  });

  it("passes through small tables unchanged", () => {
    const small = "a,b,c\n1,2,3\n4,5,6";
    expect(csvTable(small)).toBe(small);
  });
});
