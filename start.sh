#!/bin/bash
set -e

echo "=========================================="
echo "Obster Dashboard - Development Mode"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to cleanup background jobs on exit
cleanup() {
    echo ""
    echo "Shutting down development servers..."
    jobs -p | xargs -r kill 2>/dev/null || true
    wait 2>/dev/null || true
    echo "Shutdown complete."
    exit 0
}

# Trap SIGINT and SIGTERM for cleanup
trap cleanup SIGINT SIGTERM

# Ensure dependencies are installed
if [ ! -d "$SCRIPT_DIR/backend/.venv" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv "$SCRIPT_DIR/backend/.venv"
    source "$SCRIPT_DIR/backend/.venv/bin/activate"
    pip install -r "$SCRIPT_DIR/backend/requirements.txt"
else
    echo "Using existing Python virtual environment..."
fi

# Start backend on port 8000
echo ""
echo "Starting backend (FastAPI/uvicorn) on port 8000..."
cd "$SCRIPT_DIR/backend"
source "$SCRIPT_DIR/backend/.venv/bin/activate"
export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend dev server on port 5173
echo ""
echo "Starting frontend (Vite dev server) on port 5173..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "Obster Dashboard Development Mode"
echo "=========================================="
echo "Frontend:     http://localhost:5173"
echo "Backend API:  http://localhost:8000"
echo "API Docs:     http://localhost:8000/docs"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both background processes
wait $BACKEND_PID $FRONTEND_PID