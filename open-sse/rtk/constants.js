// RTK port constants (mirror Rust defaults)
export const RAW_CAP = 10 * 1024 * 1024;      // 10 MiB
export const MIN_COMPRESS_SIZE = 500;          // bytes; skip tiny blobs
export const DETECT_WINDOW = 1024;             // autodetect peeks first N chars
export const GIT_DIFF_HUNK_MAX_LINES = 100;    // per-hunk line cap
export const GIT_DIFF_CONTEXT_KEEP = 3;        // context lines around changes
export const GIT_LOG_MAX_LINES = 200;          // gitLog line cap
export const DEDUP_LINE_MAX = 2000;            // dedupLog truncation cap

// Rust pipe_cmd.rs parity caps
export const GREP_PER_FILE_MAX = 10;           // match rust: matches.iter().take(10)
export const FIND_PER_DIR_MAX = 10;            // match rust: files.iter().take(10)
export const FIND_TOTAL_DIR_MAX = 20;          // match rust: dirs.iter().take(20)

// git status caps (rust config::limits())
export const STATUS_MAX_FILES = 10;            // config::limits().status_max_files
export const STATUS_MAX_UNTRACKED = 10;        // config::limits().status_max_untracked

// ls compact_ls (rtk/src/cmds/system/ls.rs)
export const LS_EXT_SUMMARY_TOP = 5;           // top-N extensions in summary
export const LS_NOISE_DIRS = [
  "node_modules", ".git", "target", "__pycache__",
  ".next", "dist", "build", ".cache", ".turbo",
  ".vercel", ".pytest_cache", ".mypy_cache", ".tox",
  ".venv", "venv",
  "env", // Python legacy virtualenv; .env (dotenv) intentionally excluded
  "coverage", ".nyc_output", ".DS_Store", "Thumbs.db",
  ".idea", ".vscode", ".vs", "*.egg-info", ".eggs"
];

// tree filter_tree_output cap (no rust cap, we add one to be safe)
export const TREE_MAX_LINES = 200;

// Cursor Glob "Result of search in '...' (total N files):" list
export const SEARCH_LIST_PER_DIR_MAX = 10;
export const SEARCH_LIST_TOTAL_DIR_MAX = 20;

// Smart truncate (port of filter.rs smart_truncate fallback)
export const SMART_TRUNCATE_HEAD = 120;        // lines kept from top
export const SMART_TRUNCATE_TAIL = 60;         // lines kept from bottom
export const SMART_TRUNCATE_MIN_LINES = 250;   // only kick in above this

// readNumbered (files with "  N|content" lines, e.g. Cursor read_file)
export const READ_NUMBERED_MIN_HIT_RATIO = 0.7;

// --- JSON-aware compression (smart: lossless minify + structural sampling) ---
// Most tool results today are JSON (API responses, curl/jq output, config reads).
// Whitespace-stripping is lossless (meaning preserved → model stays smart),
// and we only structurally sample when the payload is still large.
export const JSON_VALIDATE_MAX = 256 * 1024;   // JSON.parse-validate result up to this size
export const JSON_WALK_MIN = 4 * 1024;        // parse+walk (string truncation) above this
export const JSON_COMPACT_THRESHOLD = 16 * 1024; // minified still bigger → structural compaction
export const JSON_COMPACT_MAX = 2 * 1024 * 1024;  // parse-walk only below this (else skip compaction)
export const JSON_ARRAY_HEAD = 8;               // keep first N items of big arrays
export const JSON_ARRAY_TAIL = 4;               // keep last N items
export const JSON_ARRAY_MIN = 40;               // arrays longer than this get sampled
export const JSON_OBJ_MAX_KEYS = 80;            // objects with more keys get sampled
export const JSON_OBJ_SHOW = 50;

// --- Stack-trace compression (smart: keep root cause + key frames) ---
export const STACK_TRACE_TOTAL_FRAMES_MAX = 24; // frames kept across all chains
export const STACK_TRACE_NOTE_MAX = 6;           // `= note:`/`warning:` lines kept

// --- High-signal line detection (generic truncation stays useful, anti-bingung) ---
// Keeps error/warn/fail/panic/exception/... lines when truncating the middle so
// the model never loses the actual problem or answer.
export const SIGNAL_LINE_RE = /(^|\s)(error|errors|warn|warning|fail|failed|failure|panic|panicked|exception|fatal|crash|crashed|abort|aborted|denied|refused|timeout|timed out|segfault|traceback|undefined|not defined|not found|cannot|unable to|reject|rejected|thrown|threw|❌|✗|⛔)/i;
export const SMART_TRUNCATE_MID_KEEP = 16;       // high-signal middle lines kept

// --- Long-string / base64 truncation inside JSON (anti-goblok token sink) ---
// A single base64 blob or 50KB string inside a tool_result wrecks token count
// and the model can't use raw base64 anyway. Truncate with a clear note so the
// JSON stays valid and the model still knows what was there.
export const STRING_MAX = 1536;                   // keep first N chars of a long string value

// --- CSV / markdown-table compaction ---
export const CSV_MIN_LINES = 12;                  // only compress tables this big
export const CSV_HEAD = 8;                        // keep first N data rows
export const CSV_TAIL = 4;                        // keep last N data rows

// Filter name strings (Rust parity + JS extras)
export const FILTERS = {
  GIT_DIFF: "git-diff",
  GIT_STATUS: "git-status",
  GIT_LOG: "git-log",
  GREP: "grep",
  FIND: "find",
  LS: "ls",
  TREE: "tree",
  DEDUP_LOG: "dedup-log",
  SMART_TRUNCATE: "smart-truncate",
  READ_NUMBERED: "read-numbered",
  SEARCH_LIST: "search-list",
  BUILD_OUTPUT: "build-output",
  JSON_MINIFY: "json-minify",
  STACK_TRACE: "stack-trace",
  URL_COLLAPSE: "url-collapse",
  CSV_TABLE: "csv-table"
};
