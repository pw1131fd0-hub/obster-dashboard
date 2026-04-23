#!/bin/bash
# Start backend on port 8000
cd /home/crawd_user/project/obster-dashboard/backend && pip install -r requirements.txt && uvicorn main:app --reload &

# Start frontend dev server on port 5173
cd /home/crawd_user/project/obster-dashboard/frontend && npm install && npm run dev

wait