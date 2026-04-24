#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start backend on port 8000 with uvicorn reload
echo "Starting backend on port 8000..."
cd "$SCRIPT_DIR/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

# Start frontend dev server on port 5173
echo "Starting frontend dev server on port 5173..."
cd "$SCRIPT_DIR/frontend"
npm run dev &

# Wait for all background processes
wait