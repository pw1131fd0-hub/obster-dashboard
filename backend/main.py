"""
Obster Dashboard Backend - FastAPI Application
Monitors OpenClaw distributed system status via REST API.
"""

import json
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Environment Variables
PROJECTS_PATH = os.getenv("PROJECTS_PATH", "/home/crawd_user/project")
LOGS_PATH = os.getenv("LOGS_PATH", "/home/crawd_user/.openclaw/workspace/logs/executions")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TIMEOUT_MINUTES = int(os.getenv("TIMEOUT_MINUTES", "30"))

# Default services to check
DEFAULT_SERVICES = ["obster-monitor", "obster-cron", "openclaw-scheduler"]

# Default agents
DEFAULT_AGENTS = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]

VERSION = "1.0.0"

# Uptime tracking
APP_START_TIME = time.time()

# FastAPI App
app = FastAPI(title="Obster Dashboard API", version=VERSION)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Response Models ==============


class HealthResponse(BaseModel):
    """Health check response model per PLAN.md section 8.2."""
    status: str = Field(description="Health status", examples=["healthy"])
    uptime_seconds: float = Field(description="Application uptime in seconds")
    version: str = Field(description="Application version")


class Project(BaseModel):
    """Individual project status per PLAN.md section 8.2."""
    name: str = Field(description="Project name")
    path: str = Field(description="Project path")
    stage: str = Field(description="Current stage (prd|dev|test|security)")
    iteration: int = Field(description="Iteration number")
    quality_score: float = Field(description="Quality score (0-100)")
    blocking_errors: list[str] = Field(description="List of blocking errors")
    updated_at: str = Field(description="Last update timestamp (ISO8601)")


class ProjectResponse(BaseModel):
    """Projects list response model per PLAN.md section 8.2."""
    projects: list[Project] = Field(description="List of projects")
    timestamp: str = Field(description="Response timestamp")


class CronJob(BaseModel):
    """Individual cron job status per PLAN.md section 8.2."""
    name: str = Field(description="Service name")
    status: str = Field(description="Status (active|inactive|failed|error)")
    last_run: Optional[str] = Field(default=None, description="Last run timestamp")
    exit_code: Optional[int] = Field(default=None, description="Exit code")
    recent_logs: list[str] = Field(description="Recent log lines")


class CronJobResponse(BaseModel):
    """Cron jobs list response model per PLAN.md section 8.2."""
    cronjobs: list[CronJob] = Field(description="List of cron jobs")
    timestamp: str = Field(description="Response timestamp")


class Agent(BaseModel):
    """Individual agent status per PLAN.md section 8.2."""
    name: str = Field(description="Agent name")
    status: str = Field(description="Status (healthy|unhealthy|unknown|error)")
    last_response: Optional[str] = Field(default=None, description="Last response timestamp")
    minutes_ago: Optional[int] = Field(default=None, description="Minutes since last response")


class AgentResponse(BaseModel):
    """Agents list response model per PLAN.md section 8.2."""
    agents: list[Agent] = Field(description="List of agents")
    timestamp: str = Field(description="Response timestamp")


class LogEntry(BaseModel):
    """Individual log entry per PLAN.md section 8.2."""
    filename: str = Field(description="Log filename")
    path: str = Field(description="Full file path")
    timestamp: str = Field(description="File modification timestamp")
    content: dict = Field(description="Log content as parsed JSON")


class LogResponse(BaseModel):
    """Logs list response model per PLAN.md section 8.2."""
    logs: list[LogEntry] = Field(description="List of log entries")
    count: int = Field(description="Total log count")
    timestamp: str = Field(description="Response timestamp")


class ConfigResponse(BaseModel):
    """System configuration response model."""
    projects_path: str = Field(description="Projects directory path")
    logs_path: str = Field(description="Logs directory path")
    timeout_minutes: int = Field(description="Agent timeout threshold in minutes")
    services: list[str] = Field(description="Services being monitored")
    agents: list[str] = Field(description="Agents being tracked")


# ============== Helper Functions ==============


def get_timestamp() -> str:
    """Get current UTC timestamp in ISO8601 format."""
    return datetime.now(timezone.utc).isoformat()


def parse_systemctl_show(service_name: str) -> dict:
    """Parse systemctl show output for a service."""
    result = {
        "status": "inactive",
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
                elif state == "failed":
                    result["status"] = "failed"
                else:
                    result["status"] = state
            elif line.startswith("ExecMainStatus="):
                try:
                    result["exit_code"] = int(line.split("=", 1)[1])
                except ValueError:
                    pass
    except subprocess.TimeoutExpired:
        result["status"] = "timeout"
    except Exception as e:
        result["status"] = "error"
        result["recent_logs"] = [str(e)]

    # Get recent logs from journalctl
    try:
        proc = subprocess.run(
            ["journalctl", "--since", "1 hour ago", "-u", service_name, "--no-pager", "-n", "5"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if proc.stdout:
            lines = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
            result["recent_logs"] = lines[:5]
    except subprocess.TimeoutExpired:
        result["recent_logs"] = ["timeout"]
    except Exception as e:
        result["recent_logs"].append(str(e))

    return result


def scan_projects(projects_path: str) -> list[Project]:
    """Scan PROJECTS_PATH for .dev_status.json files."""
    projects = []
    path = Path(projects_path)

    if not path.exists():
        return projects

    for entry in path.iterdir():
        if not entry.is_dir():
            continue
        dev_status_file = entry / "docs" / ".dev_status.json"
        if not dev_status_file.exists():
            continue
        try:
            with open(dev_status_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            projects.append(Project(
                name=entry.name,
                path=str(entry),
                stage=data.get("stage", "dev"),
                iteration=data.get("iteration", 0),
                quality_score=data.get("quality_score", 0),
                blocking_errors=data.get("blocking_errors", []),
                updated_at=data.get("updated_at", "")
            ))
        except Exception:
            continue

    return projects


def get_agent_health(telegram_token: str, timeout_minutes: int) -> list[Agent]:
    """Get agent health by polling Telegram Bot API getUpdates."""
    agents_data = []
    now = datetime.now(timezone.utc)

    if not telegram_token:
        for name in DEFAULT_AGENTS:
            agents_data.append(Agent(
                name=name,
                status="unknown",
                last_response=None,
                minutes_ago=None
            ))
        return agents_data

    try:
        response = requests.get(
            f"https://api.telegram.org/bot{telegram_token}/getUpdates",
            params={"limit": 100},
            timeout=10
        )
        response.raise_for_status()
        updates = response.json().get("result", [])

        # Track last update time per agent name
        agent_last_times = {name: None for name in DEFAULT_AGENTS}

        for update in updates:
            msg = update.get("message", {})
            text = msg.get("text", "")
            # Check if any agent name appears in the message
            for name in DEFAULT_AGENTS:
                if name.lower() in text.lower():
                    ts = msg.get("date")
                    if ts:
                        msg_time = datetime.fromtimestamp(ts, tz=timezone.utc)
                        if agent_last_times[name] is None or msg_time > agent_last_times[name]:
                            agent_last_times[name] = msg_time

        for name in DEFAULT_AGENTS:
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
                status = "healthy" if minutes_ago < timeout_minutes else "unhealthy"
                agents_data.append(Agent(
                    name=name,
                    status=status,
                    last_response=last_time.isoformat(),
                    minutes_ago=minutes_ago
                ))

    except Exception:
        for name in DEFAULT_AGENTS:
            agents_data.append(Agent(
                name=name,
                status="error",
                last_response=None,
                minutes_ago=None
            ))

    return agents_data


def read_logs(logs_path: str, limit: int = 20) -> list[LogEntry]:
    """Read log files from LOGS_PATH, sorted by mtime descending."""
    logs = []
    path = Path(logs_path)

    if not path.exists():
        return logs

    json_files = list(path.glob("*.json"))
    json_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

    for file in json_files[:limit]:
        try:
            with open(file, "r", encoding="utf-8") as f:
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


@app.get("/api/health", response_model=HealthResponse)
async def get_health():
    """Health check endpoint per PLAN.md section 8.1."""
    uptime_seconds = time.time() - APP_START_TIME
    return HealthResponse(
        status="healthy",
        uptime_seconds=round(uptime_seconds, 2),
        version=VERSION
    )


@app.get("/api/projects", response_model=ProjectResponse)
async def get_projects():
    """Get all project statuses per PLAN.md section 8.1."""
    projects = scan_projects(PROJECTS_PATH)
    return ProjectResponse(
        projects=projects,
        timestamp=get_timestamp()
    )


@app.get("/api/cronjobs", response_model=CronJobResponse)
async def get_cronjobs():
    """Get cronjob statuses using systemctl and journalctl per PLAN.md section 8.1."""
    cronjobs = []

    for service in DEFAULT_SERVICES:
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
        timestamp=get_timestamp()
    )


@app.get("/api/agents", response_model=AgentResponse)
async def get_agents():
    """Get agent health by polling Telegram Bot API per PLAN.md section 8.1."""
    agents = get_agent_health(TELEGRAM_BOT_TOKEN, TIMEOUT_MINUTES)
    return AgentResponse(
        agents=agents,
        timestamp=get_timestamp()
    )


@app.get("/api/logs", response_model=LogResponse)
async def get_logs(limit: int = 20):
    """Get execution logs from LOGS_PATH per PLAN.md section 8.1."""
    logs = read_logs(LOGS_PATH, limit)
    return LogResponse(
        logs=logs,
        count=len(logs),
        timestamp=get_timestamp()
    )


@app.get("/api/config", response_model=ConfigResponse)
async def get_config():
    """Get system configuration per PLAN.md section 8.1."""
    return ConfigResponse(
        projects_path=PROJECTS_PATH,
        logs_path=LOGS_PATH,
        timeout_minutes=TIMEOUT_MINUTES,
        services=DEFAULT_SERVICES,
        agents=DEFAULT_AGENTS
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)