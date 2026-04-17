#!/bin/bash
set -e

# Development mode startup script
# Starts both backend (uvicorn) and frontend dev server (vite)

BACKEND_PORT=8000
FRONTEND_PORT=5173

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "=========================================="
echo "  Obster Dashboard - Development Mode"
echo "=========================================="
echo ""

# Set environment defaults
export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"

# Start backend with uvicorn
echo "[1/2] Starting backend on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
uvicorn main:app --reload --host 0.0.0.0 --port "$BACKEND_PORT" &
BACKEND_PID=$!

# Start frontend dev server with vite
echo "[2/2] Starting frontend dev server on port $FRONTEND_PORT..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT" &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  Services Running:"
echo "  - Backend API: http://localhost:$BACKEND_PORT"
echo "  - Backend Docs: http://localhost:$BACKEND_PORT/docs"
echo "  - Frontend:    http://localhost:$FRONTEND_PORT"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Done."
    exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID