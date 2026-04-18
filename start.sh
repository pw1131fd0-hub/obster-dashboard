#!/bin/bash
set -e

echo "Starting obster-dashboard in development mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# Build and start containers
echo "Building containers..."
docker-compose build --no-cache

echo "Starting containers..."
docker-compose up -d

echo ""
echo "Dashboard is running:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "View logs with: docker-compose logs -f"