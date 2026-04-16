#!/bin/bash
set -e

echo "Starting obster-dashboard in development mode..."

cd /home/crawd_user/project/obster-dashboard

# Build frontend with Vite
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Start FastAPI with uvicorn in background
echo "Starting FastAPI backend..."
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 3

# Start nginx
echo "Starting nginx..."
nginx -c /etc/nginx/nginx.conf -g "daemon off;" &
NGINX_PID=$!

echo "Services started:"
echo "  - Frontend (static): http://localhost:80"
echo "  - API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Nginx PID: $NGINX_PID"
echo ""
echo "View logs with: docker-compose logs -f"
echo "Press Ctrl+C to stop"

# Wait for any process to exit
wait
