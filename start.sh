#!/bin/bash
# Start FastAPI backend in background
cd /home/crawd_user/project/obster-dashboard/backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Vite dev server
cd /home/crawd_user/project/obster-dashboard/frontend
npm run dev &

echo "Dashboard starting..."
echo "Backend PID: $BACKEND_PID"
wait