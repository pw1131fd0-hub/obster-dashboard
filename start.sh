#!/bin/bash
# =============================================================================
# Obster Dashboard - Development Mode Startup Script
# =============================================================================
# Starts FastAPI backend on port 8000 and nginx on port 80, both in foreground
# =============================================================================

set -e

# Default environment variables
export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"
export REFRESH_INTERVAL="${REFRESH_INTERVAL:-30000}"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Obster Dashboard - Development Mode"
echo "============================================"
echo ""

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

# Start FastAPI backend on port 8000
echo "[INFO] Starting FastAPI backend on port 8000..."
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start nginx on port 80 in foreground
echo "[INFO] Starting nginx on port 80..."
nginx -g "daemon off;" &
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
