#!/bin/bash
set -e

# Default environment variables
export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"
export REFRESH_INTERVAL="${REFRESH_INTERVAL:-30000}"

echo "Starting Obster Dashboard..."
echo "PROJECTS_PATH: $PROJECTS_PATH"
echo "LOGS_PATH: $LOGS_PATH"
echo "TIMEOUT_MINUTES: $TIMEOUT_MINUTES"

# Check if docker-compose mode is requested
if [ "$1" = "--docker-compose" ] || [ "$USE_DOCKER_COMPOSE" = "true" ]; then
    echo "Starting with docker-compose..."
    cd /home/crawd_user/project/obster-dashboard
    exec docker-compose up
fi

# Start backend in background
echo "Starting FastAPI backend on port 8000..."
cd /home/crawd_user/project/obster-dashboard/backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start nginx
echo "Starting nginx on port 80..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Handle shutdown
trap "kill $BACKEND_PID $NGINX_PID 2>/dev/null; exit" SIGINT SIGTERM

echo "Obster Dashboard is running!"
echo "Frontend: http://localhost"
echo "API: http://localhost/api"

# Wait for processes
wait