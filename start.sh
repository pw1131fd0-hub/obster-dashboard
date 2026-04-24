#!/bin/bash
set -e

echo "Starting obster-dashboard..."

# Build and start containers
docker-compose build --no-cache
docker-compose up -d

echo "Dashboard is running at http://localhost"