#!/bin/bash
set -e

echo "Starting Obster Dashboard in development mode..."

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ] && [ -f "backend/requirements.txt" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv backend/venv
    source backend/venv/bin/activate
    pip install -r backend/requirements.txt
fi

# Start backend in background
if [ -f "backend/venv/bin/activate" ]; then
    source backend/venv/bin/activate
fi
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend dev server in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait