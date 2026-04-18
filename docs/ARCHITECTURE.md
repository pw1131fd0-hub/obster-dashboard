# Obster Dashboard Architecture

## Overview

The Obster Dashboard is a real-time web-based monitoring dashboard for the OpenClaw distributed system. It provides a unified view of project development status, cron job health, AI agent status, and execution logs.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Container                        │
│  ┌────────────────┐              ┌────────────────────┐    │
│  │   nginx:alpine │              │  FastAPI (uvicorn) │    │
│  │   Port 80      │  ───────►    │    Port 8000       │    │
│  │   (Reverse     │              │                    │    │
│  │    Proxy)      │              │                    │    │
│  └────────────────┘              └────────┬─────────────┘    │
│                                          │                   │
│                          ┌───────────────┼───────────────┐   │
│                          │               │               │   │
│                          ▼               ▼               ▼   │
│                   ┌────────────┐  ┌────────────┐  ┌────────┐│
│                   │ Projects   │  │ Systemd /  │  │ Telegram││
│                   │ Path       │  │ journalctl │  │ Bot API ││
│                   └────────────┘  └────────────┘  └────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + TypeScript + Vite | React 18.x, Vite 5.x |
| Styling | Tailwind CSS | 3.x |
| Backend | FastAPI + Pydantic | 0.109.x |
| Server | uvicorn (ASGI) | 0.27.x |
| Proxy | nginx | alpine |
| Container | Docker | - |

## Architecture Details

### Frontend (React SPA)
- Single Page Application built with Vite
- Dark theme with Tailwind CSS
- Auto-refresh every 30 seconds
- Four main panels: ProjectStatus, CronJob, AgentHealth, ExecutionLog

### Backend (FastAPI)
- RESTful API serving JSON responses
- Reads project status files, systemd services, Telegram Bot API, and execution logs
- Runs on port 8000

### nginx Reverse Proxy
- Serves static frontend files from `/usr/share/nginx/html`
- Proxies `/api/` requests to FastAPI backend on port 8000
- Enables SPA routing with `try_files $uri $uri/ /index.html`

## Docker Configuration

### Dockerfile (Two-Stage Build)
1. **Stage 1**: Builds frontend using node:20-alpine
2. **Stage 2**: Serves built files with nginx:alpine

### Dockerfile.frontend (Optional)
- Separate frontend build stage
- Useful for CI/CD pipelines

### backend/Dockerfile
- Python 3.11-slim based
- Runs uvicorn on port 8000

## Data Flow

1. Browser connects to nginx on port 80
2. nginx serves static frontend files
3. Frontend JavaScript makes API requests to `/api/*`
4. nginx proxies requests to FastAPI on port 8000
5. FastAPI reads data from various sources and returns JSON

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PROJECTS_PATH | /home/crawd_user/project | Root directory for project scanning |
| LOGS_PATH | /home/crawd_user/.openclaw/workspace/logs/executions | Execution logs directory |
| TELEGRAM_BOT_TOKEN | "" | Telegram Bot Token for agent health |
| TIMEOUT_MINUTES | 30 | Agent health threshold in minutes |
| REFRESH_INTERVAL | 30000 | Frontend auto-refresh interval in ms |