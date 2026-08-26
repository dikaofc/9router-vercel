#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# 9Router VPS/Linux Start Script
# ═══════════════════════════════════════════════════════════════════════════════
# Production-ready start script for Linux VPS/Dedicated servers
# 
# Features:
# - Systemd service support
# - Log rotation
# - Auto-restart on crash
# - Memory optimization
# - Security hardening
#
# Usage:
#   ./start-vps.sh                    # Start in foreground
#   ./start-vps.sh --daemon           # Start as daemon
#   ./start-vps.sh --install-service  # Install systemd service
#   ./start-vps.sh --help             # Show help
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════════

PORT="${PORT:-20128}"
HOST="${HOSTNAME:-0.0.0.0}"
DATA_DIR="${DATA_DIR:-$HOME/.9router}"
LOG_DIR="${DATA_DIR}/logs"
PID_FILE="${DATA_DIR}/9router.pid"
SERVICE_NAME="9router"
SERVICE_USER="${SUDO_USER:-$USER}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════════════

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ═══════════════════════════════════════════════════════════════════════════════
# System Detection
# ═══════════════════════════════════════════════════════════════════════════════

detect_system() {
    log_info "Detecting system configuration..."
    
    # Get system info
    TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
    CPU_CORES=$(nproc 2>/dev/null || echo "1")
    
    log_info "Total RAM: ${TOTAL_RAM_MB}MB"
    log_info "CPU Cores: ${CPU_CORES}"
    
    # Detect if running as root
    if [[ $EUID -eq 0 ]]; then
        log_warn "Running as root - consider using a non-root user"
    fi
    
    # Check if systemd is available
    if command -v systemctl &> /dev/null; then
        log_info "✓ systemd detected"
        HAS_SYSTEMD=1
    else
        log_info "systemd not available"
        HAS_SYSTEMD=0
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# Memory Optimization
# ═══════════════════════════════════════════════════════════════════════════════

calculate_memory_limits() {
    log_info "Calculating memory limits..."
    
    if [[ ${TOTAL_RAM_MB} -lt 1024 ]]; then
        MAX_OLD_SPACE_SIZE=256
        log_warn "Low memory VPS: ${MAX_OLD_SPACE_SIZE}MB limit"
    elif [[ ${TOTAL_RAM_MB} -lt 2048 ]]; then
        MAX_OLD_SPACE_SIZE=384
        log_warn "Low memory VPS: ${MAX_OLD_SPACE_SIZE}MB limit"
    elif [[ ${TOTAL_RAM_MB} -lt 4096 ]]; then
        MAX_OLD_SPACE_SIZE=512
        log_info "Standard VPS: ${MAX_OLD_SPACE_SIZE}MB limit"
    else
        MAX_OLD_SPACE_SIZE=1024
        log_info "High memory VPS: ${MAX_OLD_SPACE_SIZE}MB limit"
    fi
    
    NODE_FLAGS=(
        "--max-old-space-size=${MAX_OLD_SPACE_SIZE}"
        "--optimize-for-size"
        "--gc-interval=100"
        "--no-warnings"
        "--dns-result-order=ipv4first"
    )
}

# ═══════════════════════════════════════════════════════════════════════════════
# Environment Setup
# ═══════════════════════════════════════════════════════════════════════════════

setup_environment() {
    log_info "Setting up environment..."
    
    # Create directories
    mkdir -p "${DATA_DIR}"
    mkdir -p "${LOG_DIR}"
    
    # Set environment
    export PORT="${PORT}"
    export HOSTNAME="${HOST}"
    export NODE_ENV="production"
    export NEXT_TELEMETRY_DISABLED="1"
    export DATA_DIR="${DATA_DIR}"
    
    log_info "Environment configured"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Dependency Check
# ═══════════════════════════════════════════════════════════════════════════════

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        log_info "Install with: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ ${NODE_VERSION} -lt 18 ]]; then
        log_error "Node.js 18+ is required (current: $(node --version))"
        exit 1
    fi
    
    log_info "✓ Node.js $(node --version) detected"
    
    # Check if 9router is installed
    if [[ ! -f "package.json" ]] && ! command -v 9router &> /dev/null; then
        log_error "9router is not installed"
        exit 1
    fi
    
    log_info "✓ 9router found"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Systemd Service
# ═══════════════════════════════════════════════════════════════════════════════

install_systemd_service() {
    if [[ ${HAS_SYSTEMD} -ne 1 ]]; then
        log_error "systemd is not available"
        exit 1
    fi
    
    log_info "Installing systemd service..."
    
    # Get absolute path
    WORK_DIR=$(pwd)
    NODE_PATH=$(which node)
    
    # Create service file
    cat > /tmp/${SERVICE_NAME}.service << EOF
[Unit]
Description=9Router AI Routing Gateway
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${WORK_DIR}
ExecStart=${NODE_PATH} ${NODE_FLAGS[*]} custom-server.js
Restart=always
RestartSec=10
TimeoutStopSec=30

# Environment
Environment=PORT=${PORT}
Environment=HOSTNAME=${HOST}
Environment=NODE_ENV=production
Environment=DATA_DIR=${DATA_DIR}

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${DATA_DIR}
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

# Resource limits
MemoryMax=${MAX_OLD_SPACE_SIZE}M
CPUQuota=80%

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

[Install]
WantedBy=multi-user.target
EOF
    
    # Install service
    sudo cp /tmp/${SERVICE_NAME}.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}
    
    log_info "✓ Service installed successfully"
    log_info ""
    log_info "Commands:"
    log_info "  Start:   sudo systemctl start ${SERVICE_NAME}"
    log_info "  Stop:    sudo systemctl stop ${SERVICE_NAME}"
    log_info "  Status:  sudo systemctl status ${SERVICE_NAME}"
    log_info "  Logs:    sudo journalctl -u ${SERVICE_NAME} -f"
    log_info ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# Process Management
# ═══════════════════════════════════════════════════════════════════════════════

cleanup() {
    log_info "Cleaning up..."
    if [[ -f "${PID_FILE}" ]]; then
        rm -f "${PID_FILE}"
    fi
}

start_server() {
    log_info "Starting 9Router server..."
    
    # Find server path
    if [[ -f "custom-server.js" ]]; then
        SERVER_PATH="custom-server.js"
    elif [[ -f ".next/standalone/custom-server.js" ]]; then
        SERVER_PATH=".next/standalone/custom-server.js"
    else
        log_error "Server not found. Please run 'npm run build' first."
        exit 1
    fi
    
    log_info "Server starting on http://${HOST}:${PORT}"
    log_info ""
    
    # Write PID file
    echo $$ > "${PID_FILE}"
    
    # Set up signal handlers
    trap cleanup EXIT
    
    # Start server
    exec node "${NODE_FLAGS[@]}" "${SERVER_PATH}"
}

start_daemon() {
    log_info "Starting 9Router as daemon..."
    
    # Find server path
    if [[ -f "custom-server.js" ]]; then
        SERVER_PATH="custom-server.js"
    elif [[ -f ".next/standalone/custom-server.js" ]]; then
        SERVER_PATH=".next/standalone/custom-server.js"
    else
        log_error "Server not found. Please run 'npm run build' first."
        exit 1
    fi
    
    # Start in background
    nohup node "${NODE_FLAGS[@]}" "${SERVER_PATH}" > "${LOG_DIR}/9router.log" 2>&1 &
    SERVER_PID=$!
    
    echo $SERVER_PID > "${PID_FILE}"
    
    log_info "✓ Server started as daemon (PID: ${SERVER_PID})"
    log_info "  Logs: ${LOG_DIR}/9router.log"
    log_info "  PID file: ${PID_FILE}"
    log_info ""
    log_info "Commands:"
    log_info "  Stop:    kill \$(cat ${PID_FILE})"
    log_info "  Logs:    tail -f ${LOG_DIR}/9router.log"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Help
# ═══════════════════════════════════════════════════════════════════════════════

show_help() {
    echo "
9Router VPS/Linux Start Script

Usage:
  ./start-vps.sh [OPTIONS]

Options:
  --port, -p <port>     Port to run server (default: 20128)
  --host, -H <host>     Host to bind (default: 0.0.0.0)
  --daemon              Start as daemon (background)
  --install-service     Install systemd service
  --help, -h            Show this help message

Examples:

  # Start in foreground
  ./start-vps.sh

  # Start as daemon
  ./start-vps.sh --daemon

  # Install systemd service
  ./start-vps.sh --install-service

  # Start on custom port
  ./start-vps.sh --port 3000

Service Management (after install):

  # Start service
  sudo systemctl start 9router

  # Stop service
  sudo systemctl stop 9router

  # Check status
  sudo systemctl status 9router

  # View logs
  sudo journalctl -u 9router -f

  # Enable auto-start
  sudo systemctl enable 9router

  # Disable auto-start
  sudo systemctl disable 9router
";
}

# ═══════════════════════════════════════════════════════════════════════════════
# Main Entry Point
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    # Parse arguments
    DAEMON_MODE=0
    INSTALL_SERVICE=0
    
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
            --daemon)
                DAEMON_MODE=1
                shift
                ;;
            --install-service)
                INSTALL_SERVICE=1
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run
    detect_system
    calculate_memory_limits
    setup_environment
    check_dependencies
    
    if [[ ${INSTALL_SERVICE} -eq 1 ]]; then
        install_systemd_service
    elif [[ ${DAEMON_MODE} -eq 1 ]]; then
        start_daemon
    else
        start_server
    fi
}

# Run main function
main "$@"
