#!/bin/bash
set -e

echo "Starting obster-dashboard in development mode..."

# Build frontend
cd "$(dirname "$0")/frontend"
npm install
npm run build

# Start backend in background
cd "$(dirname "$0")/backend"
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start nginx in background
nginx -c "$(dirname "$0")/nginx.conf" &
NGINX_PID=$!

echo "Dashboard running at http://localhost"
echo "Backend API at http://localhost:8000"
echo "Press Ctrl+C to stop"

# Wait for processes
wait $BACKEND_PID $NGINX_PID