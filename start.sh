#!/bin/bash
# Obster Dashboard - Development Mode Startup Script
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Default environment variables
PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"

usage() {
    echo "Usage: $0 [dev|docker|full]"
    echo "  dev   - Start local development servers (frontend + backend)"
    echo "  docker - Run full stack with Docker Compose"
    echo "  full  - Install dependencies then start dev servers"
    echo ""
    echo "Default mode: dev"
}

# Check for required directories
check_directories() {
    local missing_dirs=0

    if [ ! -d "$PROJECTS_PATH" ]; then
        echo "WARNING: PROJECTS_PATH does not exist: $PROJECTS_PATH"
        echo "  Project status panel will show no projects."
        missing_dirs=1
    fi

    if [ ! -d "$LOGS_PATH" ]; then
        echo "WARNING: LOGS_PATH does not exist: $LOGS_PATH"
        echo "  Execution log panel will show no logs."
        missing_dirs=1
    fi

    if [ $missing_dirs -eq 1 ]; then
        echo ""
        echo "Some directories are missing. Set environment variables to override:"
        echo "  PROJECTS_PATH=$PROJECTS_PATH"
        echo "  LOGS_PATH=$LOGS_PATH"
        echo ""
    fi

    return 0
}

MODE="${1:-dev}"

case "$MODE" in
    dev)
        echo "=========================================="
        echo "  Obster Dashboard - Development Mode"
        echo "=========================================="
        echo ""

        # Check required directories before starting
        check_directories

        echo "Starting services..."
        echo "  Frontend: http://localhost:5173"
        echo "  Backend:  http://localhost:8000"
        echo "  API Docs: http://localhost:8000/docs"
        echo ""

        # Function to cleanup background jobs
        cleanup() {
            echo "Shutting down..."
            jobs -p | xargs -r kill 2>/dev/null || true
            exit 0
        }
        trap cleanup SIGINT SIGTERM

        # Start backend in background
        echo "[1/2] Starting backend on port 8000..."
        cd "$SCRIPT_DIR/backend"
        if [ ! -d "venv" ] && [ -f "/usr/bin/python3" ]; then
            python3 -m pip install -r requirements.txt 2>/dev/null || true
        fi
        uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
        BACKEND_PID=$!

        # Wait a moment for backend to start
        sleep 2

        # Start frontend dev server in background
        echo "[2/2] Starting frontend dev server on port 5173..."
        cd "$SCRIPT_DIR/frontend"
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        npm run dev &
        FRONTEND_PID=$!

        echo ""
        echo "=========================================="
        echo "  Services started successfully!"
        echo "=========================================="
        echo ""
        echo "  Frontend: http://localhost:5173"
        echo "  Backend:  http://localhost:8000"
        echo ""
        echo "Press Ctrl+C to stop all services"
        echo ""

        # Wait for both processes
        wait $BACKEND_PID $FRONTEND_PID
        ;;

    docker)
        echo "Starting Obster Dashboard with Docker Compose..."
        docker-compose up --build
        ;;

    full)
        echo "Installing dependencies and starting development servers..."

        # Install frontend dependencies
        echo "Installing frontend dependencies..."
        cd "$SCRIPT_DIR/frontend"
        npm install

        # Install backend dependencies
        echo "Installing backend dependencies..."
        cd "$SCRIPT_DIR/backend"
        python3 -m pip install -r requirements.txt

        # Start development servers
        cd "$SCRIPT_DIR"
        exec "$SCRIPT_DIR/start.sh" dev
        ;;

    *)
        echo "Unknown mode: $MODE"
        usage
        exit 1
        ;;
esac