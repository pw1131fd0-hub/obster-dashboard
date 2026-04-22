#!/bin/bash
set -e

echo "Building and starting containers..."
docker-compose build
docker-compose up -d

echo "Dashboard available at http://localhost"
echo "API available at http://localhost/api/health"