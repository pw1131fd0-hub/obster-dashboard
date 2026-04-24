#!/bin/bash
set -e

MODE="${1:-full}"

cd "$(dirname "$0")"

echo "Starting obster-dashboard (mode: $MODE)..."

case "$MODE" in
  dev)
    echo "Starting in dev mode..."
    echo ""
    echo "Building and starting with docker-compose..."
    docker-compose build --no-cache
    docker-compose up -d
    echo ""
    echo "Dashboard is running at http://localhost"
    echo ""
    echo "To view logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "To stop:"
    echo "  docker-compose down"
    ;;

  dev-frontend)
    echo "Starting frontend dev server on port 5173..."
    cd frontend
    npm run dev
    ;;

  dev-backend)
    echo "Starting backend dev server on port 8000..."
    cd backend
    source .venv/bin/activate 2>/dev/null || true
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ;;

  dev-all)
    echo "Starting both frontend (5173) and backend (8000) for dev..."
    echo "This requires npm and python/uvicorn installed locally"
    echo ""
    echo "Starting backend on port 8000..."
    (cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000) &
    BACKEND_PID=$!
    sleep 2
    echo "Starting frontend on port 5173..."
    (cd frontend && npm run dev) &
    FRONTEND_PID=$!
    echo ""
    echo "Dev servers running:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
    wait
    ;;

  full|docker)
    echo "Starting full stack with docker-compose..."
    docker-compose build --no-cache
    docker-compose up -d
    echo "Dashboard is running at http://localhost"
    ;;

  down)
    echo "Stopping all containers..."
    docker-compose down
    echo "All containers stopped."
    ;;

  logs)
    docker-compose logs -f
    ;;

  *)
    echo "Usage: $0 [dev|dev-frontend|dev-backend|dev-all|full|down|logs]"
    echo ""
    echo "  dev         - Build and run full stack with docker-compose (default)"
    echo "  dev-frontend - Run frontend dev server on port 5173 only"
    echo "  dev-backend  - Run backend dev server on port 8000 only"
    echo "  dev-all      - Run both frontend and backend locally (requires npm + python)"
    echo "  full         - Same as dev, build and run with docker-compose"
    echo "  down         - Stop all docker-compose services"
    echo "  logs         - Show docker-compose logs (follow mode)"
    exit 1
    ;;
esac