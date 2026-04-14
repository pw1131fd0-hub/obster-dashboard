"""
Obster Dashboard Backend - FastAPI Application
Monitors OpenClaw distributed system: projects, cronjobs, agents, and execution logs.
"""

import json
import logging
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# Environment Variables
# =============================================================================
PROJECTS_PATH: str = os.getenv("PROJECTS_PATH", "/home/crawd_user/project")
LOGS_PATH: str = os.getenv("LOGS_PATH", "/home/crawd_user/.openclaw/workspace/logs/executions")
TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
TIMEOUT_MINUTES: int = int(os.getenv("TIMEOUT_MINUTES", "30"))
REFRESH_INTERVAL: int = int(os.getenv("REFRESH_INTERVAL", "30000"))

# Agent list
AGENTS: list[str] = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]

# Systemd services to monitor
SYSTEMD_SERVICES: list[str] = ["obster-monitor", "obster-cron", "openclaw-scheduler"]

# =============================================================================
# Pydantic Models
# =============================================================================


class ErrorResponse(BaseModel):
    """Standard error response format"""
    detail: str
    code: str


class HealthResponse(BaseModel):
    """Response model for /api/health"""
    status: str = "healthy"
    uptime_seconds: float
    version: str = "1.0.0"


class ProjectStatus(BaseModel):
    """Project status model from .dev_status.json"""
    name: str
    path: str
    stage: str = Field(..., pattern="^(prd|dev|test|security)$")
    iteration: int = Field(ge=0)
    quality_score: float = Field(ge=0, le=100)
    blocking_errors: list[str] = Field(default_factory=list)
    updated_at: str

    @field_validator("stage", mode="before")
    @classmethod
    def normalize_stage(cls, v: Any) -> str:
        if isinstance(v, str):
            stage_map = {"production": "prd", "prod": "prd", "development": "dev"}
            return stage_map.get(v.lower(), v.lower())
        return str(v)


class ProjectResponse(BaseModel):
    """Response model for /api/projects"""
    projects: list[ProjectStatus]
    timestamp: str


class CronJobStatus(BaseModel):
    """CronJob status model from systemd"""
    name: str
    status: str = Field(..., pattern="^(active|inactive|failed|error|timeout|unknown)$")
    last_run: Optional[str] = None
    exit_code: Optional[int] = None
    recent_logs: list[str] = Field(default_factory=list)


class CronJobResponse(BaseModel):
    """Response model for /api/cronjobs"""
    cronjobs: list[CronJobStatus]
    timestamp: str


class AgentInfo(BaseModel):
    """Agent health status model"""
    name: str
    status: str = Field(..., pattern="^(healthy|unhealthy|unknown|error)$")
    last_response: Optional[str] = None
    minutes_ago: Optional[float] = None


class AgentResponse(BaseModel):
    """Response model for /api/agents"""
    agents: list[AgentInfo]
    timestamp: str


class ExecutionLog(BaseModel):
    """Execution log entry model"""
    filename: str
    path: str
    timestamp: str
    content: Optional[dict[str, Any]] = None


class LogResponse(BaseModel):
    """Response model for /api/logs"""
    logs: list[ExecutionLog]
    count: int
    timestamp: str


class ConfigResponse(BaseModel):
    """Response model for /api/config"""
    PROJECTS_PATH: str
    LOGS_PATH: str
    TELEGRAM_BOT_TOKEN: str
    TIMEOUT_MINUTES: int
    REFRESH_INTERVAL: int


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="Obster Dashboard API",
    description="Backend API for monitoring OpenClaw distributed system",
    version="1.0.0",
)

# Track startup time for uptime calculation
APP_START_TIME = time.time()


# =============================================================================
# Helper Functions
# =============================================================================

def get_timestamp() -> str:
    """Get current UTC timestamp in ISO8601 format"""
    return datetime.now(timezone.utc).isoformat()


def get_uptime_seconds() -> float:
    """Calculate uptime in seconds"""
    delta = datetime.now(timezone.utc).timestamp() - APP_START_TIME
    return round(delta, 2)


# =============================================================================
# Project Scanner Subsystem
# =============================================================================

def scan_projects() -> list[ProjectStatus]:
    """
    Scan {PROJECTS_PATH}/*/docs/.dev_status.json for project status.
    Returns list of ProjectStatus objects.
    """
    projects: list[ProjectStatus] = []
    projects_path = Path(PROJECTS_PATH)

    if not projects_path.exists():
        logger.warning(f"Projects path does not exist: {PROJECTS_PATH}")
        return projects

    try:
        for subdir in projects_path.iterdir():
            if not subdir.is_dir():
                continue

            dev_status_file = subdir / "docs" / ".dev_status.json"
            if not dev_status_file.exists():
                continue

            try:
                with open(dev_status_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                project = ProjectStatus(
                    name=subdir.name,
                    path=str(subdir),
                    stage=data.get("stage", "dev"),
                    iteration=data.get("iteration", 0),
                    quality_score=data.get("quality_score", 0.0),
                    blocking_errors=data.get("blocking_errors", []),
                    updated_at=data.get("updated_at", get_timestamp()),
                )
                projects.append(project)
                logger.info(f"Scanned project: {project.name}")

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse {dev_status_file}: {e}")
            except Exception as e:
                logger.error(f"Failed to read {dev_status_file}: {e}")

    except PermissionError as e:
        logger.error(f"Permission denied accessing {projects_path}: {e}")
    except Exception as e:
        logger.error(f"Error scanning projects: {e}")

    return projects


# =============================================================================
# Systemd Reader Subsystem
# =============================================================================

def get_systemctl_show(service_name: str) -> dict[str, str]:
    """
    Run systemctl show for a service and parse key=value pairs.
    Returns dict with ActiveState, ExecMainStatus, etc.
    """
    try:
        result = subprocess.run(
            ["systemctl", "show", service_name],
            capture_output=True,
            text=True,
            timeout=5,
        )

        data: dict[str, str] = {}
        for line in result.stdout.splitlines():
            if "=" in line:
                key, value = line.split("=", 1)
                data[key] = value

        return data
    except subprocess.TimeoutExpired:
        logger.error(f"systemctl show timed out for {service_name}")
        raise
    except FileNotFoundError:
        logger.error("systemctl not found - not running on systemd?")
        raise
    except Exception as e:
        logger.error(f"Error running systemctl show for {service_name}: {e}")
        raise


def get_journalctl_logs(service_name: str, limit: int = 5) -> list[str]:
    """
    Run journalctl to get recent logs for a service.
    Returns list of log lines.
    """
    try:
        result = subprocess.run(
            ["journalctl", "--since", "1 hour ago", "-u", service_name, "--no-pager", "-n", str(limit)],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return result.stdout.splitlines() if result.stdout else []
    except subprocess.TimeoutExpired:
        logger.error(f"journalctl timed out for {service_name}")
        return []
    except FileNotFoundError:
        logger.error("journalctl not found")
        return []
    except Exception as e:
        logger.error(f"Error running journalctl for {service_name}: {e}")
        return []


def get_cronjob_status(service_name: str) -> CronJobStatus:
    """
    Get status for a single systemd service.
    """
    try:
        data = get_systemctl_show(service_name)
        active_state = data.get("ActiveState", "unknown")
        exec_main_status = data.get("ExecMainStatus", "")

        # Parse last state change
        inactive_exit_time = data.get("InactiveExitTimestamp", "")
        if not inactive_exit_time:
            inactive_exit_time = data.get("InactiveExitTimestampMonotonic", "")

        exit_code = int(exec_main_status) if exec_main_status.isdigit() else None

        # Map ActiveState to our status
        status_map = {
            "active": "active",
            "inactive": "inactive",
            "failed": "failed",
            "activating": "active",
            "deactivating": "inactive",
        }
        status = status_map.get(active_state.lower(), "unknown")

        recent_logs = get_journalctl_logs(service_name, limit=5)

        return CronJobStatus(
            name=service_name,
            status=status,
            last_run=inactive_exit_time if inactive_exit_time else None,
            exit_code=exit_code,
            recent_logs=recent_logs,
        )

    except subprocess.TimeoutExpired:
        return CronJobStatus(
            name=service_name,
            status="timeout",
            last_run=None,
            exit_code=None,
            recent_logs=[f"Timeout expired while querying {service_name}"],
        )
    except FileNotFoundError:
        return CronJobStatus(
            name=service_name,
            status="error",
            last_run=None,
            exit_code=None,
            recent_logs=["systemctl/journalctl not available"],
        )
    except Exception as e:
        return CronJobStatus(
            name=service_name,
            status="error",
            last_run=None,
            exit_code=None,
            recent_logs=[str(e)],
        )


def scan_cronjobs() -> list[CronJobStatus]:
    """
    Scan all configured systemd services for status.
    """
    cronjobs: list[CronJobStatus] = []
    for service in SYSTEMD_SERVICES:
        cronjob = get_cronjob_status(service)
        cronjobs.append(cronjob)
    return cronjobs


# =============================================================================
# Telegram Agent Tracker Subsystem
# =============================================================================

def poll_telegram_updates() -> dict[str, Any]:
    """
    Fetch updates from Telegram Bot API.
    Returns parsed JSON response.
    """
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("Telegram bot token not configured")

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
    params = {"limit": 100, "timeout": 1}

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()

    return response.json()


def get_agent_status(agent_name: str, updates: list[dict[str, Any]]) -> AgentInfo:
    """
    Get status for a single agent based on Telegram updates.
    """
    now = datetime.now(timezone.utc)

    for update in updates:
        try:
            message = update.get("message", {})
            chat = message.get("chat", {})
            username = chat.get("username", "")

            if username == agent_name:
                date_str = message.get("date")
                if date_str:
                    try:
                        last_response = datetime.fromtimestamp(date_str, tz=timezone.utc)
                        minutes_ago = (now - last_response).total_seconds() / 60.0

                        if minutes_ago >= TIMEOUT_MINUTES:
                            agent_status = "unhealthy"
                        else:
                            agent_status = "healthy"

                        return AgentInfo(
                            name=agent_name,
                            status=agent_status,
                            last_response=last_response.isoformat(),
                            minutes_ago=round(minutes_ago, 1),
                        )
                    except (ValueError, OSError) as e:
                        logger.error(f"Error parsing date for agent {agent_name}: {e}")
        except Exception as e:
            logger.error(f"Error processing update for agent {agent_name}: {e}")
            continue

    return AgentInfo(
        name=agent_name,
        status="unknown",
        last_response=None,
        minutes_ago=None,
    )


def track_agents() -> list[AgentInfo]:
    """
    Track agent health via Telegram Bot API getUpdates.
    Returns list of AgentInfo objects with health status.
    """
    agents: list[AgentInfo] = []

    if not TELEGRAM_BOT_TOKEN:
        # Return all agents as unknown if no token configured
        logger.warning("TELEGRAM_BOT_TOKEN not set, returning unknown for all agents")
        for name in AGENTS:
            agents.append(AgentInfo(
                name=name,
                status="unknown",
                last_response=None,
                minutes_ago=None,
            ))
        return agents

    try:
        data = poll_telegram_updates()
        updates = data.get("result", [])

        for agent_name in AGENTS:
            agent = get_agent_status(agent_name, updates)
            agents.append(agent)

    except requests.RequestException as e:
        logger.error(f"Telegram API request failed: {e}")
        for name in AGENTS:
            agents.append(AgentInfo(
                name=name,
                status="error",
                last_response=None,
                minutes_ago=None,
            ))
    except Exception as e:
        logger.error(f"Error tracking agents: {e}")
        for name in AGENTS:
            agents.append(AgentInfo(
                name=name,
                status="error",
                last_response=None,
                minutes_ago=None,
            ))

    return agents


# =============================================================================
# Execution Log Collector Subsystem
# =============================================================================

def scan_logs(limit: int = 20) -> list[ExecutionLog]:
    """
    Read JSON files from {LOGS_PATH}, sort by mtime, return latest 'limit' entries.
    """
    logs: list[ExecutionLog] = []
    logs_path = Path(LOGS_PATH)

    if not logs_path.exists():
        logger.warning(f"Logs path does not exist: {LOGS_PATH}")
        return logs

    try:
        json_files = list(logs_path.glob("*.json"))

        # Sort by modification time (newest first)
        json_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

        # Take the latest 'limit' files
        for file_path in json_files[:limit]:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = json.load(f)

                # Get modification time
                mtime = file_path.stat().st_mtime
                timestamp = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()

                logs.append(ExecutionLog(
                    filename=file_path.name,
                    path=str(file_path),
                    timestamp=timestamp,
                    content=content,
                ))
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse log file {file_path}: {e}")
            except Exception as e:
                logger.error(f"Failed to read log file {file_path}: {e}")

    except PermissionError as e:
        logger.error(f"Permission denied accessing {logs_path}: {e}")
    except Exception as e:
        logger.error(f"Error collecting execution logs: {e}")

    return logs


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/api/health", response_model=HealthResponse)
def get_health():
    """
    Health check endpoint.
    Returns status, uptime in seconds, and version.
    """
    return HealthResponse(
        status="healthy",
        uptime_seconds=get_uptime_seconds(),
        version="1.0.0",
    )


@app.get("/api/projects", response_model=ProjectResponse)
def get_projects():
    """
    Get all project statuses by scanning {PROJECTS_PATH}/*/docs/.dev_status.json.
    """
    projects = scan_projects()
    return ProjectResponse(
        projects=projects,
        timestamp=get_timestamp(),
    )


@app.get("/api/cronjobs", response_model=CronJobResponse)
def get_cronjobs():
    """
    Get cronjob/systemd service status for configured services.
    """
    cronjobs = scan_cronjobs()
    return CronJobResponse(
        cronjobs=cronjobs,
        timestamp=get_timestamp(),
    )


@app.get("/api/agents", response_model=AgentResponse)
def get_agents():
    """
    Get agent health status by querying Telegram Bot API.
    """
    agents = track_agents()
    return AgentResponse(
        agents=agents,
        timestamp=get_timestamp(),
    )


@app.get("/api/logs", response_model=LogResponse)
def get_logs(limit: int = 20):
    """
    Get execution logs from {LOGS_PATH}, sorted by modification time.
    """
    if limit < 1:
        limit = 1
    if limit > 100:
        limit = 100

    logs = scan_logs(limit=limit)
    return LogResponse(
        logs=logs,
        count=len(logs),
        timestamp=get_timestamp(),
    )


@app.get("/api/config", response_model=ConfigResponse)
def get_config():
    """
    Get system configuration (environment variables).
    Note: TELEGRAM_BOT_TOKEN is masked in output for security.
    """
    return ConfigResponse(
        PROJECTS_PATH=PROJECTS_PATH,
        LOGS_PATH=LOGS_PATH,
        TELEGRAM_BOT_TOKEN="***" if TELEGRAM_BOT_TOKEN else "",
        TIMEOUT_MINUTES=TIMEOUT_MINUTES,
        REFRESH_INTERVAL=REFRESH_INTERVAL,
    )


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": getattr(exc, "code", f"HTTP_{exc.status_code}")},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "code": "INTERNAL_ERROR"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
