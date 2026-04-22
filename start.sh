#!/bin/bash
# Start backend in background
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000 &
# Start frontend dev server
cd frontend && npm install && npm run dev