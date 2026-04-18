#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

# Load environment variables
if [[ -f "${SCRIPT_DIR}/.env" ]]; then
    export $(grep -v '^#' "${SCRIPT_DIR}/.env" | xargs)
fi

echo "=========================================="
echo "Obster Dashboard - Development Mode"
echo "=========================================="

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "Initiating graceful shutdown..."

    if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
    fi

    if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "Stopping nginx (PID: $FRONTEND_PID)..."
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
        wait "$FRONTEND_PID" 2>/dev/null || true
    fi

    echo "All services stopped."
    exit 0
}

# Set trap for cleanup on signals
trap cleanup EXIT INT TERM

# Check and install backend dependencies
if [[ -f "${SCRIPT_DIR}/backend/requirements.txt" ]]; then
    echo "Checking backend dependencies..."
    if ! python3 -c "import fastapi" 2>/dev/null; then
        echo "Installing backend dependencies..."
        pip install -r "${SCRIPT_DIR}/backend/requirements.txt" -q
    fi
else
    echo "Warning: backend/requirements.txt not found"
fi

# Start backend server
echo "Starting backend server on port 8000..."
cd "${SCRIPT_DIR}/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
BACKEND_READY=0
for i in {1..30}; do
    if curl -s -f http://localhost:8000/api/health > /dev/null 2>&1; then
        BACKEND_READY=1
        echo "Backend is ready!"
        break
    fi
    sleep 1
done

if [[ $BACKEND_READY -eq 0 ]]; then
    echo "Error: Backend failed to start within 30 seconds"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Build frontend for development
echo "Building frontend..."
cd "${SCRIPT_DIR}/frontend"
npm install --quiet 2>/dev/null
npm run build -- --watch &
FRONTEND_PID=$!

# Wait for frontend build to complete initial pass
echo "Waiting for frontend build..."
for i in {1..60}; do
    if [[ -d "${SCRIPT_DIR}/frontend/dist" ]] && \
       [[ -f "${SCRIPT_DIR}/frontend/dist/index.html" ]]; then
        echo "Frontend build complete!"
        break
    fi
    sleep 1
done

# Start nginx for static file serving
echo "Starting nginx on port 80..."
nginx -c "${SCRIPT_DIR}/nginx.dev.conf" -g "daemon off;" &
FRONTEND_PID=$!

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
for i in {1..15}; do
    if curl -s -f http://localhost:80 > /dev/null 2>&1; then
        echo "Nginx is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "=========================================="
echo "Obster Dashboard is running!"
echo "=========================================="
echo "Frontend:     http://localhost"
echo "Backend API:  http://localhost:8000"
echo "API Docs:     http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="

# Keep script running
wait $BACKEND_PID $FRONTEND_PID