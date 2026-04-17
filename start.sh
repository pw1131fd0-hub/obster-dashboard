#!/bin/bash
# =============================================================================
# Obster Dashboard - Startup Script
# =============================================================================
# Supports both development mode (local services) and production mode (docker-compose)
# =============================================================================

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Default environment variables
export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"
export REFRESH_INTERVAL="${REFRESH_INTERVAL:-30000}"

# Parse arguments
MODE="${1:-dev}"

echo "============================================"
echo "  Obster Dashboard - Startup Script"
echo "============================================"
echo "  Mode: $MODE"
echo ""

show_usage() {
    echo "Usage: $0 [dev|production]"
    echo ""
    echo "  dev         - Start backend (uvicorn) and nginx locally"
    echo "  production  - Start docker-compose in production mode"
    echo ""
    echo "Environment variables:"
    echo "  PROJECTS_PATH        - Path to projects directory (default: /home/crawd_user/project)"
    echo "  LOGS_PATH            - Path to execution logs (default: /home/crawd_user/.openclaw/workspace/logs/executions)"
    echo "  TELEGRAM_BOT_TOKEN   - Telegram bot token for agent tracking"
    echo "  TIMEOUT_MINUTES      - Agent timeout threshold (default: 30)"
    echo "  REFRESH_INTERVAL     - Frontend refresh interval in ms (default: 30000)"
    echo ""
}

start_dev_mode() {
    echo "[INFO] Starting in DEVELOPMENT mode..."

    # Check for nginx
    if ! command -v nginx &> /dev/null; then
        echo "[ERROR] nginx is not installed"
        exit 1
    fi

    # Check for python and uvicorn
    if ! command -v python3 &> /dev/null; then
        echo "[ERROR] python3 is not installed"
        exit 1
    fi

    # Check if backend directory exists
    if [[ ! -d "backend" ]]; then
        echo "[ERROR] backend directory not found!"
        exit 1
    fi

    # Check if requirements.txt exists
    if [[ ! -f "backend/requirements.txt" ]]; then
        echo "[ERROR] backend/requirements.txt not found!"
        exit 1
    fi

    # Install backend dependencies if needed
    if ! python3 -c "import fastapi" &> /dev/null; then
        echo "[INFO] Installing backend dependencies..."
        pip install -q -r backend/requirements.txt
    fi

    # Start FastAPI backend on port 8000
    echo "[INFO] Starting FastAPI backend on port 8000..."
    cd backend
    python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..

    # Wait a moment for backend to start
    sleep 2

    # Start nginx on port 80 in foreground
    echo "[INFO] Starting nginx on port 80..."
    nginx -c "$SCRIPT_DIR/nginx.dev.conf" -g "daemon off;" &
    NGINX_PID=$!

    echo ""
    echo "[INFO] All services started."
    echo "[INFO] Backend (FastAPI): PID $BACKEND_PID"
    echo "[INFO] Frontend (nginx):  PID $NGINX_PID"
    echo ""
    echo "[INFO] Backend API:  http://localhost:8000"
    echo "[INFO] API Docs:     http://localhost:8000/docs"
    echo "[INFO] Frontend:      http://localhost:80"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""

    # Cleanup function
    cleanup() {
        echo ""
        echo "[INFO] Shutting down services..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $NGINX_PID 2>/dev/null || true
        echo "[INFO] All services stopped."
        exit 0
    }

    trap cleanup SIGTERM SIGINT

    # Wait for both background processes
    wait $BACKEND_PID $NGINX_PID
}

start_production_mode() {
    echo "[INFO] Starting in PRODUCTION mode..."

    if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
        echo "[ERROR] docker-compose is not installed"
        exit 1
    fi

    # Check if docker-compose.yml exists
    if [[ ! -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
        echo "[ERROR] docker-compose.yml not found!"
        exit 1
    fi

    echo "[INFO] Building and starting containers..."
    docker-compose up -d --build

    echo ""
    echo "[INFO] Containers started."
    echo "[INFO] Frontend:      http://localhost:80"
    echo "[INFO] Backend API:  http://localhost:8000"
    echo "[INFO] API Docs:     http://localhost:8000/docs"
    echo ""
    echo "View logs with: docker-compose logs -f"
    echo "Stop services with: docker-compose down"
    echo ""
}

case "$MODE" in
    dev|development)
        start_dev_mode
        ;;
    production|prod)
        start_production_mode
        ;;
    help|--help|-h)
        show_usage
        exit 0
        ;;
    *)
        echo "[ERROR] Unknown mode: $MODE"
        echo ""
        show_usage
        exit 1
        ;;
esac