#!/bin/bash
set -e

echo "Starting Obster Dashboard in development mode..."

# Start backend in background
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend dev server in background
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Dashboard available at: http://localhost:5173"
echo "API available at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait