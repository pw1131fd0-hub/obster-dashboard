#!/bin/bash
set -e

echo "Starting Obster Dashboard in development mode..."

# Start backend in background
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend dev server
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "Development servers started:"
echo "  Backend: http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/docs"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID