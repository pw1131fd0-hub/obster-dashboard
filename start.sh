#!/bin/bash
set -e

# Development mode startup script for Obster Dashboard
# Runs the application using docker-compose for a production-like development environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Obster Dashboard Development Mode ==="

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Warning: .env file not found. Copy .env.example to .env and configure it."
    echo "cp .env.example .env"
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

# Build and start containers
echo "[1/2] Building containers..."
docker-compose build --no-cache

echo "[2/2] Starting containers..."
docker-compose up -d

echo ""
echo "=== Obster Dashboard Started ==="
echo "  - Frontend (nginx): http://localhost:80"
echo "  - Backend API:      http://localhost:8000"
echo "  - API Docs:         http://localhost:8000/docs"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down"