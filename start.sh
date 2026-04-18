#!/bin/bash
set -e

# Obster Dashboard - Development Mode Startup Script
# Usage:
#   ./start.sh dev          - Run in development mode (default)
#   ./start.sh docker      - Run full docker-compose stack
#   ./start.sh backend      - Start only backend service
#   ./start.sh frontend     - Start only frontend dev server
#   ./start.sh stop         - Stop all running services
#   ./start.sh logs         - View backend logs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  dev          Start in development mode (default)"
    echo "  docker       Start full docker-compose stack"
    echo "  backend      Start only backend service"
    echo "  frontend     Start only frontend dev server"
    echo "  stop         Stop all running services"
    echo "  logs         View backend logs"
    echo "  help         Show this help message"
    echo ""
}

check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        echo -e "${YELLOW}Warning: .env file not found. Copy .env.example to .env and configure it.${NC}"
    fi
}

start_docker() {
    echo -e "${GREEN}Starting Obster Dashboard with Docker Compose...${NC}"
    check_prerequisites

    # Load environment variables from .env if it exists
    if [ -f "$SCRIPT_DIR/.env" ]; then
        set -a
        source "$SCRIPT_DIR/.env"
        set +a
    fi

    docker compose up -d
    echo -e "${GREEN}Dashboard is now running at http://localhost${NC}"
}

start_backend_dev() {
    echo -e "${GREEN}Starting backend in development mode...${NC}"

    cd "$SCRIPT_DIR/backend"
    pip install -r requirements.txt 2>/dev/null || true

    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

start_frontend_dev() {
    echo -e "${GREEN}Starting frontend development server...${NC}"

    cd "$SCRIPT_DIR/frontend"
    npm install 2>/dev/null || true
    npm run dev
}

start_full_dev() {
    echo -e "${GREEN}Starting in development mode...${NC}"

    # Set defaults
    export PROJECTS_PATH="${PROJECTS_PATH:-/home/crawd_user/project}"
    export LOGS_PATH="${LOGS_PATH:-/home/crawd_user/.openclaw/workspace/logs/executions}"
    export TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-30}"

    echo -e "Configuration:"
    echo -e "  PROJECTS_PATH: ${PROJECTS_PATH}"
    echo -e "  LOGS_PATH: ${LOGS_PATH}"
    echo -e "  TIMEOUT_MINUTES: ${TIMEOUT_MINUTES}"
    echo ""

    # Start backend in background
    echo -e "${YELLOW}Starting backend on port 8000...${NC}"
    cd "$SCRIPT_DIR/backend"
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    sleep 2

    # Start frontend dev server in background
    echo -e "${YELLOW}Starting frontend on port 5173...${NC}"
    cd "$SCRIPT_DIR/frontend"
    npm run dev &
    FRONTEND_PID=$!

    echo ""
    echo -e "${GREEN}Development servers started!${NC}"
    echo -e "  Backend: http://localhost:8000"
    echo -e "  Frontend: http://localhost:5173"
    echo -e ""
    echo -e "Press Ctrl+C to stop"

    # Wait for processes
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
    wait
}

stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker compose down 2>/dev/null || true
    pkill -f "uvicorn main:app" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo -e "${GREEN}Services stopped${NC}"
}

view_logs() {
    docker compose logs -f backend
}

case "${1:-dev}" in
    dev)
        start_full_dev
        ;;
    docker)
        start_docker
        ;;
    backend)
        start_backend_dev
        ;;
    frontend)
        start_frontend_dev
        ;;
    stop)
        stop_services
        ;;
    logs)
        view_logs
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        usage
        exit 1
        ;;
esac