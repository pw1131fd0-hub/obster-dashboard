#!/bin/bash
set -e

echo "Starting Obster Dashboard in development mode..."

# Function to handle graceful shutdown
shutdown() {
    echo "Shutting down services..."
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$NGINX_PID" ]; then
        kill -TERM "$NGINX_PID" 2>/dev/null || true
        wait "$NGINX_PID" 2>/dev/null || true
    fi
    echo "Shutdown complete."
    exit 0
}

# Trap SIGTERM and SIGINT for graceful shutdown
trap shutdown SIGTERM SIGINT

# Start backend with uvicorn
cd /app/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start nginx
nginx -g "daemon off;" &
NGINX_PID=$!

echo "Backend running on http://localhost:8000"
echo "Nginx running on http://localhost:80"
echo "Press Ctrl+C to stop"

# Wait for either process to exit
wait -n
EXIT_CODE=$?

# If one process exits, terminate the other
if [ $EXIT_CODE -eq 0 ]; then
    shutdown
fi