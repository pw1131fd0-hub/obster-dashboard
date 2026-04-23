#!/bin/bash
# Development mode startup script for Obster Dashboard
# Builds and starts all services using docker-compose

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Obster Dashboard in development mode..."
echo "Building and starting containers..."

docker-compose up --build

echo "Obster Dashboard is running!"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"