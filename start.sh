#!/bin/bash
# Start backend on port 8000
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000 &
# Start frontend dev server on port 5173
cd frontend && npm install && npm run dev