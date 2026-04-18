#!/bin/bash
set -e

# Development mode startup script for Obster Dashboard
# Supports two modes: docker (production-like) or local (uvicorn + vite)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

usage() {
    echo "Usage: $0 [docker|local]"
    echo ""
    echo "  docker    Build and start containers via docker-compose (default)"
    echo "  local     Run backend (uvicorn) and frontend (vite) in development mode"
    echo ""
    echo "Examples:"
    echo "  $0          # Start with docker-compose"
    echo "  $0 docker   # Same as above"
    echo "  $0 local    # Start uvicorn + vite locally"
    exit 1
}

check_env() {
    if [ -f "$SCRIPT_DIR/.env" ]; then
        export $(cat "$SCRIPT_DIR/.env" | grep -v '^#' | xargs 2>/dev/null) || true
    fi
}

start_docker() {
    echo "=== Starting Obster Dashboard with Docker ==="

    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        echo "Warning: .env file not found. Copy .env.example to .env and configure it."
        echo "cp .env.example .env"
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "Error: docker-compose is not installed"
        exit 1
    fi

    echo "[1/2] Building containers..."
    docker-compose build --no-cache

    echo "[2/2] Starting containers..."
    docker-compose up -d

    echo ""
    echo "=== Obster Dashboard Started (Docker) ==="
    echo "  - Frontend (nginx): http://localhost:80"
    echo "  - Backend API:      http://localhost:8000"
    echo "  - API Docs:         http://localhost:8000/docs"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop:      docker-compose down"
}

start_local_backend() {
    echo "Starting backend (FastAPI/uvicorn)..."
    cd "$SCRIPT_DIR/backend"
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

start_local_frontend() {
    echo "Starting frontend (Vite dev server)..."
    cd "$SCRIPT_DIR/frontend"
    npm install
    npm run dev
}

start_local() {
    echo "=== Starting Obster Dashboard in Local Mode ==="

    check_env

    if ! command -v node &> /dev/null; then
        echo "Error: Node.js is required but not installed."
        exit 1
    fi

    if ! command -v python3 &> /dev/null; then
        echo "Error: Python 3 is required but not installed."
        exit 1
    fi

    echo "Starting backend and frontend in development mode..."
    echo ""

    # Start backend in background
    start_local_backend &
    BACKEND_PID=$!

    # Wait for backend to initialize
    sleep 3

    # Start frontend
    start_local_frontend &
    FRONTEND_PID=$!

    echo ""
    echo "=== Obster Dashboard Started (Local) ==="
    echo "  - Frontend (Vite):  http://localhost:5173"
    echo "  - Backend API:     http://localhost:8000"
    echo "  - API Docs:        http://localhost:8000/docs"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""

    # Wait for both processes
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait
}

MODE="${1:-docker}"

case "$MODE" in
    docker)
        start_docker
        ;;
    local)
        start_local
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo "Unknown mode: $MODE"
        usage
        ;;
esac