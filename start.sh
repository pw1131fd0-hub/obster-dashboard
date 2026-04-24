#!/bin/bash
set -e

echo "Building and starting Obster Dashboard..."
docker-compose build
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 5

echo "Checking health..."
curl -s http://localhost/api/health && echo ""

echo "Dashboard is running at http://localhost"