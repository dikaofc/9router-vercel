export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

// Pi Agent config paths (supports multiple possible locations)
const getConfigPaths = () => {
  const homeDir = os.homedir();
  const platform = os.platform();

  // Common config locations for Pi Agent
  const paths = [
    path.join(homeDir, ".config", "pi-agent", "config.json"),
    path.join(homeDir, ".pi-agent", "config.json"),
    path.join(homeDir, ".pi", "config.json"),
  ];

  // Windows-specific paths
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    paths.unshift(path.join(appData, "pi-agent", "config.json"));
  }

  return paths;
};

const getConfigPath = () => {
  for (const p of getConfigPaths()) {
    try {
      require("fs").accessSync(p);
      return p;
    } catch {}
  }
  return getConfigPaths()[0]; // Return first path as default
};

// Check if Pi Agent is installed
const checkPiAgentInstalled = async () => {
  try {
    const isWindows = os.platform() === "win32";
    const command = isWindows ? "where pi-agent" : "which pi-agent";
    const env = isWindows
      ? { ...process.env, PATH: `${process.env.APPDATA}\\npm;${process.env.PATH}` }
      : process.env;
    await execAsync(command, { windowsHide: true, env });
    return true;
  } catch {
    // Check if any config file exists
    for (const p of getConfigPaths()) {
      try {
        await fs.access(p);
        return true;
      } catch {}
    }
    return false;
  }
};

const readConfig = async () => {
  try {
    const configPath = getConfigPath();
    const content = await fs.readFile(configPath, "utf-8");
    const stripped = content.replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(stripped);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    return null;
  }
};

const has9RouterConfig = (config) => {
  if (!config) return false;
  return !!(
    config.apiBase?.includes("9router") ||
    config.baseURL?.includes("9router") ||
    config.provider === "9router"
  );
};

// GET - Check Pi Agent and read current settings
export async function GET() {
  try {
    const isInstalled = await checkPiAgentInstalled();

    if (!isInstalled) {
      return NextResponse.json({
        installed: false,
        config: null,
        message: "Pi Agent is not installed",
      });
    }

    const config = await readConfig();

    return NextResponse.json({
      installed: true,
      config,
      has9Router: has9RouterConfig(config),
      configPath: getConfigPath(),
    });
  } catch (error) {
    console.log("Error checking pi-agent settings:", error);
    return NextResponse.json({ error: "Failed to check pi-agent settings" }, { status: 500 });
  }
}

// POST - Apply 9Router settings
export async function POST(request) {
  try {
    const { baseUrl, apiKey, model } = await request.json();

    if (!baseUrl || !apiKey) {
      return NextResponse.json({ error: "baseUrl and apiKey are required" }, { status: 400 });
    }

    const configPath = getConfigPath();
    const configDir = path.dirname(configPath);

    // Ensure directory exists
    await fs.mkdir(configDir, { recursive: true });

    // Read existing config or start fresh
    let config = {};
    try {
      const existing = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(existing);
    } catch { /* No existing config */ }

    // Normalize base URL
    const normalizedBaseUrl = baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;

    // Update config for Pi Agent (OpenAI-compatible)
    config.apiBase = normalizedBaseUrl;
    config.apiKey = apiKey;
    config.model = model || "gpt-4";
    config.provider = "9router";

    // Write config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: "Pi Agent settings applied successfully!",
      configPath,
    });
  } catch (error) {
    console.log("Error applying pi-agent settings:", error);
    return NextResponse.json({ error: "Failed to apply settings" }, { status: 500 });
  }
}

// DELETE - Remove 9Router settings
export async function DELETE() {
  try {
    const configPath = getConfigPath();

    let config = {};
    try {
      const existing = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(existing);
    } catch (error) {
      if (error.code === "ENOENT") {
        return NextResponse.json({ success: true, message: "No config file to reset" });
      }
    }

    // Remove 9Router settings
    delete config.apiBase;
    delete config.apiKey;
    delete config.provider;
    // Keep model as it might be used by other providers

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: "9Router settings removed from Pi Agent",
    });
  } catch (error) {
    console.log("Error resetting pi-agent settings:", error);
    return NextResponse.json({ error: "Failed to reset settings" }, { status: 500 });
  }
}
