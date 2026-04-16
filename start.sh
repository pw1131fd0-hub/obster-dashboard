#!/bin/bash
set -e

MODE="${1:-dev}"

if [ "$MODE" = "dev" ]; then
    echo "Starting Obster Dashboard in DEVELOPMENT mode..."

    # Start backend (uvicorn)
    echo "Starting backend on port 8000..."
    cd /home/crawd_user/project/obster-dashboard/backend
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    # Start frontend dev server (vite)
    echo "Starting frontend dev server on port 5173..."
    cd /home/crawd_user/project/obster-dashboard/frontend
    npm run dev &
    FRONTEND_PID=$!

    echo ""
    echo "Development servers started:"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Docs: http://localhost:8000/docs"
    echo "  - Frontend: http://localhost:5173"
    echo ""
    echo "Press Ctrl+C to stop both servers"

    # Wait for both processes
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait

elif [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    echo "Starting Obster Dashboard in PRODUCTION mode (Docker)..."

    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        echo "Docker not found. Please install Docker first."
        exit 1
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        echo "docker-compose not found. Please install docker-compose first."
        exit 1
    fi

    # Build and start services
    echo "Building Docker images..."
    docker-compose build --no-cache

    echo "Starting services..."
    docker-compose up -d

    echo ""
    echo "Production services started:"
    echo "  - Frontend: http://localhost"
    echo "  - API: http://localhost/api"
    echo "  - API Docs: http://localhost/api/docs"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"

else
    echo "Usage: $0 [dev|prod]"
    echo ""
    echo "  dev    - Start backend (uvicorn) and frontend (vite) directly"
    echo "  prod   - Start via Docker/docker-compose (production mode)"
    exit 1
fi