#!/bin/bash
set -e

echo "Starting Obster Dashboard..."

# Build and run backend
cd "$(dirname "$0")"
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Build and run frontend (dev mode)
cd ..
cd frontend
npm install
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT

wait