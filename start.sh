#!/bin/bash
# =============================================================================
# Obster Dashboard - Development Mode Startup Script
# =============================================================================
# Starts backend with uvicorn and optionally frontend dev server with Vite
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment variables
export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"
export REFRESH_INTERVAL="${REFRESH_INTERVAL:-30000}"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# =============================================================================
# Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Obster Dashboard - Development Mode Startup Script

Usage: $0 [OPTIONS]

OPTIONS:
    -b, --backend-only    Start only the backend service
    -f, --frontend-only  Start only the frontend dev server
    -a, --all            Start both backend and frontend (default)
    -p, --port PORT      Backend port (default: 8000)
    -h, --help           Show this help message

ENVIRONMENT VARIABLES:
    PROJECTS_PATH        Path to projects directory
    LOGS_PATH            Path to execution logs directory
    TELEGRAM_BOT_TOKEN   Telegram bot token for agent tracking
    TIMEOUT_MINUTES      Agent health timeout threshold (default: 30)
    REFRESH_INTERVAL     Frontend refresh interval in ms (default: 30000)

EXAMPLES:
    $0                      # Start both services
    $0 -b                   # Start backend only
    $0 --frontend-only      # Start frontend only
    TELEGRAM_BOT_TOKEN=xxx $0  # With Telegram token

EOF
}

# =============================================================================
# Parse Arguments
# =============================================================================

MODE="all"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--backend-only)
            MODE="backend"
            shift
            ;;
        -f|--frontend-only)
            MODE="frontend"
            shift
            ;;
        -a|--all)
            MODE="all"
            shift
            ;;
        -p|--port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# =============================================================================
# Backend Startup
# =============================================================================

start_backend() {
    log_info "Starting backend service on port $BACKEND_PORT..."

    # Check if backend directory exists
    if [[ ! -d "backend" ]]; then
        log_error "Backend directory not found!"
        exit 1
    fi

    # Check if requirements are installed
    if [[ ! -d "backend/.venv" ]]; then
        log_warning "Python virtual environment not found. Creating..."
        cd backend
        python3 -m venv .venv
        source .venv/bin/activate
        pip install --quiet -r requirements.txt
        cd ..
    fi

    # Set backend command
    BACKEND_CMD="cd backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --reload"

    # Start backend in background if not already running
    if ! lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
        log_info "Starting uvicorn server..."
        $BACKEND_CMD &
        BACKEND_PID=$!
        log_success "Backend started with PID $BACKEND_PID"
    else
        log_warning "Port $BACKEND_PORT is already in use. Skipping backend start."
    fi
}

# =============================================================================
# Frontend Startup (Optional)
# =============================================================================

start_frontend() {
    log_info "Starting frontend dev server on port $FRONTEND_PORT..."

    # Check if frontend directory exists
    if [[ ! -d "frontend" ]]; then
        log_error "Frontend directory not found!"
        exit 1
    fi

    # Check if node_modules exists
    if [[ ! -d "frontend/node_modules" ]]; then
        log_warning "node_modules not found. Installing dependencies..."
        cd frontend
        npm install
        cd ..
    fi

    # Set frontend command
    FRONTEND_CMD="cd frontend && npm run dev -- --port $FRONTEND_PORT"

    # Start frontend in background
    log_info "Starting Vite dev server..."
    $FRONTEND_CMD &
    FRONTEND_PID=$!
    log_success "Frontend started with PID $FRONTEND_PID"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo ""
    log_info "============================================"
    log_info "  Obster Dashboard - Development Mode"
    log_info "============================================"
    echo ""

    case $MODE in
        backend)
            start_backend
            ;;
        frontend)
            start_frontend
            ;;
        all)
            start_backend
            start_frontend
            ;;
    esac

    echo ""
    log_success "Services started successfully!"
    echo ""
    log_info "Environment:"
    log_info "  PROJECTS_PATH: $PROJECTS_PATH"
    log_info "  LOGS_PATH: $LOGS_PATH"
    log_info "  TIMEOUT_MINUTES: $TIMEOUT_MINUTES"
    log_info "  TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:+set} ${TELEGRAM_BOT_TOKEN:+****}"
    echo ""

    if [[ "$MODE" == "all" ]] || [[ "$MODE" == "backend" ]]; then
        log_info "Backend API: http://localhost:$BACKEND_PORT"
        log_info "API Docs:   http://localhost:$BACKEND_PORT/docs"
    fi

    if [[ "$MODE" == "all" ]] || [[ "$MODE" == "frontend" ]]; then
        log_info "Frontend:   http://localhost:$FRONTEND_PORT"
    fi

    echo ""
    log_info "Press Ctrl+C to stop all services"
    echo ""

    # Wait for any process to exit
    wait
}

main "$@"