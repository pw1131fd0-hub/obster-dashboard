"""
Obster Dashboard Backend API
FastAPI application providing system monitoring endpoints.
"""

import json
import os
import subprocess
import time
from datetime import datetime
from glob import glob
from pathlib import Path
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Environment configuration
PROJECTS_PATH = os.getenv("PROJECTS_PATH", "/home/crawd_user/project")
LOGS_PATH = os.getenv("LOGS_PATH", "/home/crawd_user/.openclaw/workspace/logs/executions")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TIMEOUT_MINUTES = int(os.getenv("TIMEOUT_MINUTES", "30"))

# Pydantic Models


class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    version: str


class ProjectStatus(BaseModel):
    name: str
    path: str
    last_updated: Optional[str] = None
    dev_status: Optional[dict] = None


class ProjectResponse(BaseModel):
    projects: list[ProjectStatus]
    total: int


class CronJobService(BaseModel):
    name: str
    active_state: str
    sub_state: str
    load_state: str
    unit_file: Optional[str] = None


class CronJobResponse(BaseModel):
    services: list[CronJobService]
    total: int


class AgentStatus(BaseModel):
    name: str
    active: bool
    last_update: Optional[dict] = None
    error: Optional[str] = None


class AgentResponse(BaseModel):
    agents: list[AgentStatus]
    total: int


class LogEntry(BaseModel):
    filename: str
    path: str
    mtime: float
    content: Optional[dict] = None


class LogResponse(BaseModel):
    logs: list[LogEntry]
    total: int


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
            timeout=10,
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
            ["journalctl", "-u", service_name, "-n", str(lines), "--no-pager"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            return result.stdout.strip().split("\n")
        return []
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        return []


def poll_telegram_updates(agent_name: str, offset: int = 0) -> dict:
    """Poll Telegram Bot API for updates."""
    if not TELEGRAM_BOT_TOKEN:
        return {"error": "Telegram bot token not configured"}

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
        params = {"offset": offset, "timeout": 1}
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        if response.status_code == 200 and data.get("ok"):
            updates = data.get("result", [])
            for update in updates:
                if update.get("message", {}).get("chat", {}).get("username") == agent_name:
                    return {"update": update, "agent_name": agent_name}
            return {"update_count": len(updates), "agent_name": agent_name}
        return {"error": data.get("description", "Unknown error")}
    except requests.RequestException as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": str(e)}


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
                stat = dev_status_path.stat()
                projects.append(
                    ProjectStatus(
                        name=project_dir.name,
                        path=str(project_dir),
                        last_updated=datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        dev_status=dev_status,
                    )
                )
            except (json.JSONDecodeError, IOError):
                projects.append(
                    ProjectStatus(
                        name=project_dir.name,
                        path=str(project_dir),
                        last_updated=None,
                        dev_status=None,
                    )
                )
    return projects


def scan_logs(limit: int = 20) -> list[LogEntry]:
    """Scan LOGS_PATH for JSON log files sorted by mtime desc."""
    logs_path = Path(LOGS_PATH)

    if not logs_path.exists():
        return []

    log_files = glob(str(logs_path / "*.json"))
    file_times = []
    for log_file in log_files:
        try:
            stat = Path(log_file).stat()
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
            LogEntry(
                filename=Path(log_file).name,
                path=log_file,
                mtime=mtime,
                content=content,
            )
        )
    return log_entries


# API Endpoints


@app.get("/api/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint."""
    uptime = time.time() - APP_START_TIME
    return HealthResponse(status="healthy", uptime_seconds=round(uptime, 2), version="1.0.0")


@app.get("/api/projects", response_model=ProjectResponse)
def get_projects():
    """Get all projects with .dev_status.json files."""
    projects = scan_projects()
    return ProjectResponse(projects=projects, total=len(projects))


@app.get("/api/cronjobs", response_model=CronJobResponse)
def get_cronjobs():
    """Get cron job service statuses."""
    service_names = ["obster-monitor", "obster-cron", "openclaw-scheduler"]
    services = []

    for name in service_names:
        info = get_systemctl_show(name)
        services.append(
            CronJobService(
                name=name,
                active_state=info.get("ActiveState", "unknown"),
                sub_state=info.get("SubState", "unknown"),
                load_state=info.get("LoadState", "unknown"),
                unit_file=info.get("UnitFile"),
            )
        )

    return CronJobResponse(services=services, total=len(services))


@app.get("/api/agents", response_model=AgentResponse)
def get_agents():
    """Get agent statuses by polling Telegram Bot API."""
    agent_names = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]
    agents = []

    for name in agent_names:
        result = poll_telegram_updates(name)
        if "error" in result:
            agents.append(AgentStatus(name=name, active=False, error=result["error"]))
        else:
            agents.append(AgentStatus(name=name, active=True, last_update=result.get("update")))

    return AgentResponse(agents=agents, total=len(agents))


@app.get("/api/logs", response_model=LogResponse)
def get_logs(limit: int = 20):
    """Get recent log files sorted by modification time."""
    if limit < 1 or limit > 100:
        limit = 20
    logs = scan_logs(limit=limit)
    return LogResponse(logs=logs, total=len(logs))


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
