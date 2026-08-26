#!/data/data/com.termux/files/usr/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# 9Router Termux Start Script
# ═══════════════════════════════════════════════════════════════════════════════
# Optimized for Android Termux with low memory devices
# 
# Features:
# - Auto-detects low RAM devices
# - Uses sql.js (no native build required)
# - Keeps terminal alive (no detach)
# - Graceful shutdown on terminal close
# - Memory-optimized Node.js flags
#
# Usage:
#   chmod +x start-termux.sh
#   ./start-termux.sh
#
# Or with options:
#   ./start-termux.sh --port 3000 --low-memory
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════════

PORT="${PORT:-20128}"
HOST="${HOSTNAME:-0.0.0.0}"
DATA_DIR="${HOME}/.9router"
LOG_FILE="${DATA_DIR}/termux.log"
PID_FILE="${DATA_DIR}/9router.pid"

# ═══════════════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════════════

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    9Router for Termux                       ║"
    echo "║              AI Routing Gateway - Android                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [[ "${DEBUG:-0}" == "1" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# System Detection
# ═══════════════════════════════════════════════════════════════════════════════

detect_system() {
    log_info "Detecting system configuration..."
    
    # Check if running in Termux
    if [[ ! -d "/data/data/com.termux" ]] && [[ "${PREFIX:-}" != *com.termux* ]]; then
        log_warn "This script is optimized for Termux. Using generic settings."
    else
        log_info "✓ Termux detected"
    fi
    
    # Get total RAM
    TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
    TOTAL_RAM_GB=$((TOTAL_RAM_MB / 1024))
    
    log_info "Total RAM: ${TOTAL_RAM_MB}MB (${TOTAL_RAM_GB}GB)"
    
    # Get free RAM
    FREE_RAM_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    FREE_RAM_MB=$((FREE_RAM_KB / 1024))
    
    log_info "Free RAM: ${FREE_RAM_MB}MB"
    
    # Get CPU info
    CPU_CORES=$(nproc 2>/dev/null || echo "1")
    log_info "CPU Cores: ${CPU_CORES}"
    
    # Get storage
    STORAGE_FREE=$(df -h /data 2>/dev/null | tail -1 | awk '{print $4}' || echo "unknown")
    log_info "Free Storage: ${STORAGE_FREE}"
    
    # Detect low memory device
    IS_LOW_MEMORY=0
    if [[ ${TOTAL_RAM_MB} -lt 2048 ]]; then
        IS_LOW_MEMORY=1
        log_warn "Low memory device detected (< 2GB RAM)"
    fi
    
    # Detect very low memory device
    IS_VERY_LOW_MEMORY=0
    if [[ ${TOTAL_RAM_MB} -lt 1024 ]]; then
        IS_VERY_LOW_MEMORY=1
        log_warn "Very low memory device detected (< 1GB RAM)"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# Memory Optimization
# ═══════════════════════════════════════════════════════════════════════════════

calculate_memory_limits() {
    log_info "Calculating memory limits..."
    
    # Base memory limit calculation
    if [[ ${IS_VERY_LOW_MEMORY} -eq 1 ]]; then
        # < 1GB RAM: Ultra-low memory mode
        MAX_OLD_SPACE_SIZE=256
        MAX_SEMI_SPACE_SIZE=32
        GC_INTERVAL=50
        log_warn "Ultra-low memory mode: ${MAX_OLD_SPACE_SIZE}MB limit"
    elif [[ ${IS_LOW_MEMORY} -eq 1 ]]; then
        # 1-2GB RAM: Low memory mode
        MAX_OLD_SPACE_SIZE=384
        MAX_SEMI_SPACE_SIZE=48
        GC_INTERVAL=75
        log_warn "Low memory mode: ${MAX_OLD_SPACE_SIZE}MB limit"
    elif [[ ${TOTAL_RAM_MB} -lt 4096 ]]; then
        # 2-4GB RAM: Standard mobile mode
        MAX_OLD_SPACE_SIZE=512
        MAX_SEMI_SPACE_SIZE=64
        GC_INTERVAL=100
        log_info "Standard mobile mode: ${MAX_OLD_SPACE_SIZE}MB limit"
    else
        # > 4GB RAM: Full mode
        MAX_OLD_SPACE_SIZE=1024
        MAX_SEMI_SPACE_SIZE=128
        GC_INTERVAL=150
        log_info "Full mode: ${MAX_OLD_SPACE_SIZE}MB limit"
    fi
    
    # Calculate Node.js flags
    NODE_FLAGS=(
        "--max-old-space-size=${MAX_OLD_SPACE_SIZE}"
        "--max-semi-space-size=${MAX_SEMI_SPACE_SIZE}"
        "--optimize-for-size"
        "--gc-interval=${GC_INTERVAL}"
        "--no-warnings"
        "--dns-result-order=ipv4first"
    )
    
    log_debug "Node.js flags: ${NODE_FLAGS[*]}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Environment Setup
# ═══════════════════════════════════════════════════════════════════════════════

setup_environment() {
    log_info "Setting up environment..."
    
    # Create data directory
    mkdir -p "${DATA_DIR}"
    
    # Set environment variables
    export PORT="${PORT}"
    export HOSTNAME="${HOST}"
    export NODE_ENV="production"
    export NEXT_TELEMETRY_DISABLED="1"
    export DATA_DIR="${DATA_DIR}"
    export USE_SQLJS="1"  # Use sql.js (no native build)
    export NO_TRAY="1"    # No tray in Termux
    export NO_BROWSER="1" # No browser in Termux
    export LOG_LEVEL="warn"
    
    # Node.js memory optimization
    export NODE_OPTIONS="${NODE_FLAGS[*]}"
    
    log_info "Environment configured:"
    log_info "  PORT: ${PORT}"
    log_info "  HOSTNAME: ${HOST}"
    log_info "  DATA_DIR: ${DATA_DIR}"
    log_info "  NODE_OPTIONS: ${NODE_OPTIONS}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Dependency Check
# ═══════════════════════════════════════════════════════════════════════════════

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        log_info "Install with: pkg install nodejs"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ ${NODE_VERSION} -lt 18 ]]; then
        log_error "Node.js 18+ is required (current: $(node --version))"
        log_info "Update with: pkg install nodejs"
        exit 1
    fi
    
    log_info "✓ Node.js $(node --version) detected"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        log_info "Install with: pkg install npm"
        exit 1
    fi
    
    log_info "✓ npm $(npm --version) detected"
    
    # Check if 9router is installed
    if [[ ! -f "package.json" ]] && ! command -v 9router &> /dev/null; then
        log_error "9router is not installed"
        log_info "Install with: npm install -g 9router"
        exit 1
    fi
    
    log_info "✓ 9router found"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Process Management
# ═══════════════════════════════════════════════════════════════════════════════

cleanup() {
    log_info "Cleaning up..."
    
    # Remove PID file
    if [[ -f "${PID_FILE}" ]]; then
        rm -f "${PID_FILE}"
    fi
    
    log_info "Cleanup complete"
}

signal_handler() {
    local signal=$1
    log_info "Received signal: ${signal}"
    
    case ${signal} in
        INT|TERM)
            log_info "Shutting down gracefully..."
            cleanup
            exit 0
            ;;
        HUP)
            # In Termux, don't exit on terminal close
            log_info "Terminal closed - keeping server alive..."
            ;;
    esac
}

# ═══════════════════════════════════════════════════════════════════════════════
# Server Startup
# ═══════════════════════════════════════════════════════════════════════════════

start_server() {
    log_info "Starting 9Router server..."
    
    # Determine server path
    if [[ -f "start-platform.js" ]]; then
        SERVER_CMD="node start-platform.js"
    elif [[ -f ".next/standalone/custom-server.js" ]]; then
        SERVER_CMD="node .next/standalone/custom-server.js"
    elif [[ -f "custom-server.js" ]]; then
        SERVER_CMD="node custom-server.js"
    else
        log_error "Server not found. Please run 'npm run build' first."
        exit 1
    fi
    
    log_info "Server command: ${SERVER_CMD}"
    log_info "Server starting on http://${HOST}:${PORT}"
    log_info ""
    log_info "Press Ctrl+C to stop the server"
    log_info ""
    
    # Write PID file
    echo $$ > "${PID_FILE}"
    
    # Set up signal handlers
    trap 'signal_handler INT' INT
    trap 'signal_handler TERM' TERM
    trap 'signal_handler HUP' HUP
    trap 'cleanup' EXIT
    
    # Start server
    exec ${SERVER_CMD}
}

# ═══════════════════════════════════════════════════════════════════════════════
# Main Entry Point
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --port|-p)
                PORT="$2"
                shift 2
                ;;
            --host|-H)
                HOST="$2"
                shift 2
                ;;
            --low-memory)
                IS_LOW_MEMORY=1
                IS_VERY_LOW_MEMORY=1
                shift
                ;;
            --debug)
                export DEBUG=1
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --port, -p <port>     Port to run server (default: 20128)"
                echo "  --host, -H <host>     Host to bind (default: 0.0.0.0)"
                echo "  --low-memory          Force low memory mode"
                echo "  --debug               Enable debug output"
                echo "  --help, -h            Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run
    print_banner
    detect_system
    calculate_memory_limits
    setup_environment
    check_dependencies
    start_server
}

# Run main function
main "$@"
