#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Starting Obster Dashboard..."
echo "Building and starting containers..."

docker-compose up --build -d

echo ""
echo "Services started:"
echo "  - Nginx (frontend): http://localhost:80"
echo "  - FastAPI (backend): http://localhost:8000"
echo "  - API docs: http://localhost:8000/docs"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"