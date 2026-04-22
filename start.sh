#!/bin/bash
set -e

usage() {
    echo "Usage: $0 [dev|prod]"
    echo "  dev   - Start backend (port 8000) and frontend dev server (port 5173)"
    echo "  prod  - Build and run with docker-compose"
    exit 1
}

start_dev() {
    echo "Starting development mode..."

    # Start backend
    echo "Starting backend on port 8000..."
    cd backend && pip install -r requirements.txt -q
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    # Start frontend dev server
    echo "Starting frontend dev server on port 5173..."
    cd frontend && npm install -q
    npm run dev &
    FRONTEND_PID=$!

    echo "Development servers running:"
    echo "  - Backend API: http://localhost:8000"
    echo "  - Frontend:    http://localhost:5173"
    echo ""
    echo "Press Ctrl+C to stop"

    # Wait for both processes
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
    wait
}

start_prod() {
    echo "Starting production mode with docker-compose..."
    docker-compose up --build -d
    echo "Services started. View logs with: docker-compose logs -f"
}

case "${1:-dev}" in
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