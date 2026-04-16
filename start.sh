#!/bin/bash
set -e

echo "Starting Obster Dashboard in dev mode..."

# Get the directory where this script resides
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install backend dependencies if needed
cd "$SCRIPT_DIR/backend"
if [ ! -d "venv" ] && [ -f requirements.txt ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
fi

# Start backend
echo "Starting backend on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend dev server
cd "$SCRIPT_DIR/frontend"
echo "Starting frontend dev server on port 5173..."
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo "Both services started. Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop all services."

# Cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait