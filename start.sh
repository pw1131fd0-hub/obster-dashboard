#!/bin/bash
set -e

# Obster Dashboard - Development Startup Script

echo "Starting Obster Dashboard..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to check if a port is in use
port_in_use() {
    netstat -tuln 2>/dev/null | grep -q ":$1 " || \
    ss -tuln 2>/dev/null | grep -q ":$1 "
}

# Function to wait for backend to be ready
wait_for_backend() {
    echo "Waiting for backend to be ready..."
    local max_attempts=30
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
            echo "Backend is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts - backend not ready, waiting..."
        sleep 1
        attempt=$((attempt + 1))
    done
    echo "Backend did not become ready in time"
    return 1
}

# Parse command line arguments
MODE="${1:-dev}"

case "$MODE" in
    dev)
        echo "Starting in DEVELOPMENT mode..."

        # Check if backend port is in use
        if port_in_use 8000; then
            echo "Port 8000 is already in use. Backend may already be running."
        else
            # Start backend
            echo "Starting backend on port 8000..."
            cd "$SCRIPT_DIR/backend"
            python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
            BACKEND_PID=$!
            echo "Backend started with PID: $BACKEND_PID"
        fi

        # Wait for backend to be ready
        wait_for_backend || {
            echo "Failed to start backend"
            exit 1
        }

        # Check if frontend port is in use
        if port_in_use 5173; then
            echo "Port 5173 is already in use. Frontend dev server may already be running."
            echo "Frontend available at http://localhost:5173"
        else
            # Start frontend dev server
            echo "Starting frontend dev server on port 5173..."
            cd "$SCRIPT_DIR/frontend"
            npm run dev &
            FRONTEND_PID=$!
            echo "Frontend started with PID: $FRONTEND_PID"
        fi

        echo ""
        echo "=========================================="
        echo "Obster Dashboard is running!"
        echo "  Frontend: http://localhost:5173"
        echo "  Backend API: http://localhost:8000"
        echo "  API Docs: http://localhost:8000/docs"
        echo "=========================================="
        echo "Press Ctrl+C to stop all services"

        # Wait for any process to exit
        wait
        ;;

    backend)
        echo "Starting in BACKEND ONLY mode..."
        cd "$SCRIPT_DIR/backend"
        python -m uvicorn main:app --host 0.0.0.0 --port 8000
        ;;

    frontend)
        echo "Starting in FRONTEND ONLY mode..."
        cd "$SCRIPT_DIR/frontend"
        npm run dev
        ;;

    *)
        echo "Usage: $0 [dev|backend|frontend]"
        echo "  dev      - Start both backend and frontend (default)"
        echo "  backend  - Start only the backend API"
        echo "  frontend - Start only the frontend dev server"
        exit 1
        ;;
esac