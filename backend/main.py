"""
OpenClaw Dashboard - FastAPI Backend
"""
import os
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from collections import defaultdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
PROJECTS_PATH = os.getenv("PROJECTS_PATH", "/home/crawd_user/project")
LOGS_PATH = os.getenv("LOGS_PATH", "/home/crawd_user/.openclaw/workspace/logs/executions")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
AGENTS = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]
TIMEOUT_MINUTES = int(os.getenv("TIMEOUT_MINUTES", "30"))
REFRESH_INTERVAL = int(os.getenv("REFRESH_INTERVAL", "30000"))

app = FastAPI(title="OpenClaw Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ProjectInfo(BaseModel):
    name: str
    path: str
    stage: str
    iteration: int
    quality_score: int
    blocking_errors: List[str]
    updated_at: str

class ProjectResponse(BaseModel):
    projects: List[ProjectInfo]
    timestamp: str

class CronJobInfo(BaseModel):
    name: str
    status: str
    last_run: Optional[str]
    exit_code: Optional[int]
    recent_logs: List[str]

class CronJobResponse(BaseModel):
    cronjobs: List[CronJobInfo]
    timestamp: str

class AgentInfo(BaseModel):
    name: str
    status: str
    last_response: Optional[str]
    minutes_ago: Optional[int]

class AgentResponse(BaseModel):
    agents: List[AgentInfo]
    timestamp: str

class LogEntry(BaseModel):
    filename: str
    path: str
    timestamp: str
    content: dict

class LogResponse(BaseModel):
    logs: List[LogEntry]
    count: int
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    version: str


@app.get("/api/health")
async def health():
    """System health check"""
    return HealthResponse(
        status="healthy",
        uptime_seconds=0,
        version="1.0.0"
    )


@app.get("/api/projects", response_model=ProjectResponse)
async def get_projects():
    """Get all project development status"""
    projects = []
    projects_base = Path(PROJECTS_PATH)

    if not projects_base.exists():
        logger.warning(f"Projects path not found: {PROJECTS_PATH}")
        return ProjectResponse(projects=[], timestamp=datetime.now(timezone.utc).isoformat())

    for project_dir in projects_base.iterdir():
        if not project_dir.is_dir():
            continue

        dev_status_path = project_dir / "docs" / ".dev_status.json"
        if not dev_status_path.exists():
            continue

        try:
            with open(dev_status_path, "r") as f:
                data = json.load(f)

            projects.append(ProjectInfo(
                name=project_dir.name,
                path=str(project_dir),
                stage=data.get("stage", "unknown"),
                iteration=data.get("iteration", 0),
                quality_score=data.get("quality_score", 0),
                blocking_errors=data.get("blocking_errors", []),
                updated_at=data.get("updated_at", "")
            ))
        except Exception as e:
            logger.error(f"Error reading {dev_status_path}: {e}")
            continue

    return ProjectResponse(
        projects=projects,
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@app.get("/api/cronjobs", response_model=CronJobResponse)
async def get_cronjobs(limit: int = 10):
    """Get CronJob monitoring data using systemctl and journalctl"""
    import subprocess

    cronjobs = []
    services_to_check = [
        "obster-monitor",
        "obster-cron",
        "openclaw-scheduler"
    ]

    for service_name in services_to_check:
        try:
            # Get service status
            status_result = subprocess.run(
                ["systemctl", "show", service_name],
                capture_output=True,
                text=True,
                timeout=5
            )

            status_map = {}
            for line in status_result.stdout.strip().split("\n"):
                if "=" in line:
                    key, value = line.split("=", 1)
                    status_map[key] = value

            active_state = status_map.get("ActiveState", "unknown")
            exec_main_status = status_map.get("ExecMainStatus", "0")
            active_enter_timestamp = status_map.get("ActiveEnterTimestamp", "")

            # Convert timestamp
            last_run = None
            if active_enter_timestamp:
                try:
                    ts = int(active_enter_timestamp)
                    last_run = datetime.fromtimestamp(ts).isoformat()
                except:
                    pass

            # Get recent logs
            logs_result = subprocess.run(
                ["journalctl", "--since", "1 hour ago", "-u", service_name, "--no-pager", "-n", str(limit)],
                capture_output=True,
                text=True,
                timeout=5
            )

            recent_logs = logs_result.stdout.strip().split("\n") if logs_result.returncode == 0 else []

            cronjobs.append(CronJobInfo(
                name=service_name,
                status=active_state,
                last_run=last_run,
                exit_code=int(exec_main_status) if exec_main_status else None,
                recent_logs=recent_logs[:limit]
            ))
        except subprocess.TimeoutExpired:
            logger.error(f"Timeout checking service: {service_name}")
            cronjobs.append(CronJobInfo(
                name=service_name,
                status="timeout",
                last_run=None,
                exit_code=None,
                recent_logs=[]
            ))
        except Exception as e:
            logger.error(f"Error checking service {service_name}: {e}")
            cronjobs.append(CronJobInfo(
                name=service_name,
                status="error",
                last_run=None,
                exit_code=None,
                recent_logs=[str(e)]
            ))

    return CronJobResponse(
        cronjobs=cronjobs,
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@app.get("/api/agents", response_model=AgentResponse)
async def get_agents(timeout_minutes: int = 30):
    """Get Agent health status from Telegram Bot API"""
    agents = []

    if not TELEGRAM_BOT_TOKEN:
        for agent_name in AGENTS:
            agents.append(AgentInfo(
                name=agent_name,
                status="unknown",
                last_response=None,
                minutes_ago=None
            ))
        return AgentResponse(agents=agents, timestamp=datetime.now(timezone.utc).isoformat())

    try:
        import requests

        # Get updates from Telegram
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
        response = requests.get(url, timeout=5, params={"limit": 100})

        if response.status_code != 200:
            logger.error(f"Telegram API error: {response.status_code}")
            for agent_name in AGENTS:
                agents.append(AgentInfo(
                    name=agent_name,
                    status="unknown",
                    last_response=None,
                    minutes_ago=None
                ))
            return AgentResponse(agents=agents, timestamp=datetime.now(timezone.utc).isoformat())

        data = response.json()
        updates = data.get("result", [])

        # Build message time index by chat_id or username pattern
        # For now, we'll use a simple heuristic: track last message time per agent
        # In production, this would need proper agent->chat_id mapping
        agent_message_times = defaultdict(list)

        for update in updates:
            message = update.get("message", {})
            if not message:
                continue

            # Extract agent identifier (could be username or chat_id pattern)
            chat = message.get("chat", {})
            username = chat.get("username", "")

            # Parse message text to identify agent
            text = message.get("text", "")
            for agent_name in AGENTS:
                if agent_name.lower() in (username or "").lower() or agent_name.lower() in text.lower():
                    date_str = message.get("date")
                    if date_str:
                        agent_message_times[agent_name].append(date_str)

        now = datetime.utcnow().timestamp()

        for agent_name in AGENTS:
            if agent_name in agent_message_times and agent_message_times[agent_name]:
                last_ts = max(agent_message_times[agent_name])
                last_dt = datetime.fromtimestamp(last_ts)
                minutes_ago = int((now - last_ts) / 60)

                agents.append(AgentInfo(
                    name=agent_name,
                    status="healthy" if minutes_ago < timeout_minutes else "unhealthy",
                    last_response=last_dt.isoformat(),
                    minutes_ago=minutes_ago
                ))
            else:
                agents.append(AgentInfo(
                    name=agent_name,
                    status="unknown",
                    last_response=None,
                    minutes_ago=None
                ))

    except Exception as e:
        logger.error(f"Error checking agents: {e}")
        for agent_name in AGENTS:
            agents.append(AgentInfo(
                name=agent_name,
                status="error",
                last_response=None,
                minutes_ago=None
            ))

    return AgentResponse(agents=agents, timestamp=datetime.now(timezone.utc).isoformat())


@app.get("/api/logs", response_model=LogResponse)
async def get_logs(limit: int = 20):
    """Get execution logs from log directory"""
    logs_dir = Path(LOGS_PATH)

    if not logs_dir.exists():
        logger.warning(f"Logs path not found: {LOGS_PATH}")
        return LogResponse(logs=[], count=0, timestamp=datetime.now(timezone.utc).isoformat())

    log_entries = []

    try:
        log_files = sorted(logs_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)[:limit]

        for log_file in log_files:
            try:
                with open(log_file, "r") as f:
                    content = json.load(f)

                stat = log_file.stat()
                timestamp = datetime.fromtimestamp(stat.st_mtime).isoformat()

                log_entries.append(LogEntry(
                    filename=log_file.name,
                    path=str(log_file),
                    timestamp=timestamp,
                    content=content
                ))
            except Exception as e:
                logger.error(f"Error reading log file {log_file}: {e}")
                continue

    except Exception as e:
        logger.error(f"Error listing logs: {e}")

    return LogResponse(
        logs=log_entries,
        count=len(log_entries),
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@app.get("/api/config")
async def get_config():
    """Get dashboard configuration"""
    return {
        "projects_path": PROJECTS_PATH,
        "logs_path": LOGS_PATH,
        "refresh_interval": REFRESH_INTERVAL,
        "timeout_minutes": TIMEOUT_MINUTES,
        "agents": AGENTS,
        "version": "1.0.0"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)