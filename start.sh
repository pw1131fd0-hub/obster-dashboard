#!/bin/bash
set -e

MODE="${1:-full}"

echo "Starting obster-dashboard (mode: $MODE)..."

case "$MODE" in
  dev)
    echo "Starting in dev mode..."
    echo "Backend will run on port 8000"
    echo "Frontend dev server will run on port 5173"
    echo ""
    echo "To start backend dev server:"
    echo "  cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "To start frontend dev server:"
    echo "  cd frontend && npm run dev"
    echo ""
    echo "Or use 'docker-compose up --build' for full stack"
    ;;

  full|docker)
    echo "Starting full stack with docker-compose..."
    docker-compose build --no-cache
    docker-compose up -d
    echo "Dashboard is running at http://localhost"
    ;;

  *)
    echo "Usage: $0 [dev|full]"
    echo "  dev   - Show instructions for dev mode (backend:8000, frontend:5173)"
    echo "  full  - Start full stack with docker-compose (default)"
    exit 1
    ;;
esac