#!/bin/bash
set -e

echo "Starting Obster Dashboard..."

# Build and start services
docker-compose build
docker-compose up -d

# Wait for services
sleep 3

# Verify health
echo "Checking API health..."
curl -s http://localhost/api/health || echo "API not ready yet"

echo "Dashboard started at http://localhost"