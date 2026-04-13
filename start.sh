#!/bin/bash
set -e

# Default environment variables
export BACKEND_HOST="${BACKEND_HOST:-localhost}"
export BACKEND_PORT="${BACKEND_PORT:-8000}"
export FRONTEND_PORT="${FRONTEND_PORT:-3000}"
export API_URL="${API_URL:-http://localhost:8000/api}"

echo "Starting Obster Dashboard..."
echo "Backend: $BACKEND_HOST:$BACKEND_PORT"
echo "Frontend port: $FRONTEND_PORT"

# Check if backend is running, start if not
if ! curl -s "http://$BACKEND_HOST:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
    echo "Starting backend with uvicorn..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    sleep 3
else
    echo "Backend already running"
fi

# Check if we have a built frontend, otherwise use vite dev server
if [ -d "dist" ] && [ -n "$(ls -A dist 2>/dev/null)" ]; then
    echo "Using pre-built frontend from dist/"
    # Serve with nginx using the built files
    nginx -c /etc/nginx/nginx.conf &
    NGINX_PID=$!
else
    echo "Starting Vite dev server..."
    npm run dev &
    VITE_PID=$!
fi

# Wait for background processes
echo "Services started. Press Ctrl+C to stop."

# Handle shutdown
cleanup() {
    echo "Shutting down..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ -n "$NGINX_PID" ] && kill $NGINX_PID 2>/dev/null || true
    [ -n "$VITE_PID" ] && kill $VITE_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait