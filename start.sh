#!/bin/bash
set -e

echo "Starting Obster Dashboard in development mode..."

# Start backend in background
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend dev server
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait