#!/bin/bash
set -e

# ─── Usage ────────────────────────────────────────────────────────────────────
usage() {
    echo "Usage: $0 [dev|prod]"
    echo ""
    echo "  dev   - Start backend (uvicorn) and frontend (vite) in development mode"
    echo "  prod  - Start full stack using docker-compose (default)"
    echo ""
    exit 1
}

# ─── Development Mode ─────────────────────────────────────────────────────────
start_dev() {
    echo "Starting obster-dashboard in DEVELOPMENT mode..."

    # Start backend with uvicorn in background
    echo "Starting backend (FastAPI/uvicorn)..."
    cd /home/crawd_user/project/obster-dashboard/backend
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    # Start frontend dev server with vite in background
    echo "Starting frontend (Vite dev server)..."
    cd /home/crawd_user/project/obster-dashboard/frontend
    npm install
    npm run dev &
    FRONTEND_PID=$!

    echo "Backend PID: $BACKEND_PID"
    echo "Frontend PID: $FRONTEND_PID"
    echo ""
    echo "Backend running at http://localhost:8000"
    echo "Frontend running at http://localhost:5173"
    echo ""
    echo "Press Ctrl+C to stop all services"

    # Cleanup on exit
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

    wait
}

# ─── Production Mode ──────────────────────────────────────────────────────────
start_prod() {
    echo "Starting obster-dashboard in PRODUCTION mode (docker-compose)..."
    docker-compose up -d
    echo ""
    echo "Services started. Check status with: docker-compose ps"
    echo "View logs with: docker-compose logs -f"
}

# ─── Main ─────────────────────────────────────────────────────────────────────
MODE="${1:-prod}"

case "$MODE" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    *)
        usage
        ;;
esac