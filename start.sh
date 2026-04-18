#!/bin/bash
set -e

echo "Starting Obster Dashboard..."

# Build and start containers
docker-compose build --no-cache
docker-compose up -d

echo "Waiting for services..."
sleep 5

# Health check
if curl -f http://localhost/api/health 2>/dev/null; then
    echo "✅ Dashboard is running at http://localhost"
else
    echo "❌ Health check failed"
    docker-compose logs backend
    exit 1
fi