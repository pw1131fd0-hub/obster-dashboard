"""
Obster Dashboard Backend API
FastAPI application providing system monitoring endpoints.
"""

import json
import os
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import requests
from fastapi import FastAPI
from pydantic import BaseModel

# Environment configuration
PROJECTS_PATH = os.getenv("PROJECTS_PATH", "/home/crawd_user/project")
LOGS_PATH = os.getenv("LOGS_PATH", "/home/crawd_user/.openclaw/workspace/logs/executions")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TIMEOUT_MINUTES = int(os.getenv("TIMEOUT_MINUTES", "30"))

# Agent list
AGENTS = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]

# CronJob services to monitor
CRONJOB_SERVICES = ["obster-monitor", "obster-cron", "openclaw-scheduler"]

# Pydantic Models


class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    version: str


class ProjectStatus(BaseModel):
    name: str
    path: str
    stage: Optional[str] = None
    iteration: Optional[int] = None
    quality_score: Optional[int] = None
    blocking_errors: list[str] = []
    updated_at: Optional[str] = None


class ProjectResponse(BaseModel):
    projects: list[ProjectStatus]
    timestamp: str


class CronJobServiceStatus(BaseModel):
    name: str
    status: str
    last_run: Optional[str] = None
    exit_code: Optional[int] = None
    recent_logs: list[str] = []


class CronJobResponse(BaseModel):
    cronjobs: list[CronJobServiceStatus]
    timestamp: str


class AgentInfo(BaseModel):
    name: str
    status: str
    last_response: Optional[str] = None
    minutes_ago: Optional[int] = None


class AgentResponse(BaseModel):
    agents: list[AgentInfo]
    timestamp: str


class LogFile(BaseModel):
    filename: str
    path: str
    timestamp: str
    content: Optional[dict] = None


class LogResponse(BaseModel):
    logs: list[LogFile]
    count: int
    timestamp: str


class ConfigResponse(BaseModel):
    PROJECTS_PATH: str
    LOGS_PATH: str
    TELEGRAM_BOT_TOKEN: str
    TIMEOUT_MINUTES: int


# FastAPI Application
app = FastAPI(title="Obster Dashboard API", version="1.0.0")

# Track application start time
APP_START_TIME = time.time()


def get_systemctl_show(service_name: str) -> dict:
    """Get systemctl show output for a service."""
    try:
        result = subprocess.run(
            ["systemctl", "show", service_name],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            info = {}
            for line in result.stdout.strip().split("\n"):
                if "=" in line:
                    key, value = line.split("=", 1)
                    info[key] = value
            return info
        return {}
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        return {}


def get_journalctl_logs(service_name: str, lines: int = 10) -> list[str]:
    """Get recent journalctl logs for a service."""
    try:
        result = subprocess.run(
            ["journalctl", "-u", service_name, "--since", "1 hour ago", "-n", str(lines), "--no-pager"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            return result.stdout.strip().split("\n")
        return []
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        return []


def poll_telegram_updates() -> dict:
    """Poll Telegram Bot API for updates."""
    if not TELEGRAM_BOT_TOKEN:
        return {}

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
        params = {"limit": 100, "timeout": 1}
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        if response.status_code == 200 and data.get("ok"):
            return {"updates": data.get("result", [])}
        return {}
    except requests.RequestException:
        return {}
    except Exception:
        return {}


def scan_projects() -> list[ProjectStatus]:
    """Scan PROJECTS_PATH for project .dev_status.json files."""
    projects = []
    projects_base = Path(PROJECTS_PATH)

    if not projects_base.exists():
        return projects

    for project_dir in projects_base.iterdir():
        if not project_dir.is_dir():
            continue
        dev_status_path = project_dir / "docs" / ".dev_status.json"
        if dev_status_path.exists():
            try:
                with open(dev_status_path, "r") as f:
                    dev_status = json.load(f)
                projects.append(
                    ProjectStatus(
                        name=project_dir.name,
                        path=str(project_dir),
                        stage=dev_status.get("stage"),
                        iteration=dev_status.get("iteration"),
                        quality_score=dev_status.get("quality_score"),
                        blocking_errors=dev_status.get("blocking_errors", []),
                        updated_at=dev_status.get("updated_at"),
                    )
                )
            except (json.JSONDecodeError, IOError, KeyError):
                projects.append(
                    ProjectStatus(
                        name=project_dir.name,
                        path=str(project_dir),
                        blocking_errors=[],
                    )
                )
    return projects


def scan_logs(limit: int = 20) -> list[LogFile]:
    """Scan LOGS_PATH for JSON log files sorted by mtime desc."""
    logs_path = Path(LOGS_PATH)

    if not logs_path.exists():
        return []

    log_files = list(logs_path.glob("*.json"))
    file_times = []
    for log_file in log_files:
        try:
            stat = log_file.stat()
            file_times.append((stat.st_mtime, log_file))
        except OSError:
            continue

    # Sort by mtime descending
    file_times.sort(key=lambda x: x[0], reverse=True)
    file_times = file_times[:limit]

    log_entries = []
    for mtime, log_file in file_times:
        content = None
        try:
            with open(log_file, "r") as f:
                content = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass

        log_entries.append(
            LogFile(
                filename=log_file.name,
                path=str(log_file),
                timestamp=datetime.fromtimestamp(mtime).isoformat(),
                content=content,
            )
        )
    return log_entries


def get_cronjob_status(service_name: str) -> CronJobServiceStatus:
    """Get status for a single cronjob service."""
    info = get_systemctl_show(service_name)
    active_state = info.get("ActiveState", "unknown")
    exit_code_str = info.get("ExecMainStatus", "")
    exit_code = int(exit_code_str) if exit_code_str.isdigit() else None

    # Map systemctl state to our status
    if active_state == "active":
        status = "active"
    elif active_state == "inactive":
        status = "inactive"
    elif active_state == "failed":
        status = "failed"
    else:
        status = "error"

    recent_logs = get_journalctl_logs(service_name, lines=5)

    return CronJobServiceStatus(
        name=service_name,
        status=status,
        last_run=None,
        exit_code=exit_code,
        recent_logs=recent_logs,
    )


def get_agent_status(agent_name: str, updates: list) -> AgentInfo:
    """Get status for a single agent based on Telegram updates."""
    now = datetime.utcnow()

    for update in updates:
        message = update.get("message", {})
        chat = message.get("chat", {})
        username = chat.get("username", "")

        if username == agent_name:
            date_str = message.get("date")
            if date_str:
                try:
                    last_response = datetime.fromtimestamp(date_str)
                    minutes_ago = int((now - last_response).total_seconds() / 60)

                    if minutes_ago >= TIMEOUT_MINUTES:
                        agent_status = "unhealthy"
                    else:
                        agent_status = "healthy"

                    return AgentInfo(
                        name=agent_name,
                        status=agent_status,
                        last_response=last_response.isoformat(),
                        minutes_ago=minutes_ago,
                    )
                except (ValueError, OSError):
                    pass

    return AgentInfo(
        name=agent_name,
        status="unknown",
        last_response=None,
        minutes_ago=None,
    )


# API Endpoints


@app.get("/api/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint."""
    uptime = time.time() - APP_START_TIME
    return HealthResponse(
        status="healthy",
        uptime_seconds=round(uptime, 2),
        version="1.0.0"
    )


@app.get("/api/projects", response_model=ProjectResponse)
def get_projects():
    """Get all projects with .dev_status.json files."""
    projects = scan_projects()
    return ProjectResponse(
        projects=projects,
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/api/cronjobs", response_model=CronJobResponse)
def get_cronjobs():
    """Get cron job service statuses using systemctl and journalctl."""
    cronjobs = []
    for service_name in CRONJOB_SERVICES:
        cronjobs.append(get_cronjob_status(service_name))

    return CronJobResponse(
        cronjobs=cronjobs,
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/api/agents", response_model=AgentResponse)
def get_agents():
    """Get agent statuses by polling Telegram Bot API."""
    updates_data = poll_telegram_updates()
    updates = updates_data.get("updates", [])

    agents_info = []
    for agent_name in AGENTS:
        agents_info.append(get_agent_status(agent_name, updates))

    return AgentResponse(
        agents=agents_info,
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/api/logs", response_model=LogResponse)
def get_logs(limit: int = 20):
    """Get recent log files sorted by modification time."""
    if limit < 1:
        limit = 20
    if limit > 100:
        limit = 20

    logs = scan_logs(limit=limit)
    return LogResponse(
        logs=logs,
        count=len(logs),
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/api/config", response_model=ConfigResponse)
def get_config():
    """Get current environment configuration."""
    return ConfigResponse(
        PROJECTS_PATH=PROJECTS_PATH,
        LOGS_PATH=LOGS_PATH,
        TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN,
        TIMEOUT_MINUTES=TIMEOUT_MINUTES,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
