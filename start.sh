#!/bin/bash
# Development mode - runs both backend and frontend dev server
cd "$(dirname "$0")"
echo "Starting Obster Dashboard in development mode..."
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000"
docker-compose up --build