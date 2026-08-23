// Vercel-safe browser opener.
// On Vercel there is no local browser / display, so we just print the auth URL
// instead of spawning a browser process (which would throw on the serverless
// runtime). On self-hosted / Termux we try `open` and fall back to printing the
// URL if no browser is available (e.g. headless Termux).
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

export async function openBrowser(url) {
  if (IS_VERCEL) {
    console.log(`\n🌐 Open this URL in your browser to authenticate:\n${url}\n`);
    return;
  }
  try {
    const open = (await import("open")).default;
    await open(url);
  } catch {
    console.log(`\n🌐 Open this URL in your browser to authenticate:\n${url}\n`);
  }
}
