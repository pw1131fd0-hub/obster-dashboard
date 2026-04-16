#!/bin/bash
set -e

echo "🚀 Starting Obster Dashboard..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install docker-compose first."
    exit 1
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build --no-cache

echo "✅ Starting services..."
docker-compose up -d

echo ""
echo "✅ Obster Dashboard is running!"
echo "   - Frontend: http://localhost"
echo "   - API: http://localhost/api"
echo "   - API Docs: http://localhost/api/docs"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "📝 To stop: docker-compose down"