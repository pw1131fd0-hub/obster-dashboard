#!/bin/bash
# =============================================================================
# obster-dashboard startup script
# Usage: ./start.sh [dev|prod|stop|logs|restart]
# =============================================================================

set -e

# Project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── Usage ────────────────────────────────────────────────────────────────────
usage() {
    echo -e "${BLUE}obster-dashboard startup script${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo -e "${GREEN}Commands:${NC}"
    echo "  dev    - Start backend (uvicorn) and frontend (vite) in development mode"
    echo "  prod   - Start full stack using docker-compose (default)"
    echo "  stop   - Stop all services (docker-compose down)"
    echo "  logs   - View logs (docker-compose logs -f)"
    echo "  restart- Restart services"
    echo "  status - Check service status"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 dev        # Development mode"
    echo "  $0 prod       # Production mode with docker-compose"
    echo "  $0 logs       # View running logs"
    echo ""
    exit 1
}

# ─── Logging helpers ──────────────────────────────────────────────────────────
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ─── Check prerequisites ──────────────────────────────────────────────────────
check_prereqs() {
    local missing=()

    if [[ "$MODE" == "prod" ]]; then
        if ! command -v docker &> /dev/null; then
            missing+=("docker")
        fi
        if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
            missing+=("docker-compose")
        fi
    elif [[ "$MODE" == "dev" ]]; then
        if ! command -v python3 &> /dev/null; then
            missing+=("python3")
        fi
        if ! command -v node &> /dev/null; then
            missing+=("node")
        fi
        if ! command -v npm &> /dev/null; then
            missing+=("npm")
        fi
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing[*]}"
        exit 1
    fi
}

# ─── Development Mode ─────────────────────────────────────────────────────────
start_dev() {
    log_info "Starting obster-dashboard in DEVELOPMENT mode..."

    # Check if ports are available
    if lsof -Pi :8000 -sTCP:LISTEN -t &>/dev/null; then
        log_warn "Port 8000 is already in use. Backend may fail to start."
    fi
    if lsof -Pi :5173 -sTCP:LISTEN -t &>/dev/null; then
        log_warn "Port 5173 is already in use. Frontend may fail to start."
    fi

    # Start backend with uvicorn in background
    log_info "Starting backend (FastAPI/uvicorn) on port 8000..."
    cd "$BACKEND_DIR"
    if [[ ! -d "venv" ]] && [[ -f "requirements.txt" ]]; then
        log_info "Installing Python dependencies..."
        python3 -m pip install -r requirements.txt
    fi
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    # Start frontend dev server with vite in background
    log_info "Starting frontend (Vite dev server) on port 5173..."
    cd "$FRONTEND_DIR"
    if [[ ! -d "node_modules" ]] && [[ -f "package.json" ]]; then
        log_info "Installing Node dependencies..."
        npm install
    fi
    npm run dev &
    FRONTEND_PID=$!

    echo ""
    log_info "Services started:"
    echo "  - Backend:  http://localhost:8000 (PID: $BACKEND_PID)"
    echo "  - Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

    # Cleanup on exit
    cleanup() {
        echo ""
        log_info "Shutting down services..."
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        log_info "Cleanup complete."
    }
    trap cleanup EXIT INT TERM

    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}

# ─── Production Mode ──────────────────────────────────────────────────────────
start_prod() {
    log_info "Starting obster-dashboard in PRODUCTION mode (docker-compose)..."

    # Check if .env file exists
    if [[ ! -f "$PROJECT_DIR/.env" ]]; then
        log_warn ".env file not found. Using default environment variables."
        if [[ -f "$PROJECT_DIR/.env.example" ]]; then
            log_info "Copy .env.example to .env and configure if needed."
        fi
    fi

    cd "$PROJECT_DIR"

    log_info "Building Docker images..."
    docker-compose build --no-cache

    log_info "Starting services..."
    docker-compose up -d

    echo ""
    log_info "Services started successfully!"
    echo "  - Dashboard: http://localhost"
    echo "  - API:       http://localhost:8000"
    echo ""
    log_info "View logs with: $0 logs"
    log_info "Check status with: $0 status"
}

# ─── Stop services ────────────────────────────────────────────────────────────
stop_services() {
    log_info "Stopping services..."
    cd "$PROJECT_DIR"
    docker-compose down --remove-orphans
    log_info "Services stopped."
}

# ─── View logs ────────────────────────────────────────────────────────────────
view_logs() {
    cd "$PROJECT_DIR"
    docker-compose logs -f --tail=100
}

# ─── Restart services ─────────────────────────────────────────────────────────
restart_services() {
    log_info "Restarting services..."
    cd "$PROJECT_DIR"
    docker-compose restart
    log_info "Services restarted."
}

# ─── Check status ─────────────────────────────────────────────────────────────
check_status() {
    cd "$PROJECT_DIR"
    docker-compose ps
}

# ─── Main ─────────────────────────────────────────────────────────────────────
MODE="${1:-prod}"

case "$MODE" in
    dev)
        check_prereqs
        start_dev
        ;;
    prod)
        check_prereqs
        start_prod
        ;;
    stop)
        stop_services
        ;;
    logs)
        view_logs
        ;;
    restart)
        check_prereqs
        restart_services
        ;;
    status)
        check_status
        ;;
    *)
        usage
        ;;
esac
