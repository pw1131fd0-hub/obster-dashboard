#!/bin/bash
set -e

MODE="${1:-dev}"

if [ "$MODE" = "prod" ]; then
    echo "Starting obster-dashboard in production mode (docker-compose)..."
    docker-compose up --build
elif [ "$MODE" = "dev" ]; then
    echo "Starting obster-dashboard in development mode..."
    echo "Starting backend on port 8000..."
    cd /home/crawd_user/project/obster-dashboard/backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000 &
    BACKEND_PID=$!
    echo "Backend started with PID $BACKEND_PID"
    echo "Starting frontend dev server on port 5173..."
    cd /home/crawd_user/project/obster-dashboard/frontend && npm install && npm run dev
else
    echo "Usage: ./start.sh [dev|prod]"
    echo "  dev  - Start backend (8000) and frontend dev server (5173)"
    echo "  prod - Start with docker-compose"
    exit 1
fi