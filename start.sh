#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Obster Dashboard in development mode..."

# Check and install backend dependencies
if [[ -f "${SCRIPT_DIR}/backend/requirements.txt" ]]; then
    echo "Installing backend dependencies..."
    pip install -r "${SCRIPT_DIR}/backend/requirements.txt"
else
    echo "Warning: backend/requirements.txt not found, skipping pip install"
fi

# Start backend in background
echo "Starting backend server..."
cd "${SCRIPT_DIR}/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend dev server in background
echo "Starting frontend dev server..."
cd "${SCRIPT_DIR}/frontend"
npm install
npm run dev &
FRONTEND_PID=$!

# Cleanup function
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Services stopped."
}

trap cleanup EXIT

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 1
done

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "Frontend is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "=========================================="
echo "Obster Dashboard is running!"
echo "Backend API:  http://localhost:8000"
echo "Frontend:     http://localhost:5173"
echo "API Docs:     http://localhost:8000/docs"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID