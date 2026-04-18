#!/bin/bash
set -e

# Obster Dashboard - Startup Script
# Usage:
#   ./start.sh development   - Run in development mode (default)
#   ./start.sh production     - Run in production mode (Docker)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MODE="${1:-development}"

show_usage() {
    echo "Usage: $0 [development|production]"
    echo ""
    echo "Modes:"
    echo "  development  - Run backend with uvicorn and frontend dev server"
    echo "  production    - Build and run with Docker Compose"
    echo ""
    echo "Environment variables required for production:"
    echo "  TELEGRAM_BOT_TOKEN - Telegram bot token for agent health checks"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run in development mode"
    echo "  $0 development        # Same as above"
    echo "  $0 production         # Build and run with Docker"
}

start_development() {
    echo "Starting Obster Dashboard in DEVELOPMENT mode..."
    echo ""

    # Check for required environment variables
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        echo "WARNING: TELEGRAM_BOT_TOKEN is not set"
        echo "Agent health checks will return 'unknown' status"
        echo ""
    fi

    # Set defaults for development
    export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
    export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
    export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"

    echo "Configuration:"
    echo "  PROJECTS_PATH: $PROJECTS_PATH"
    echo "  LOGS_PATH: $LOGS_PATH"
    echo "  TIMEOUT_MINUTES: $TIMEOUT_MINUTES"
    echo ""

    # Check if frontend dependencies are installed
    if [ ! -d "frontend/node_modules" ]; then
        echo "Installing frontend dependencies..."
        (cd frontend && npm install)
    fi

    # Check if backend dependencies are installed
    if [ ! -d "backend/venv" ] && [ ! -d "backend/__pycache__" ]; then
        echo "Installing backend dependencies..."
        (cd backend && pip install -r requirements.txt)
    fi

    echo "Starting services..."
    echo ""

    # Start backend in background
    echo "Starting backend on port 8000..."
    cd backend
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ..

    # Start frontend dev server in background
    echo "Starting frontend dev server on port 5173..."
    (cd frontend && npm run dev) &
    FRONTEND_PID=$!

    echo ""
    echo "Services started:"
    echo "  Backend API:  http://localhost:8000"
    echo "  Frontend:     http://localhost:5173"
    echo "  API Docs:     http://localhost:8000/docs"
    echo ""
    echo "Press Ctrl+C to stop all services"

    # Wait for either process to exit
    wait $BACKEND_PID $FRONTEND_PID
}

start_production() {
    echo "Starting Obster Dashboard in PRODUCTION mode..."
    echo ""

    # Check for required environment variables
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        echo "ERROR: TELEGRAM_BOT_TOKEN is required for production"
        echo "Set it with: export TELEGRAM_BOT_TOKEN=your_token_here"
        exit 1
    fi

    # Build and start with docker-compose
    docker-compose build --no-cache
    docker-compose up -d

    echo ""
    echo "Services started:"
    echo "  Dashboard:    http://localhost:80"
    echo "  Backend API:  http://localhost:8000"
    echo "  API Docs:     http://localhost:8000/docs"
    echo ""
    echo "View logs with: docker-compose logs -f"
    echo "Stop with:       docker-compose down"
}

case "$MODE" in
    development|dev|d)
        start_development
        ;;
    production|prod|p)
        start_production
        ;;
    help|-h|--help)
        show_usage
        exit 0
        ;;
    *)
        echo "Unknown mode: $MODE"
        echo ""
        show_usage
        exit 1
        ;;
esac