#!/bin/bash
# =============================================================================
# Obster Dashboard - Development Mode Startup Script
# =============================================================================

set -e

# Configuration
BACKEND_PORT=8000
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Cleanup function
cleanup() {
    echo ""
    echo "[INFO] Shutting down services..."
    kill $(jobs -p) 2>/dev/null || true
    wait
    echo "[INFO] All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "============================================"
echo "  Obster Dashboard - Development Mode"
echo "============================================"
echo ""

# Export environment variables
export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"

echo "[INFO] Starting backend on port $BACKEND_PORT..."
cd "$SCRIPT_DIR/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!

echo "[INFO] Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
        echo "[INFO] Backend is ready!"
        break
    fi
    sleep 0.5
done

echo "[INFO] Starting nginx..."
nginx -c "$SCRIPT_DIR/nginx.conf"

echo ""
echo "============================================"
echo "  Obster Dashboard is running!"
echo "  Frontend: http://localhost:80"
echo "  API:      http://localhost:80/api"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop..."

# Wait for nginx to exit
wait