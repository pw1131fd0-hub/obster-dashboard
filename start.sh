#!/bin/bash
set -e

echo "Starting Obster Dashboard in development mode..."

# Set environment variables
export PROJECTS_PATH=${PROJECTS_PATH:-/home/crawd_user/project}
export LOGS_PATH=${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}
export TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-}
export TIMEOUT_MINUTES=${TIMEOUT_MINUTES:-30}
export REFRESH_INTERVAL=${REFRESH_INTERVAL:-30000}
export VITE_API_BASE_URL=${VITE_API_BASE_URL:-/api}

# Start backend (uvicorn)
cd /home/crawd_user/project/obster-dashboard/backend
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend (vite)
cd /home/crawd_user/project/obster-dashboard/frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8000 (PID: $BACKEND_PID)"
echo "Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"
echo "Press Ctrl+C to stop both services"

# Wait for both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait $BACKEND_PID $FRONTEND_PID