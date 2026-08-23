/**
 * UI Helper Functions — zero-dep (no chalk, no ora)
 * Cross-platform: uses ANSI escape codes (works on Windows, Linux, macOS, Android).
 */
const esc = (code) => `\x1b[${code}m`;
const green = (s) => `${esc(32)}${s}${esc(39)}`;
const red = (s) => `${esc(31)}${s}${esc(39)}`;
const blue = (s) => `${esc(34)}${s}${esc(39)}`;
const yellow = (s) => `${esc(33)}${s}${esc(39)}`;
const grayColor = (s) => `${esc(90)}${s}${esc(39)}`;

export function success(message) {
  console.log(green(`\n✓ ${message}\n`));
}

export function error(message) {
  console.log(red(`\n✗ ${message}\n`));
}

export function info(message) {
  console.log(blue(`\n${message}\n`));
}

export function warn(message) {
  console.log(yellow(`\n⚠ ${message}\n`));
}

export function gray(message) {
  console.log(grayColor(message));
}

export function spinner(text) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  let stopped = false;
  const interval = setInterval(() => {
    if (stopped) return;
    process.stdout.write(`\r${frames[i]} ${text}`);
    i = (i + 1) % frames.length;
  }, 80);
  return {
    start: (t) => { text = t || text; },
    stop: (msg) => {
      stopped = true;
      clearInterval(interval);
      process.stdout.write(`\r${msg || text}\n`);
    },
    succeed: (msg) => {
      stopped = true;
      clearInterval(interval);
      process.stdout.write(`\r${green("✓")} ${msg || text}\n`);
    },
    fail: (msg) => {
      stopped = true;
      clearInterval(interval);
      process.stdout.write(`\r${red("✗")} ${msg || text}\n`);
    },
  };
}

export function printSection(title) {
  console.log(blue(`\n${title}\n`));
}

export function printKeyValue(key, value, isSuccess = false) {
  const color = isSuccess ? green : grayColor;
  console.log(color(`  ${key}: ${value}`));
}

export function printList(items, isSuccess = false) {
  const symbol = isSuccess ? "✓" : "✗";
  const color = isSuccess ? green : grayColor;
  items.forEach((item) => {
    console.log(color(`  ${symbol} ${item}`));
  });
}
