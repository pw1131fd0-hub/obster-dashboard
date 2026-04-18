#!/bin/bash
set -e

echo "Starting Obster Dashboard..."

# Build and start containers
docker-compose build
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 3

# Health check
echo "Checking API health..."
if curl -sf http://localhost/api/health > /dev/null 2>&1; then
    echo "Dashboard is running at http://localhost"
    echo "API available at http://localhost/api"
else
    echo "Warning: Health check failed. Services may still be starting."
    echo "Check status with: docker-compose ps"
    echo "View logs with: docker-compose logs -f"
fi