#!/bin/bash
set -e

echo "Starting Obster Dashboard in development mode..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to cleanup background jobs on exit
cleanup() {
    echo "Shutting down development servers..."
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 0
}

# Trap SIGINT and SIGTERM for cleanup
trap cleanup SIGINT SIGTERM

# Start backend on port 8000
echo "Starting backend (FastAPI/uvicorn) on port 8000..."
cd "$SCRIPT_DIR/backend"
export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend dev server on port 5173
echo "Starting frontend (Vite dev server) on port 5173..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Obster Dashboard Development Mode"
echo "========================================"
echo "Backend API:  http://localhost:8000"
echo "Frontend:     http://localhost:5173"
echo "API Docs:     http://localhost:8000/docs"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both background processes
wait $BACKEND_PID $FRONTEND_PID