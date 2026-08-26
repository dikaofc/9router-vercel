import { NextResponse } from "next/server";
import { killAppProcesses, spawnUpdaterAndExit } from "@/lib/appUpdater";
import { verifyDashboardAuthToken } from "@/lib/auth/dashboardSession";

const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

export async function POST(request) {
  // N1 fix: on Vercel, this endpoint is useless (no filesystem for updater)
  // and dangerous (unauthenticated forced restart). Block entirely.
  if (IS_VERCEL) {
    return NextResponse.json(
      { success: false, message: "Update is not available on Vercel" },
      { status: 403 }
    );
  }

  // On self-host: require dashboard authentication
  const token = request.cookies.get("auth_token")?.value;
  if (!(await verifyDashboardAuthToken(token))) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json(
      { success: false, message: "Update is only available in production build (9router CLI)" },
      { status: 403 }
    );
  }

  try {
    // Kill sibling processes (cloudflared, MITM, stray next-server) to release file locks on Windows
    await killAppProcesses();
  } catch { /* best effort */ }

  // Schedule detached updater then exit current server process
  spawnUpdaterAndExit();

  return NextResponse.json({ success: true, message: "Updater started. This app will exit shortly." });
}
