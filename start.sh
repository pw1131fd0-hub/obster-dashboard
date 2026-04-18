#!/bin/bash
set -e

echo "Starting Obster Dashboard..."

# Build and start backend
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start nginx in background for frontend
nginx -g 'daemon off;' &
NGINX_PID=$!

# Wait for both
wait $BACKEND_PID $NGINX_PID