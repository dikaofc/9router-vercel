/**
 * Display banner — zero-dep replacement for figlet/gradient/chalk-animation.
 * Cross-platform: uses plain ANSI escape codes (works on Windows, Linux, macOS, Android).
 */
export function showBanner() {
  console.log("");
  console.log("  ╔══════════════════════════════════════╗");
  console.log("  ║      🚀 9Router — AI Router         ║");
  console.log("  ║      OAuth CLI for AI Providers      ║");
  console.log("  ╚══════════════════════════════════════╝");
  console.log("");
}

/**
 * Display simple banner (no animation)
 */
export function showSimpleBanner() {
  console.log("");
  console.log("  9Router — OAuth CLI for AI Providers");
  console.log("");
}

/**
 * Display success message
 */
export async function showSuccess(message) {
  console.log("");
  console.log(`  ✨ ${message}`);
  console.log("");
  return Promise.resolve();
}

/**
 * Display loading animation — terminal-native spinner (cross-platform)
 */
export function showLoading(text) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i]} ${text}`);
    i = (i + 1) % frames.length;
  }, 80);

  return {
    stop: () => {
      clearInterval(interval);
      process.stdout.write("\r");
    },
  };
}
