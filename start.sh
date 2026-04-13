#!/bin/bash
set -e

echo "Starting backend (FastAPI)..."
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting frontend (Vite dev server)..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait