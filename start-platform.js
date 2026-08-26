#!/usr/bin/env node

/**
 * 9Router Cross-Platform Start Script
 * 
 * Auto-detects platform and configures:
 * - Android Termux: Low memory, no detach, sql.js fallback
 * - Windows: Standard Node.js with Windows-specific optimizations
 * - Linux VPS: Production-ready with optional Docker support
 * - macOS: Standard with tray support
 * 
 * Usage:
 *   node start-platform.js [options]
 *   
 * Options:
 *   --port, -p      Port (default: 20128)
 *   --host, -H      Host (default: 0.0.0.0)
 *   --dev           Development mode (next dev)
 *   --no-browser    Don't open browser
 *   --low-memory    Force low memory mode (useful for old devices)
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ═══════════════════════════════════════════════════════════════════════════════
// Platform Detection
// ═══════════════════════════════════════════════════════════════════════════════

function detectPlatform() {
  const platform = process.platform;
  const arch = process.arch;
  
  // Termux detection
  const isTermux = fs.existsSync('/data/data/com.termux') || 
    (process.env.PREFIX && process.env.PREFIX.includes('com.termux')) ||
    (process.env.TERMUX_VERSION !== undefined);
  
  // WSL detection
  const isWSL = fs.existsSync('/proc/sys/fs/binfmt_misc/WSLInterop') ||
    (process.env.WSL_DISTRO_NAME !== undefined);
  
  // Docker detection
  const isDocker = fs.existsSync('/.dockerenv') ||
    (fs.existsSync('/proc/1/cgroup') && 
     fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker'));
  
  // CI/CD detection
  const isCI = process.env.CI === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITLAB_CI === 'true';

  // Railway detection (https://railway.app) — long-lived PaaS that injects a
  // dynamic PORT and has ephemeral disk (persist to sql.js, not a SQLite file).
  const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined ||
    process.env.RAILWAY_SERVICE_ID !== undefined ||
    process.env.RAILWAY_PROJECT_ID !== undefined;

  // Render detection (https://render.com) — Node.js PaaS with free tier
  const isRender = process.env.RENDER !== undefined ||
    process.env.RENDER_SERVICE_ID !== undefined ||
    (typeof process.env.RENDER_SERVICE_NAME !== 'undefined');

  // Netlify detection (https://netlify.com) — serverless edge functions
  const isNetlify = process.env.NETLIFY !== undefined ||
    process.env.NETLIFY_DEV !== undefined ||
    process.env.CONTEXT !== undefined;

  // Google Cloud Run detection — container-based serverless
  const isCloudRun = process.env.K_SERVICE !== undefined ||
    process.env.K_CONFIGURATION !== undefined;

  // Get available RAM
  const totalRAM = os.totalmem();
  const freeRAM = os.freemem();
  const isLowRAM = totalRAM < 2 * 1024 * 1024 * 1024; // < 2GB
  
  // Get CPU cores
  const cpuCores = os.cpus().length;
  
  return {
    platform,
    arch,
    isTermux,
    isWSL,
    isDocker,
    isCI,
    isRailway,
    isRender,
    isNetlify,
    isCloudRun,
    isLowRAM,
    totalRAM,
    freeRAM,
    cpuCores,
    isMobile: isTermux,
    isServer: !isTermux && !isWSL && (isDocker || isCI || platform === 'linux'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Memory Optimization
// ═══════════════════════════════════════════════════════════════════════════════

function getMemoryConfig(platformInfo, forceLowMemory = false) {
  const { isTermux, isLowRAM, totalRAM, cpuCores } = platformInfo;
  
  // Base memory limits (in MB)
  let maxOldSpaceSize;
  let maxSemifewSpaceSize;
  let maxYoungGenerationSize;
  
  if (isTermux || isLowRAM || forceLowMemory) {
    // Android Termux / Low-end device: Conservative limits
    if (totalRAM < 1 * 1024 * 1024 * 1024) {
      // < 1GB RAM: Ultra-low memory mode
      maxOldSpaceSize = 256;
      maxSemifewSpaceSize = 64;
      maxYoungGenerationSize = 32;
    } else if (totalRAM < 2 * 1024 * 1024 * 1024) {
      // 1-2GB RAM: Low memory mode
      maxOldSpaceSize = 384;
      maxSemifewSpaceSize = 96;
      maxYoungGenerationSize = 48;
    } else {
      // 2-4GB RAM: Standard mobile mode
      maxOldSpaceSize = 512;
      maxSemifewSpaceSize = 128;
      maxYoungGenerationSize = 64;
    }
  } else if (cpuCores <= 2) {
    // Low-end VPS
    maxOldSpaceSize = 1024;
    maxSemifewSpaceSize = 256;
    maxYoungGenerationSize = 128;
  } else {
    // Standard server/desktop
    maxOldSpaceSize = 4096;
    maxSemifewSpaceSize = 512;
    maxYoungGenerationSize = 256;
  }
  
  return {
    maxOldSpaceSize,
    maxSemifewSpaceSize,
    maxYoungGenerationSize,
    // Additional V8 flags for memory optimization
    v8Flags: [
      `--max-old-space-size=${maxOldSpaceSize}`,
      `--max-semi-space-size=${maxSemifewSpaceSize}`,
      '--optimize-for-size', // Optimize for memory over speed
      '--gc-interval=100', // More frequent GC
      '--no-warnings', // Suppress deprecation warnings
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Platform-Specific Configuration
// ═══════════════════════════════════════════════════════════════════════════════

function getPlatformConfig(platformInfo) {
  const { isTermux, isWSL, isDocker, isRailway, platform } = platformInfo;
  
  const config = {
    // Default environment variables
    env: {
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    
    // Node.js flags
    nodeFlags: [],
    
    // Spawn options
    spawnOptions: {
      stdio: 'inherit',
      detached: false, // Don't detach by default (keeps terminal alive)
    },
    
    // Server path
    serverPath: null,
    
    // Working directory
    cwd: __dirname,
    
    // Signal handling
    handleSignals: true,
    
    // Graceful shutdown
    gracefulShutdown: true,
  };
  
  // Termux-specific configuration
  if (isTermux) {
    config.env.PORT = config.env.PORT || '20128';
    config.env.HOSTNAME = '0.0.0.0';
    config.env.DATA_DIR = path.join(os.homedir(), '.9router');
    
    // Don't detach in Termux (keeps terminal alive)
    config.spawnOptions.detached = false;
    
    // Use sql.js (no native build)
    config.env.USE_SQLJS = '1';
    
    // Reduce logging
    config.env.LOG_LEVEL = 'warn';
    
    // Skip tray (not available in Termux)
    config.env.NO_TRAY = '1';
    
    // Disable browser opening
    config.env.NO_BROWSER = '1';
    
    console.log('📱 Termux detected - configuring for Android...');
    console.log('   - Using sql.js (no native build required)');
    console.log('   - Low memory mode enabled');
    console.log('   - Terminal will stay alive (no detach)');
  }
  
  // WSL-specific configuration
  if (isWSL) {
    config.env.PORT = config.env.PORT || '20128';
    config.env.HOSTNAME = '0.0.0.0';
    
    // WSL2 has better memory management
    console.log('🐧 WSL detected - configuring for Windows Subsystem for Linux...');
  }
  
  // Docker-specific configuration
  if (isDocker) {
    config.env.PORT = '20128';
    config.env.HOSTNAME = '0.0.0.0';
    config.env.DATA_DIR = '/app/data';

    console.log('🐳 Docker detected - configuring for container...');
  }

  // Railway-specific configuration (long-lived PaaS, ephemeral disk)
  if (isRailway) {
    // Railway injects PORT at runtime — never hardcode it.
    config.env.HOSTNAME = '0.0.0.0';
    // Ephemeral filesystem on deploy: use sql.js (no native build, in-memory DB
    // that serializes to the writable /tmp layer instead of a persisted SQLite file).
    config.env.USE_SQLJS = '1';
    // Railway provides its own volume mount if the user wires one; otherwise
    // fall back to /tmp so writes don't crash on the read-only image layer.
    config.env.DATA_DIR = process.env.DATA_DIR || '/tmp/.9router';

    console.log('🚄 Railway detected - configuring for managed PaaS...');
    console.log('   - Using injected PORT (do not hardcode)');
    console.log('   - Using sql.js (ephemeral disk)');
  }

  // Render-specific configuration (Node.js PaaS, free tier)
  if (isRender) {
    // Render injects PORT at runtime
    config.env.HOSTNAME = '0.0.0.0';
    // Render free tier has ephemeral disk — use sql.js
    config.env.USE_SQLJS = '1';
    config.env.DATA_DIR = process.env.DATA_DIR || '/tmp/.9router';
    // Render free tier sleeps after 15min idle — keep alive with background ping
    config.env.LOG_LEVEL = 'warn';

    console.log('🌐 Render detected - configuring for PaaS...');
    console.log('   - Using injected PORT (do not hardcode)');
    console.log('   - Using sql.js (ephemeral disk)');
    console.log('   - Free tier: 750h/month, sleeps after 15min idle');
  }

  // Netlify-specific configuration (serverless edge functions)
  if (isNetlify) {
    // Netlify handles routing — no need to set PORT
    config.env.HOSTNAME = '0.0.0.0';
    // Netlify is serverless — stateless, use env vars for config
    config.env.USE_SQLJS = '1';
    config.env.DATA_DIR = '/tmp/.9router';
    config.env.LOG_LEVEL = 'warn';

    console.log('🔷 Netlify detected - configuring for serverless...');
    console.log('   - Serverless edge functions');
    console.log('   - Stateless: use env vars for persistence');
  }

  // Google Cloud Run-specific configuration (container-based serverless)
  if (isCloudRun) {
    // Cloud Run injects PORT (default 8080, but Dockerfile sets 20128)
    config.env.HOSTNAME = '0.0.0.0';
    // Cloud Run containers have ephemeral disk — use sql.js
    config.env.USE_SQLJS = '1';
    config.env.DATA_DIR = process.env.DATA_DIR || '/tmp/.9router';

    console.log('☁️  Google Cloud Run detected - configuring for container...');
    console.log('   - Container-based serverless');
    console.log('   - Using sql.js (ephemeral disk)');
    console.log('   - Auto-scale 0 → N');
  }
  
  // Windows-specific configuration
  if (platform === 'win32') {
    config.spawnOptions.windowsHide = true;
    
    // Windows doesn't support Unix signals the same way
    config.handleSignals = false;
    
    console.log('🪟 Windows detected - configuring for Windows...');
  }
  
  // macOS-specific configuration
  if (platform === 'darwin') {
    console.log('🍎 macOS detected - configuring for macOS...');
  }
  
  // Linux VPS-specific configuration
  if (platform === 'linux' && !isTermux && !isDocker) {
    console.log('🐧 Linux VPS detected - configuring for production...');
  }
  
  return config;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Server Management
// ═══════════════════════════════════════════════════════════════════════════════

function findServerPath() {
  // Check for standalone build
  const standalonePath = path.join(__dirname, '.next', 'standalone', 'custom-server.js');
  if (fs.existsSync(standalonePath)) {
    return standalonePath;
  }
  
  // Check for development mode
  const devPath = path.join(__dirname, 'custom-server.js');
  if (fs.existsSync(devPath)) {
    return devPath;
  }
  
  // Check for server.js in standalone
  const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');
  if (fs.existsSync(serverPath)) {
    return serverPath;
  }
  
  return null;
}

function startServer(platformInfo, platformConfig, memoryConfig, options = {}) {
  const { devMode = false, lowMemory = false } = options;
  
  // Find server path
  let serverPath;
  if (devMode) {
    // Development mode: use next dev
    serverPath = require.resolve('next/dist/bin/next');
    platformConfig.spawnOptions.args = ['dev', '--port', process.env.PORT || '20128'];
  } else {
    serverPath = findServerPath();
    if (!serverPath) {
      console.error('❌ Server not found. Please run "npm run build" first.');
      process.exit(1);
    }
    platformConfig.spawnOptions.args = [serverPath];
  }
  
  // Combine Node.js flags
  const nodeFlags = [
    '--dns-result-order=ipv4first',
    ...memoryConfig.v8Flags,
    ...(platformConfig.nodeFlags || []),
  ];
  
  // Build environment
  const env = {
    ...process.env,
    ...platformConfig.env,
    ...memoryConfig.env,
  };
  
  // Log configuration
  console.log('\n🚀 Starting 9Router...');
  console.log(`   Platform: ${platformInfo.platform} (${platformInfo.arch})`);
  console.log(`   Node.js: ${process.version}`);
  console.log(`   RAM: ${Math.round(platformInfo.totalRAM / 1024 / 1024 / 1024 * 10) / 10}GB total, ${Math.round(platformInfo.freeRAM / 1024 / 1024 / 1024 * 10) / 10}GB free`);
  console.log(`   CPUs: ${platformInfo.cpuCores}`);
  console.log(`   Memory limit: ${memoryConfig.maxOldSpaceSize}MB`);
  console.log(`   Port: ${env.PORT || 20128}`);
  console.log(`   Host: ${env.HOSTNAME || '0.0.0.0'}`);
  console.log('');
  
  // Spawn server
  const child = spawn(process.execPath, nodeFlags, {
    ...platformConfig.spawnOptions,
    env,
  });
  
  // Handle errors
  child.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    process.exit(1);
  });
  
  // Handle exit
  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`\n⚠️  Server exited with code ${code}`);
    }
    process.exit(code || 0);
  });
  
  // Signal handling (Unix only)
  if (platformConfig.handleSignals) {
    const shutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      child.kill('SIGTERM');
      
      // Force kill after 5 seconds
      setTimeout(() => {
        console.log('⚡ Force killing server...');
        child.kill('SIGKILL');
        process.exit(1);
      }, 5000);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // SIGHUP: In Termux, don't exit on terminal close
    if (platformInfo.isTermux) {
      process.on('SIGHUP', () => {
        console.log('📱 Terminal closed in Termux - keeping server alive...');
        // Don't exit, keep running
      });
    } else {
      process.on('SIGHUP', () => shutdown('SIGHUP'));
    }
  }
  
  return child;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI Argument Parsing
// ═══════════════════════════════════════════════════════════════════════════════

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    port: process.env.PORT || '20128',
    host: process.env.HOSTNAME || '0.0.0.0',
    devMode: false,
    noBrowser: false,
    lowMemory: false,
    help: false,
    version: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
      case '-p':
        options.port = args[++i] || '20128';
        break;
      case '--host':
      case '-H':
        options.host = args[++i] || '0.0.0.0';
        break;
      case '--dev':
        options.devMode = true;
        break;
      case '--no-browser':
        options.noBrowser = true;
        break;
      case '--low-memory':
        options.lowMemory = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--version':
      case '-v':
        options.version = true;
        break;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
9Router Cross-Platform Start Script

Usage:
  node start-platform.js [options]

Options:
  --port, -p <port>     Port to run server (default: 20128)
  --host, -H <host>     Host to bind (default: 0.0.0.0)
  --dev                 Development mode (next dev)
  --no-browser          Don't open browser automatically
  --low-memory          Force low memory mode
  --help, -h            Show this help message
  --version, -v         Show version

Platform-Specific Notes:

  Android Termux:
    - Automatically detects Termux and configures for low memory
    - Uses sql.js (no native build required)
    - Terminal stays alive (no detach)
    - Recommended: Run with 'node start-platform.js' directly
  
  Windows:
    - Works with standard Node.js
    - Uses Windows-specific process management
    - Tray icon available via CLI
  
  Linux VPS:
    - Production-ready configuration
    - Can be run with Docker or directly
    - Supports systemd service
  
  macOS:
    - Full feature support
    - Tray icon in menu bar
    - Native process management

Examples:

  # Start on default port (20128)
  node start-platform.js

  # Start on custom port
  node start-platform.js --port 3000

  # Development mode
  node start-platform.js --dev

  # Low memory mode (for old devices)
  node start-platform.js --low-memory

  # Start without opening browser
  node start-platform.js --no-browser

  # Termux (Android) - just run:
  node start-platform.js
`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Entry Point
// ═══════════════════════════════════════════════════════════════════════════════

function main() {
  // Parse arguments
  const options = parseArgs();
  
  // Show help if requested
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  // Show version if requested
  if (options.version) {
    try {
      const pkg = require('./package.json');
      console.log(pkg.version);
    } catch {
      console.log('unknown');
    }
    process.exit(0);
  }
  
  // Set environment variables
  process.env.PORT = options.port;
  process.env.HOSTNAME = options.host;
  
  if (options.noBrowser) {
    process.env.NO_BROWSER = '1';
  }
  
  // Detect platform
  const platformInfo = detectPlatform();
  
  // Get memory configuration
  const memoryConfig = getMemoryConfig(platformInfo, options.lowMemory);
  
  // Get platform configuration
  const platformConfig = getPlatformConfig(platformInfo);
  
  // Start server
  startServer(platformInfo, platformConfig, memoryConfig, options);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  detectPlatform,
  getMemoryConfig,
  getPlatformConfig,
  startServer,
};
