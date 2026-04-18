"""
Obster Dashboard - Backend API
FastAPI application for system monitoring
"""

import os
import sys
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from functools import lru_cache

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Application metadata
APP_START_TIME = time.time()
VERSION = "1.0.0"

# Environment variables with defaults
PROJECTS_PATH = os.getenv("PROJECTS_PATH", "/home/crawd_user/project")
LOGS_PATH = os.getenv("LOGS_PATH", "/home/crawd_user/.openclaw/workspace/logs/executions")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TIMEOUT_MINUTES = int(os.getenv("TIMEOUT_MINUTES", "30"))

# Default agents list
DEFAULT_AGENTS = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]

# Systemd services to monitor
SYSTEMD_SERVICES = ["obster-monitor", "obster-cron", "openclaw-scheduler"]

# ============= Pydantic Models =============

class Project(BaseModel):
    """Individual project data"""
    name: str
    path: str
    stage: str
    iteration: int
    quality_score: float
    blocking_errors: List[str] = []
    updated_at: str

class ProjectResponse(BaseModel):
    """Response model for /api/projects"""
    projects: List[Project] = []
    timestamp: str

class CronJob(BaseModel):
    """Individual cron job data"""
    name: str
    status: str  # active | inactive | failed | error | timeout | unknown
    last_run: Optional[str] = None
    exit_code: Optional[int] = None
    recent_logs: List[str] = []

class CronJobResponse(BaseModel):
    """Response model for /api/cronjobs"""
    cronjobs: List[CronJob] = []
    timestamp: str

class Agent(BaseModel):
    """Individual agent data"""
    name: str
    status: str  # healthy | unhealthy | unknown | error
    last_response: Optional[str] = None
    minutes_ago: Optional[float] = None

class AgentResponse(BaseModel):
    """Response model for /api/agents"""
    agents: List[Agent] = []
    timestamp: str

class LogEntry(BaseModel):
    """Individual log entry data"""
    filename: str
    path: str
    timestamp: str
    content: Any

class LogResponse(BaseModel):
    """Response model for /api/logs"""
    logs: List[LogEntry] = []
    count: int = 0
    timestamp: str

class ConfigResponse(BaseModel):
    """Response model for /api/config"""
    projects_path: str
    logs_path: str
    timeout_minutes: int
    agents: List[str]
    timestamp: str

class HealthResponse(BaseModel):
    """Response model for /api/health"""
    status: str
    uptime_seconds: float
    version: str

class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str
    code: str

# ============= FastAPI Application =============

app = FastAPI(
    title="Obster Dashboard API",
    description="Backend API for OpenClaw system monitoring dashboard",
    version=VERSION
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= Helper Functions =============

def get_timestamp() -> str:
    """Get current ISO8601 timestamp"""
    return datetime.utcnow().isoformat() + "Z"

def parse_systemd_show(output: str) -> Dict[str, str]:
    """Parse systemctl show output into key-value pairs"""
    result = {}
    for line in output.strip().split('\n'):
        if '=' in line:
            key, value = line.split('=', 1)
            result[key] = value
    return result

def call_systemctl_show(service_name: str, timeout: int = 5) -> Optional[Dict[str, str]]:
    """Call systemctl show for a service"""
    import subprocess
    try:
        result = subprocess.run(
            ["systemctl", "show", service_name],
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return parse_systemd_show(result.stdout)
    except subprocess.TimeoutExpired:
        logger.warning(f"systemctl show timed out for {service_name}")
        return None
    except Exception as e:
        logger.error(f"Error calling systemctl show for {service_name}: {e}")
        return None

def call_journalctl(service_name: str, limit: int = 10, timeout: int = 5) -> List[str]:
    """Get recent logs from journalctl"""
    import subprocess
    try:
        result = subprocess.run(
            ["journalctl", "--since", "1 hour ago", "-u", service_name, "--no-pager", "-n", str(limit)],
            capture_output=True,
            text=True,
            timeout=timeout
        )
        lines = result.stdout.strip().split('\n') if result.stdout.strip() else []
        return lines[-limit:] if len(lines) > limit else lines
    except subprocess.TimeoutExpired:
        logger.warning(f"journalctl timed out for {service_name}")
        return []
    except Exception as e:
        logger.error(f"Error calling journalctl for {service_name}: {e}")
        return []

def get_telegram_updates(token: str, limit: int = 100) -> Optional[Dict]:
    """Fetch updates from Telegram Bot API"""
    if not token:
        return None
    try:
        url = f"https://api.telegram.org/bot{token}/getUpdates"
        response = requests.get(url, params={"limit": limit}, timeout=10)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error(f"Error fetching Telegram updates: {e}")
        return None

def scan_projects() -> List[Project]:
    """Scan PROJECTS_PATH for projects with .dev_status.json"""
    projects = []
    projects_path = Path(PROJECTS_PATH)
    
    if not projects_path.exists():
        logger.warning(f"Projects path does not exist: {PROJECTS_PATH}")
        return projects
    
    try:
        for entry in projects_path.iterdir():
            if entry.is_dir():
                dev_status_path = entry / "docs" / ".dev_status.json"
                if dev_status_path.exists():
                    try:
                        import json
                        with open(dev_status_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        
                        project = Project(
                            name=entry.name,
                            path=str(entry),
                            stage=data.get("stage", "unknown"),
                            iteration=data.get("iteration", 0),
                            quality_score=data.get("quality_score", 0.0),
                            blocking_errors=data.get("blocking_errors", []),
                            updated_at=data.get("updated_at", "")
                        )
                        projects.append(project)
                    except Exception as e:
                        logger.error(f"Error reading {dev_status_path}: {e}")
                        continue
    except Exception as e:
        logger.error(f"Error scanning projects directory: {e}")
    
    return projects

def scan_logs(limit: int = 20) -> List[LogEntry]:
    """Scan LOGS_PATH for JSON log files"""
    logs = []
    logs_path = Path(LOGS_PATH)
    
    if not logs_path.exists():
        logger.warning(f"Logs path does not exist: {LOGS_PATH}")
        return logs
    
    try:
        json_files = list(logs_path.glob("*.json"))
        # Sort by modification time descending
        json_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        for file_path in json_files[:limit]:
            try:
                import json
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                
                # Get modification time as timestamp
                mtime = file_path.stat().st_mtime
                timestamp = datetime.fromtimestamp(mtime).isoformat() + "Z"
                
                log_entry = LogEntry(
                    filename=file_path.name,
                    path=str(file_path),
                    timestamp=timestamp,
                    content=content
                )
                logs.append(log_entry)
            except Exception as e:
                logger.error(f"Error reading log file {file_path}: {e}")
                continue
    except Exception as e:
        logger.error(f"Error scanning logs directory: {e}")
    
    return logs

def get_agents_health() -> List[Agent]:
    """Get agent health status from Telegram bot updates"""
    agents_info = []
    
    if not TELEGRAM_BOT_TOKEN:
        # Return all agents as unknown if no token
        for agent_name in DEFAULT_AGENTS:
            agents_info.append(Agent(
                name=agent_name,
                status="unknown",
                last_response=None,
                minutes_ago=None
            ))
        return agents_info
    
    updates = get_telegram_updates(TELEGRAM_BOT_TOKEN)
    if not updates or updates.get("ok") != True:
        for agent_name in DEFAULT_AGENTS:
            agents_info.append(Agent(
                name=agent_name,
                status="error",
                last_response=None,
                minutes_ago=None
            ))
        return agents_info
    
    # Parse updates to find agent responses
    updates_data = updates.get("result", [])
    agent_last_times: Dict[str, datetime] = {name: datetime.min for name in DEFAULT_AGENTS}
    
    for update in updates_data:
        message = update.get("message", {})
        text = message.get("text", "")
        date_str = message.get("date")
        
        if not date_str or not text:
            continue
        
        # Check if any agent name is in the message
        for agent_name in DEFAULT_AGENTS:
            if agent_name.lower() in text.lower():
                try:
                    msg_time = datetime.fromtimestamp(date_str)
                    if msg_time > agent_last_times[agent_name]:
                        agent_last_times[agent_name] = msg_time
                except (ValueError, TypeError):
                    continue
    
    # Calculate status for each agent
    now = datetime.utcnow()
    for agent_name in DEFAULT_AGENTS:
        last_time = agent_last_times[agent_name]
        
        if last_time == datetime.min:
            status = "unknown"
            minutes_ago = None
            last_response = None
        else:
            delta = now - last_time
            minutes_ago = delta.total_seconds() / 60.0
            last_response = last_time.isoformat() + "Z"
            
            if minutes_ago >= TIMEOUT_MINUTES:
                status = "unhealthy"
            else:
                status = "healthy"
        
        agents_info.append(Agent(
            name=agent_name,
            status=status,
            last_response=last_response,
            minutes_ago=minutes_ago
        ))
    
    return agents_info

# ============= API Endpoints =============

@app.get("/api/health", response_model=HealthResponse, tags=["health"])
def get_health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        uptime_seconds=time.time() - APP_START_TIME,
        version=VERSION
    )

@app.get("/api/projects", response_model=ProjectResponse, tags=["projects"])
def get_projects():
    """Get all project statuses"""
    try:
        projects = scan_projects()
        return ProjectResponse(
            projects=projects,
            timestamp=get_timestamp()
        )
    except Exception as e:
        logger.error(f"Error in get_projects: {e}")
        raise HTTPException(status_code=500, detail=str(e), code="PROJECTS_ERROR")

@app.get("/api/cronjobs", response_model=CronJobResponse, tags=["cronjobs"])
def get_cronjobs(limit: int = Query(default=10, ge=1, le=100)):
    """Get Cron Job monitoring data"""
    try:
        cronjobs = []
        
        for service_name in SYSTEMD_SERVICES:
            # Get systemctl show data
            show_data = call_systemctl_show(service_name)
            
            if show_data is None:
                cronjob = CronJob(
                    name=service_name,
                    status="timeout",
                    last_run=None,
                    exit_code=None,
                    recent_logs=[]
                )
            else:
                active_state = show_data.get("ActiveState", "unknown")
                exec_main_status = show_data.get("ExecMainStatus", "")
                
                # Parse exit code
                exit_code = int(exec_main_status) if exec_main_status else None
                
                # Determine status
                if active_state == "active":
                    status = "active"
                elif active_state == "inactive":
                    status = "inactive"
                elif active_state == "failed":
                    status = "failed"
                else:
                    status = "error"
                
                # Get last run time from LoadState or similar
                last_run = show_data.get("ActiveEnterTimestamp", None)
                
                cronjob = CronJob(
                    name=service_name,
                    status=status,
                    last_run=last_run,
                    exit_code=exit_code,
                    recent_logs=[]
                )
            
            # Get recent logs
            cronjob.recent_logs = call_journalctl(service_name, limit)
            cronjobs.append(cronjob)
        
        return CronJobResponse(
            cronjobs=cronjobs,
            timestamp=get_timestamp()
        )
    except Exception as e:
        logger.error(f"Error in get_cronjobs: {e}")
        raise HTTPException(status_code=500, detail=str(e), code="CRONJOBS_ERROR")

@app.get("/api/agents", response_model=AgentResponse, tags=["agents"])
def get_agents():
    """Get Agent health status"""
    try:
        agents = get_agents_health()
        return AgentResponse(
            agents=agents,
            timestamp=get_timestamp()
        )
    except Exception as e:
        logger.error(f"Error in get_agents: {e}")
        raise HTTPException(status_code=500, detail=str(e), code="AGENTS_ERROR")

@app.get("/api/logs", response_model=LogResponse, tags=["logs"])
def get_logs(limit: int = Query(default=20, ge=1, le=100)):
    """Get execution logs"""
    try:
        logs = scan_logs(limit)
        return LogResponse(
            logs=logs,
            count=len(logs),
            timestamp=get_timestamp()
        )
    except Exception as e:
        logger.error(f"Error in get_logs: {e}")
        raise HTTPException(status_code=500, detail=str(e), code="LOGS_ERROR")

@app.get("/api/config", response_model=ConfigResponse, tags=["config"])
def get_config():
    """Get system configuration"""
    return ConfigResponse(
        projects_path=PROJECTS_PATH,
        logs_path=LOGS_PATH,
        timeout_minutes=TIMEOUT_MINUTES,
        agents=DEFAULT_AGENTS,
        timestamp=get_timestamp()
    )

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {"detail": exc.detail, "code": exc.code}

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {"detail": str(exc), "code": "INTERNAL_ERROR"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
