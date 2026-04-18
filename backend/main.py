"""
Obster Dashboard - FastAPI Backend
Monitors OpenClaw distributed system status.
"""

import os
import time
import subprocess
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load .env file if present
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
PROJECTS_PATH = os.getenv("PROJECTS_PATH", "/home/crawd_user/project")
LOGS_PATH = os.getenv("LOGS_PATH", "/home/crawd_user/.openclaw/workspace/logs/executions")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TIMEOUT_MINUTES = int(os.getenv("TIMEOUT_MINUTES", "30"))

# Agent list from environment variable (comma-separated)
_agents_env = os.getenv("AGENTS", "Argus,Hephaestus,Atlas,Hestia,Hermes,Main")
AGENTS = [a.strip() for a in _agents_env.split(",") if a.strip()]

# Services to monitor for cronjobs
CRONJOB_SERVICES = ["obster-monitor", "obster-cron", "openclaw-scheduler"]

# App version
VERSION = "1.0.0"

# Uptime tracking
app_start_time = time.time()


# ============ Pydantic Models ============

class Project(BaseModel):
    name: str
    path: str
    stage: str  # prd | dev | test | security
    iteration: int
    quality_score: int
    blocking_errors: List[str]
    updated_at: str


class ProjectResponse(BaseModel):
    projects: List[Project]
    timestamp: str


class CronJob(BaseModel):
    name: str
    status: str  # active | inactive | failed | error | timeout
    last_run: Optional[str]
    exit_code: Optional[int]
    recent_logs: List[str]


class CronJobResponse(BaseModel):
    cronjobs: List[CronJob]
    timestamp: str


class Agent(BaseModel):
    name: str
    status: str  # healthy | unhealthy | unknown | error
    last_response: Optional[str]
    minutes_ago: Optional[int]


class AgentResponse(BaseModel):
    agents: List[Agent]
    timestamp: str


class LogEntry(BaseModel):
    filename: str
    path: str
    timestamp: str
    content: Dict[str, Any]


class LogResponse(BaseModel):
    logs: List[LogEntry]
    count: int
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    version: str


# ============ FastAPI App ============

app = FastAPI(
    title="Obster Dashboard API",
    description="Backend API for monitoring OpenClaw distributed system",
    version=VERSION,
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_timestamp() -> str:
    """Get current UTC timestamp in ISO8601 format."""
    return datetime.utcnow().isoformat() + "Z"


@app.get("/api/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint."""
    uptime = time.time() - app_start_time
    return HealthResponse(
        status="healthy",
        uptime_seconds=round(uptime, 2),
        version=VERSION,
    )


@app.get("/api/projects", response_model=ProjectResponse)
def get_projects():
    """Scan PROJECTS_PATH/*/docs/.dev_status.json and return project status."""
    projects = []
    projects_path = Path(PROJECTS_PATH)

    if not projects_path.exists():
        logger.warning(f"Projects path does not exist: {PROJECTS_PATH}")
        return ProjectResponse(projects=[], timestamp=get_timestamp())

    try:
        for project_dir in projects_path.iterdir():
            if not project_dir.is_dir():
                continue

            dev_status_file = project_dir / "docs" / ".dev_status.json"
            if not dev_status_file.exists():
                continue

            try:
                import json
                with open(dev_status_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                project = Project(
                    name=project_dir.name,
                    path=str(project_dir),
                    stage=data.get("stage", "unknown"),
                    iteration=data.get("iteration", 0),
                    quality_score=data.get("quality_score", 0),
                    blocking_errors=data.get("blocking_errors", []),
                    updated_at=data.get("updated_at", ""),
                )
                projects.append(project)

            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Error reading {dev_status_file}: {e}")
                continue

    except Exception as e:
        logger.error(f"Error scanning projects: {e}")

    return ProjectResponse(
        projects=projects,
        timestamp=get_timestamp(),
    )


@app.get("/api/cronjobs", response_model=CronJobResponse)
def get_cronjobs(limit: int = Query(default=10, ge=1, le=100)):
    """Get cronjob status using systemctl show and journalctl."""
    cronjobs = []

    for service_name in CRONJOB_SERVICES:
        cronjob = _get_service_status(service_name, limit)
        cronjobs.append(cronjob)

    return CronJobResponse(
        cronjobs=cronjobs,
        timestamp=get_timestamp(),
    )


def _get_service_status(service_name: str, log_limit: int) -> CronJob:
    """Get status for a single systemd service."""
    status = "inactive"
    last_run = None
    exit_code = None
    recent_logs: List[str] = []

    # Get service status via systemctl show
    try:
        result = subprocess.run(
            ["systemctl", "show", service_name],
            capture_output=True,
            text=True,
            timeout=5,
        )

        for line in result.stdout.splitlines():
            if line.startswith("ActiveState="):
                active_state = line.split("=", 1)[1]
                if active_state == "active":
                    status = "active"
                elif active_state == "failed":
                    status = "failed"
                elif active_state == "inactive":
                    status = "inactive"
                else:
                    status = "error"
            elif line.startswith("ExecMainStatus="):
                try:
                    exit_code = int(line.split("=", 1)[1])
                except ValueError:
                    pass
            elif line.startswith("ActiveEnterTimestamp="):
                last_run = line.split("=", 1)[1] or None

    except subprocess.TimeoutExpired:
        logger.warning(f"Timeout getting status for {service_name}")
        status = "timeout"
        recent_logs = ["Timeout getting service status"]
    except Exception as e:
        logger.error(f"Error getting status for {service_name}: {e}")
        status = "error"
        recent_logs = [str(e)]

    # Get recent logs via journalctl
    try:
        result = subprocess.run(
            [
                "journalctl",
                "--since", "1 hour ago",
                "-u", service_name,
                "--no-pager",
                "-n", str(log_limit),
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.stdout:
            recent_logs = result.stdout.splitlines()[-log_limit:]
    except subprocess.TimeoutExpired:
        logger.warning(f"Timeout getting logs for {service_name}")
        recent_logs.append("Timeout getting service logs")
    except Exception as e:
        logger.error(f"Error getting logs for {service_name}: {e}")
        recent_logs.append(f"Error: {str(e)}")

    return CronJob(
        name=service_name,
        status=status,
        last_run=last_run,
        exit_code=exit_code,
        recent_logs=recent_logs,
    )


@app.get("/api/agents", response_model=AgentResponse)
def get_agents(timeout_minutes: int = Query(default=30, ge=1, le=1440)):
    """Query Telegram Bot API getUpdates to track agent health."""
    agents_data = []

    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set, returning all agents as unknown")
        for agent_name in AGENTS:
            agents_data.append(Agent(
                name=agent_name,
                status="unknown",
                last_response=None,
                minutes_ago=None,
            ))
        return AgentResponse(agents=agents_data, timestamp=get_timestamp())

    # Fetch updates from Telegram
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
        params = {"limit": 100}
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data.get("ok"):
            logger.error(f"Telegram API error: {data}")
            for agent_name in AGENTS:
                agents_data.append(Agent(
                    name=agent_name,
                    status="error",
                    last_response=None,
                    minutes_ago=None,
                ))
            return AgentResponse(agents=agents_data, timestamp=get_timestamp())

        updates = data.get("result", [])

        # Track last message time for each agent
        agent_last_message: Dict[str, Optional[str]] = {name: None for name in AGENTS}

        for update in updates:
            message = update.get("message", {})
            text = message.get("text", "")
            chat = message.get("chat", {})
            username = chat.get("username", "")

            # Try to match agent name in username or message text
            for agent_name in AGENTS:
                if agent_name.lower() in username.lower() or agent_name.lower() in text.lower():
                    date_str = message.get("date")
                    if date_str:
                        agent_last_message[agent_name] = str(date_str)

        # Calculate agent statuses
        now = datetime.utcnow()
        for agent_name in AGENTS:
            last_response = agent_last_message.get(agent_name)
            if last_response:
                try:
                    # Handle Unix timestamp
                    if isinstance(last_response, int) or (isinstance(last_response, str) and last_response.isdigit()):
                        last_time = datetime.fromtimestamp(int(last_response))
                    else:
                        last_time = datetime.fromisoformat(str(last_response).replace("Z", "+00:00"))

                    delta = now - last_time
                    minutes_ago = int(delta.total_seconds() / 60)

                    if minutes_ago >= timeout_minutes:
                        status = "unhealthy"
                    else:
                        status = "healthy"

                    agents_data.append(Agent(
                        name=agent_name,
                        status=status,
                        last_response=last_response,
                        minutes_ago=minutes_ago,
                    ))
                except (ValueError, OSError) as e:
                    logger.error(f"Error parsing time for {agent_name}: {e}")
                    agents_data.append(Agent(
                        name=agent_name,
                        status="unknown",
                        last_response=last_response,
                        minutes_ago=None,
                    ))
            else:
                agents_data.append(Agent(
                    name=agent_name,
                    status="unknown",
                    last_response=None,
                    minutes_ago=None,
                ))

    except requests.RequestException as e:
        logger.error(f"Error fetching Telegram updates: {e}")
        for agent_name in AGENTS:
            agents_data.append(Agent(
                name=agent_name,
                status="error",
                last_response=None,
                minutes_ago=None,
            ))

    return AgentResponse(agents=agents_data, timestamp=get_timestamp())


@app.get("/api/logs", response_model=LogResponse)
def get_logs(limit: int = Query(default=20, ge=1, le=100)):
    """Read LOGS_PATH/*.json files, sort by mtime descending."""
    logs: List[LogEntry] = []
    logs_path = Path(LOGS_PATH)

    if not logs_path.exists():
        logger.warning(f"Logs path does not exist: {LOGS_PATH}")
        return LogResponse(logs=[], count=0, timestamp=get_timestamp())

    try:
        # Get all JSON files with their modification times
        json_files = []
        for json_file in logs_path.glob("*.json"):
            try:
                mtime = json_file.stat().st_mtime
                json_files.append((mtime, json_file))
            except OSError as e:
                logger.error(f"Error getting stat for {json_file}: {e}")
                continue

        # Sort by modification time descending
        json_files.sort(key=lambda x: x[0], reverse=True)

        # Take the first `limit` files
        for mtime, json_file in json_files[:limit]:
            try:
                import json
                with open(json_file, "r", encoding="utf-8") as f:
                    content = json.load(f)

                # Get modification time as timestamp
                timestamp = datetime.fromtimestamp(mtime).isoformat() + "Z"

                logs.append(LogEntry(
                    filename=json_file.name,
                    path=str(json_file),
                    timestamp=timestamp,
                    content=content,
                ))
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Error reading log file {json_file}: {e}")
                continue

    except Exception as e:
        logger.error(f"Error scanning logs: {e}")

    return LogResponse(
        logs=logs,
        count=len(logs),
        timestamp=get_timestamp(),
    )


@app.get("/api/config")
def get_config():
    """Return system configuration (non-sensitive)."""
    return {
        "PROJECTS_PATH": PROJECTS_PATH,
        "LOGS_PATH": LOGS_PATH,
        "TELEGRAM_BOT_TOKEN_SET": bool(TELEGRAM_BOT_TOKEN),
        "TIMEOUT_MINUTES": TIMEOUT_MINUTES,
        "AGENTS": AGENTS,
        "CRONJOB_SERVICES": CRONJOB_SERVICES,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)