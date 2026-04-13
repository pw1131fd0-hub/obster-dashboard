import os
import time
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Environment Variables
PROJECTS_PATH = Path(os.getenv("PROJECTS_PATH", "/home/crawd_user/project"))
LOGS_PATH = Path(os.getenv("LOGS_PATH", "/home/crawd_user/.openclaw/workspace/logs/executions"))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TIMEOUT_MINUTES = int(os.getenv("TIMEOUT_MINUTES", "30"))
AGENTS = os.getenv("AGENTS", "Argus,Hephaestus,Atlas,Hestia,Hermes,Main").split(",")
AGENTS = [a.strip() for a in AGENTS]

VERSION = "1.0.0"

# Uptime tracking
APP_START_TIME = time.time()

# FastAPI App
app = FastAPI(title="Obster Dashboard API", version=VERSION)


# ============== Response Models ==============

class HealthResponse(BaseModel):
    status: str
    uptime_seconds: int
    version: str


class Project(BaseModel):
    name: str
    path: str
    stage: str
    iteration: int
    quality_score: int
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
    minutes_ago: Optional[int]


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


# ============== Helper Functions ==============

def get_uptime_seconds() -> int:
    return int(time.time() - APP_START_TIME)


def parse_systemctl_show(service_name: str) -> dict:
    """Parse systemctl show output for a service."""
    result = {
        "status": "unknown",
        "last_run": None,
        "exit_code": None,
        "recent_logs": []
    }
    try:
        proc = subprocess.run(
            ["systemctl", "show", service_name],
            capture_output=True,
            text=True,
            timeout=5
        )
        for line in proc.stdout.splitlines():
            if line.startswith("ActiveState="):
                state = line.split("=", 1)[1]
                if state == "active":
                    result["status"] = "active"
                elif state == "inactive":
                    result["status"] = "inactive"
                else:
                    result["status"] = state
            elif line.startswith("ExecMainStatus="):
                result["exit_code"] = int(line.split("=", 1)[1])
    except subprocess.TimeoutExpired:
        result["status"] = "timeout"
    except Exception as e:
        result["status"] = "error"
        result["recent_logs"] = [str(e)]

    # Get last run time from journalctl
    try:
        proc = subprocess.run(
            ["journalctl", "--since", "1 hour ago", "-u", service_name, "--no-pager", "-n", "5"],
            capture_output=True,
            text=True,
            timeout=5
        )
        result["recent_logs"] = [line.strip() for line in proc.stdout.splitlines() if line.strip()][:5]
        # Get the most recent timestamp as last_run
        if proc.stdout:
            first_line = proc.stdout.splitlines()[0] if proc.stdout.splitlines() else ""
            if first_line:
                # Try to extract timestamp from journalctl output
                result["last_run"] = first_line.split(" ")[0:2] if len(first_line.split(" ")) >= 2 else None
                if result["last_run"]:
                    result["last_run"] = " ".join(result["last_run"])
    except subprocess.TimeoutExpired:
        result["recent_logs"] = ["timeout"]
    except Exception as e:
        result["recent_logs"].append(str(e))

    return result


def scan_projects() -> list[Project]:
    """Scan PROJECTS_PATH for .dev_status.json files."""
    projects = []
    if not PROJECTS_PATH.exists():
        return projects

    for entry in PROJECTS_PATH.iterdir():
        if not entry.is_dir():
            continue
        dev_status_file = entry / "docs" / ".dev_status.json"
        if not dev_status_file.exists():
            continue
        try:
            with open(dev_status_file, "r") as f:
                data = json.load(f)
            projects.append(Project(
                name=entry.name,
                path=str(entry),
                stage=data.get("stage", "unknown"),
                iteration=data.get("iteration", 0),
                quality_score=data.get("quality_score", 0),
                blocking_errors=data.get("blocking_errors", []),
                updated_at=data.get("updated_at", "")
            ))
        except Exception:
            continue

    return projects


def get_agent_health() -> list[Agent]:
    """Get agent health by polling Telegram Bot API getUpdates."""
    agents_data = []
    now = datetime.now(timezone.utc)

    if not TELEGRAM_BOT_TOKEN:
        for name in AGENTS:
            agents_data.append(Agent(
                name=name,
                status="unknown",
                last_response=None,
                minutes_ago=None
            ))
        return agents_data

    try:
        response = requests.get(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates",
            params={"limit": 100},
            timeout=10
        )
        response.raise_for_status()
        updates = response.json().get("result", [])

        # Track last update time per agent name
        agent_last_times = {name: None for name in AGENTS}

        for update in updates:
            msg = update.get("message", {})
            text = msg.get("text", "")
            # Check if any agent name appears in the message
            for name in AGENTS:
                if name.lower() in text.lower():
                    ts = msg.get("date")
                    if ts:
                        msg_time = datetime.fromtimestamp(ts, tz=timezone.utc)
                        if agent_last_times[name] is None or msg_time > agent_last_times[name]:
                            agent_last_times[name] = msg_time

        for name in AGENTS:
            last_time = agent_last_times[name]
            if last_time is None:
                agents_data.append(Agent(
                    name=name,
                    status="unknown",
                    last_response=None,
                    minutes_ago=None
                ))
            else:
                diff = (now - last_time).total_seconds() / 60
                minutes_ago = int(diff)
                status = "healthy" if minutes_ago < TIMEOUT_MINUTES else "unhealthy"
                agents_data.append(Agent(
                    name=name,
                    status=status,
                    last_response=last_time.isoformat(),
                    minutes_ago=minutes_ago
                ))

    except Exception:
        for name in AGENTS:
            agents_data.append(Agent(
                name=name,
                status="error",
                last_response=None,
                minutes_ago=None
            ))

    return agents_data


def read_logs(limit: int = 20) -> list[LogEntry]:
    """Read log files from LOGS_PATH, sorted by mtime descending."""
    logs = []
    if not LOGS_PATH.exists():
        return logs

    json_files = list(LOGS_PATH.glob("*.json"))
    json_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

    for file in json_files[:limit]:
        try:
            with open(file, "r") as f:
                content = json.load(f)
            logs.append(LogEntry(
                filename=file.name,
                path=str(file),
                timestamp=datetime.fromtimestamp(file.stat().st_mtime, tz=timezone.utc).isoformat(),
                content=content
            ))
        except Exception:
            continue

    return logs


# ============== API Endpoints ==============

@app.get("/api/health")
async def get_health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        uptime_seconds=get_uptime_seconds(),
        version=VERSION
    )


@app.get("/api/projects")
async def get_projects():
    """Get all project statuses."""
    projects = scan_projects()
    return ProjectResponse(
        projects=projects,
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@app.get("/api/cronjobs")
async def get_cronjobs():
    """Get cronjob statuses using systemctl and journalctl."""
    services = ["obster-monitor", "obster-cron", "openclaw-scheduler"]
    cronjobs = []

    for service in services:
        data = parse_systemctl_show(service)
        cronjobs.append(CronJob(
            name=service,
            status=data["status"],
            last_run=data["last_run"],
            exit_code=data["exit_code"],
            recent_logs=data["recent_logs"]
        ))

    return CronJobResponse(
        cronjobs=cronjobs,
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@app.get("/api/agents")
async def get_agents():
    """Get agent health by polling Telegram Bot API."""
    agents = get_agent_health()
    return AgentResponse(
        agents=agents,
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@app.get("/api/logs")
async def get_logs(limit: int = 20):
    """Get execution logs from LOGS_PATH."""
    logs = read_logs(limit)
    return LogResponse(
        logs=logs,
        count=len(logs),
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@app.get("/api/config")
async def get_config():
    """Get system configuration."""
    return {
        "PROJECTS_PATH": str(PROJECTS_PATH),
        "LOGS_PATH": str(LOGS_PATH),
        "TELEGRAM_BOT_TOKEN": "***" if TELEGRAM_BOT_TOKEN else "",
        "TIMEOUT_MINUTES": TIMEOUT_MINUTES,
        "AGENTS": AGENTS,
        "VERSION": VERSION
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "code": "INTERNAL_ERROR"}
    )
