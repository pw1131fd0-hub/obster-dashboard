"""
Obster Dashboard Backend - FastAPI Application
Monitors OpenClaw distributed system: projects, cronjobs, agents, and logs.
"""

import os
import json
import time
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Version
VERSION = "1.0.0"

# Environment variables with defaults
PROJECTS_PATH = os.getenv("PROJECTS_PATH", "/home/crawd_user/project")
LOGS_PATH = os.getenv("LOGS_PATH", "/home/crawd_user/.openclaw/workspace/logs/executions")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TIMEOUT_MINUTES = int(os.getenv("TIMEOUT_MINUTES", "30"))

# Agent names
AGENTS = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]

# Systemd services to monitor
SYSTEMD_SERVICES = ["obster-monitor", "obster-cron", "openclaw-scheduler"]

# App start time for uptime calculation
APP_START_TIME = time.time()

# FastAPI app
app = FastAPI(
    title="Obster Dashboard API",
    description="Backend API for monitoring OpenClaw distributed system",
    version=VERSION,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Pydantic Models ============

class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    version: str


class Project(BaseModel):
    name: str
    path: str
    stage: str
    iteration: int
    quality_score: float
    blocking_errors: list[str]
    updated_at: str


class ProjectResponse(BaseModel):
    projects: list[Project]
    timestamp: str


class CronJob(BaseModel):
    name: str
    status: str
    last_run: Optional[str]
    exit_code: Optional[int]
    recent_logs: list[str]


class CronJobResponse(BaseModel):
    cronjobs: list[CronJob]
    timestamp: str


class Agent(BaseModel):
    name: str
    status: str
    last_response: Optional[str]
    minutes_ago: Optional[float]


class AgentResponse(BaseModel):
    agents: list[Agent]
    timestamp: str


class LogEntry(BaseModel):
    filename: str
    path: str
    timestamp: str
    content: dict


class LogResponse(BaseModel):
    logs: list[LogEntry]
    count: int
    timestamp: str


class ConfigResponse(BaseModel):
    projects_path: str
    logs_path: str
    timeout_minutes: int
    agents: list[str]
    services: list[str]


# ============ Helper Functions ============

def get_uptime() -> float:
    """Return uptime in seconds."""
    return time.time() - APP_START_TIME


def read_json_file(filepath: Path) -> Optional[dict]:
    """Read and parse a JSON file, return None on error."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except (IOError, json.JSONDecodeError):
        return None


def parse_systemctl_show(service_name: str) -> dict:
    """Parse systemctl show output into a dict."""
    try:
        result = subprocess.run(
            ["systemctl", "show", service_name],
            capture_output=True,
            text=True,
            timeout=5,
        )
        data = {}
        for line in result.stdout.strip().split("\n"):
            if "=" in line:
                key, value = line.split("=", 1)
                data[key] = value
        return data
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, OSError):
        return {}


def get_journal_logs(service_name: str, limit: int = 10) -> list[str]:
    """Get recent journal logs for a service."""
    try:
        result = subprocess.run(
            [
                "journalctl",
                "--since", "1 hour ago",
                "-u", service_name,
                "--no-pager",
                "-n", str(limit),
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )
        lines = result.stdout.strip().split("\n")
        return [line for line in lines if line] if lines else []
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, OSError):
        return []


def poll_telegram_get_updates() -> list[dict]:
    """Poll Telegram Bot API getUpdates."""
    if not TELEGRAM_BOT_TOKEN:
        return []
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
        response = requests.get(url, params={"limit": 100}, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("ok"):
            return data.get("result", [])
        return []
    except (requests.RequestException, ValueError):
        return []


# ============ API Endpoints ============

@app.get("/api/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        uptime_seconds=round(get_uptime(), 2),
        version=VERSION,
    )


@app.get("/api/projects", response_model=ProjectResponse)
def get_projects():
    """Scan PROJECTS_PATH for docs/.dev_status.json files."""
    projects = []
    projects_path = Path(PROJECTS_PATH)

    if not projects_path.exists():
        return ProjectResponse(projects=[], timestamp=datetime.now(timezone.utc).isoformat())

    for subdir in projects_path.iterdir():
        if not subdir.is_dir():
            continue
        dev_status_path = subdir / "docs" / ".dev_status.json"
        if dev_status_path.exists():
            data = read_json_file(dev_status_path)
            if data:
                project = Project(
                    name=subdir.name,
                    path=str(subdir),
                    stage=data.get("stage", "unknown"),
                    iteration=data.get("iteration", 0),
                    quality_score=data.get("quality_score", 0.0),
                    blocking_errors=data.get("blocking_errors", []),
                    updated_at=data.get("updated_at", ""),
                )
                projects.append(project)

    return ProjectResponse(
        projects=projects,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/api/cronjobs", response_model=CronJobResponse)
def get_cronjobs():
    """Get cronjob status using systemctl show and journalctl."""
    cronjobs = []

    for service_name in SYSTEMD_SERVICES:
        status = "inactive"
        last_run = None
        exit_code = None
        recent_logs: list[str] = []

        try:
            # Get systemctl show data
            data = parse_systemctl_show(service_name)
            active_state = data.get("ActiveState", "inactive")
            exec_main_status = data.get("ExecMainStatus", "0")

            if active_state == "active":
                status = "active"
            elif active_state == "failed":
                status = "failed"
            elif active_state == "activating":
                status = "activating"
            else:
                status = "inactive"

            try:
                exit_code = int(exec_main_status) if exec_main_status else None
            except ValueError:
                exit_code = None

            # Get last run time from ActiveEnterTimestamp
            last_run = data.get("ActiveEnterTimestamp", None)

            # Get recent logs
            recent_logs = get_journal_logs(service_name, limit=5)

        except Exception:
            status = "error"
            recent_logs = ["Failed to retrieve service status"]

        cronjobs.append(CronJob(
            name=service_name,
            status=status,
            last_run=last_run,
            exit_code=exit_code,
            recent_logs=recent_logs,
        ))

    return CronJobResponse(
        cronjobs=cronjobs,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/api/agents", response_model=AgentResponse)
def get_agents():
    """Poll Telegram Bot API to determine agent health."""
    agents = []
    now = datetime.now(timezone.utc)

    # If no token, return all as unknown
    if not TELEGRAM_BOT_TOKEN:
        for agent_name in AGENTS:
            agents.append(Agent(
                name=agent_name,
                status="unknown",
                last_response=None,
                minutes_ago=None,
            ))
        return AgentResponse(agents=agents, timestamp=now.isoformat())

    # Poll Telegram
    updates = poll_telegram_get_updates()

    # Track last message time for each agent
    agent_last_times: dict[str, Optional[datetime]] = {name: None for name in AGENTS}

    for update in updates:
        message = update.get("message", {})
        text = message.get("text", "")
        date_str = message.get("date", "")

        if not date_str:
            continue

        try:
            msg_time = datetime.fromtimestamp(int(date_str))
        except (ValueError, TypeError):
            continue

        # Check if any agent name is in the message text
        for agent_name in AGENTS:
            if agent_name.lower() in text.lower():
                if agent_last_times[agent_name] is None or msg_time > agent_last_times[agent_name]:
                    agent_last_times[agent_name] = msg_time

    # Build agent responses
    for agent_name in AGENTS:
        last_time = agent_last_times[agent_name]

        if last_time is None:
            status = "unknown"
            minutes_ago = None
            last_response = None
        else:
            delta = (now - last_time).total_seconds() / 60
            minutes_ago = round(delta, 1)
            if delta >= TIMEOUT_MINUTES:
                status = "unhealthy"
            else:
                status = "healthy"
            last_response = last_time.isoformat()

        agents.append(Agent(
            name=agent_name,
            status=status,
            last_response=last_response,
            minutes_ago=minutes_ago,
        ))

    return AgentResponse(agents=agents, timestamp=now.isoformat())


@app.get("/api/logs", response_model=LogResponse)
def get_logs(limit: int = 20):
    """Read *.json files from LOGS_PATH, sorted by mtime descending."""
    logs = []
    logs_path = Path(LOGS_PATH)

    if not logs_path.exists():
        return LogResponse(logs=[], count=0, timestamp=datetime.now(timezone.utc).isoformat())

    # Find all JSON files
    json_files = list(logs_path.glob("*.json"))

    # Sort by modification time descending
    json_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

    # Limit and process
    for filepath in json_files[:limit]:
        data = read_json_file(filepath)
        if data is None:
            continue

        # Get timestamp from file or content
        timestamp = data.get("completed_at") or data.get("started_at") or ""
        if not timestamp:
            # Use file mtime
            timestamp = datetime.fromtimestamp(filepath.stat().st_mtime).isoformat()

        logs.append(LogEntry(
            filename=filepath.name,
            path=str(filepath),
            timestamp=timestamp,
            content=data,
        ))

    return LogResponse(
        logs=logs,
        count=len(logs),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/api/config", response_model=ConfigResponse)
def get_config():
    """Return environment configuration."""
    return ConfigResponse(
        projects_path=PROJECTS_PATH,
        logs_path=LOGS_PATH,
        timeout_minutes=TIMEOUT_MINUTES,
        agents=AGENTS,
        services=SYSTEMD_SERVICES,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
