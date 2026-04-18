#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Obster Dashboard Development Mode ==="

# Build frontend if needed
echo "[1/3] Building frontend..."
if [ ! -d "frontend/dist" ] || [ "$(find frontend/dist -type f 2>/dev/null | wc -l)" -eq 0 ]; then
    echo "Frontend dist not found, building..."
    cd frontend && npm install && npm run build && cd ..
else
    echo "Frontend already built, skipping..."
fi

# Start backend with uvicorn
echo "[2/3] Starting backend on port 8000..."
cd backend
PYTHONPATH=/app/backend uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 2

# Start nginx
echo "[3/3] Starting nginx on port 80..."
nginx -c "$(pwd)/nginx.conf" &
NGINX_PID=$!

echo ""
echo "=== Services Started ==="
echo "Frontend/API: http://localhost"
echo "Backend:      http://localhost:8000"
echo "API Docs:     http://localhost:8000/docs"
echo ""
echo "Backend PID:  $BACKEND_PID"
echo "Nginx PID:    $NGINX_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle shutdown gracefully
trap "
echo 'Shutting down...'
kill $BACKEND_PID 2>/dev/null
kill $NGINX_PID 2>/dev/null
exit 0
" SIGINT SIGTERM

# Wait for processes
wait $BACKEND_PID $NGINX_PID