#!/bin/sh
# start.sh — Development-mode launcher.
#
# Starts the FastAPI backend (uvicorn) and either the Vite dev server (if
# node_modules are present in ./frontend) or the pre-built nginx static
# server as the frontend.  Both child processes are supervised: if either
# exits the other is terminated and this script exits with the same code.
#
# Signals: SIGTERM and SIGINT trigger an ordered shutdown of both children.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"

# ── Graceful shutdown ──────────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

shutdown() {
    echo ""
    echo "[start.sh] Received shutdown signal — stopping services..."

    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "[start.sh] Stopping backend (PID $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        # Give uvicorn up to 10 s to finish in-flight requests
        i=0
        while kill -0 "$BACKEND_PID" 2>/dev/null && [ $i -lt 10 ]; do
            sleep 1
            i=$((i + 1))
        done
        kill -KILL "$BACKEND_PID" 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "[start.sh] Stopping frontend (PID $FRONTEND_PID)..."
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
        wait "$FRONTEND_PID" 2>/dev/null || true
    fi

    echo "[start.sh] Shutdown complete."
    exit 0
}

trap shutdown TERM INT

# ── Backend ────────────────────────────────────────────────────────────────
echo "[start.sh] Starting backend (uvicorn) on port 8000..."

if [ ! -f "${BACKEND_DIR}/main.py" ]; then
    echo "[start.sh] ERROR: ${BACKEND_DIR}/main.py not found." >&2
    exit 1
fi

cd "${BACKEND_DIR}"
python3 -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --log-level info &
BACKEND_PID=$!

# ── Frontend ───────────────────────────────────────────────────────────────
if [ -d "${FRONTEND_DIR}/node_modules" ]; then
    echo "[start.sh] node_modules found — starting Vite dev server on port 5173..."
    cd "${FRONTEND_DIR}"
    npm run dev -- --host 0.0.0.0 &
    FRONTEND_PID=$!
    echo "[start.sh] Vite dev server running on http://localhost:5173"
    echo "[start.sh] NOTE: In dev mode the frontend uses the proxy defined in vite.config.ts."
elif [ -d "${FRONTEND_DIR}/dist" ]; then
    echo "[start.sh] dist/ found — serving built files with nginx on port 80..."
    nginx -g "daemon off;" &
    FRONTEND_PID=$!
    echo "[start.sh] nginx running on http://localhost:80"
else
    echo "[start.sh] WARNING: neither node_modules nor dist/ found in frontend/." >&2
    echo "[start.sh]   Run 'cd frontend && npm install && npm run build' first," >&2
    echo "[start.sh]   or 'npm install' to enable the Vite dev server." >&2
    echo "[start.sh] Continuing with backend-only mode." >&2
fi

echo "[start.sh] Backend: http://localhost:8000"
echo "[start.sh] API docs: http://localhost:8000/docs"
echo "[start.sh] Press Ctrl+C to stop all services."

# ── Supervisor loop ────────────────────────────────────────────────────────
# Portable alternative to 'wait -n' (requires bash 4.3+, absent in Alpine).
# Polls every second; exits when either managed child process disappears.
while true; do
    sleep 1

    if [ -n "$BACKEND_PID" ] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        wait "$BACKEND_PID" 2>/dev/null
        EXIT_CODE=$?
        echo "[start.sh] Backend exited with code $EXIT_CODE — shutting down." >&2
        shutdown
    fi

    if [ -n "$FRONTEND_PID" ] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        wait "$FRONTEND_PID" 2>/dev/null
        EXIT_CODE=$?
        echo "[start.sh] Frontend exited with code $EXIT_CODE — shutting down." >&2
        shutdown
    fi
done
