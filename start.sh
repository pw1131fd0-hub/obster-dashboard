#!/bin/bash
set -e

echo "Starting Obster Dashboard in development mode..."

# Start backend
cd "$(dirname "$0")/backend"
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
cd "$(dirname "$0")/frontend"
npm install
npm run dev &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:5173"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait