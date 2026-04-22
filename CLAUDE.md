# Obster Dashboard

Real-time web dashboard for monitoring the OpenClaw distributed system.

## Stack

- **Backend**: FastAPI (Python) on port 8000
- **Frontend**: React 18 + Vite + Tailwind CSS (dark theme)
- **Server**: Nginx (serves static files, proxies `/api/` to backend)
- **Container**: Docker + docker-compose (single container, single port 80)

## Key Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PROJECTS_PATH` | `/home/crawd_user/project` | Directory to scan for projects with `docs/.dev_status.json` |
| `LOGS_PATH` | `/home/crawd_user/.openclaw/workspace/logs/executions` | Directory with `*.json` log files |
| `TELEGRAM_BOT_TOKEN` | _(empty)_ | Telegram bot token for agent health polling |
| `TIMEOUT_MINUTES` | `30` | Agent unhealthy threshold in minutes |

## Architecture

```
browser:80 -> nginx -> /           (React static files)
                      /api/        -> backend:8000 (FastAPI)
```

## API Endpoints

- `GET /api/health` - Health check (status, uptime, version)
- `GET /api/projects` - Scan PROJECTS_PATH for `.dev_status.json` files
- `GET /api/cronjobs` - Systemd service status via systemctl/journalctl
- `GET /api/agents` - Agent health from Telegram bot getUpdates
- `GET /api/logs?limit=20` - Recent JSON log files from LOGS_PATH
- `GET /api/config` - Current configuration

## Agents

Argus, Hephaestus, Atlas, Hestia, Hermes, Main

## Systemd Services Monitored

obster-monitor, obster-cron, openclaw-scheduler

## Development

```bash
# Start
docker-compose up --build

# Frontend dev (port 5173)
cd frontend && npm install && npm run dev

# Backend dev (port 8000)
cd backend && pip install -r requirements.txt && uvicorn main:app --reload
```

## Docker Build

```bash
docker-compose build
docker-compose up -d
```

Single nginx container handles both static files and API proxying. Backend runs in a separate container but is only accessed through nginx proxy.