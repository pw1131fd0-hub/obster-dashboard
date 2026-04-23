#!/bin/bash
# Development mode startup script for Obster Dashboard
# Starts backend and frontend dev servers concurrently

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    log_info "Shutting down services..."
    if [[ -n "$BACKEND_PID" ]]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [[ -n "$FRONTEND_PID" ]]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    # Also kill any remaining uvicorn/vite processes
    pkill -f "uvicorn.*main:app" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    log_info "All services stopped."
    exit 0
}

trap cleanup INT TERM

cd "$PROJECT_DIR"

log_info "Starting Obster Dashboard in development mode..."
echo ""

# Check for required tools
for cmd in python3 node npm; do
    if ! command -v $cmd &> /dev/null; then
        log_error "$cmd is required but not installed."
        exit 1
    fi
done

# Start backend
log_info "Starting backend (FastAPI/uvicorn) on port 8000..."
cd "$PROJECT_DIR/backend"
pip install -q -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd "$PROJECT_DIR"

# Wait for backend to be ready
log_info "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        break
    fi
    sleep 0.5
done

if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    log_info "Backend ready at http://localhost:8000"
else
    log_warn "Backend may not be fully ready yet"
fi

# Start frontend dev server
log_info "Starting frontend (Vite dev server) on port 5173..."
cd "$PROJECT_DIR/frontend"
npm install -q
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
cd "$PROJECT_DIR"

echo ""
log_info "=========================================="
log_info "Obster Dashboard Dev Mode"
log_info "=========================================="
echo ""
log_info "Backend API:  http://localhost:8000"
log_info "Frontend:    http://localhost:5173"
log_info "API Docs:    http://localhost:8000/docs"
echo ""
log_info "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID