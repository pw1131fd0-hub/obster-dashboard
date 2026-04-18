"""
Obster Dashboard - Backend API Tests
Pytest test suite for all API endpoints
"""

import os
import sys
import json
import time
from datetime import datetime
from pathlib import Path
from unittest.mock import patch, MagicMock, mock_open

import pytest
from fastapi.testclient import TestClient

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app


# ============= Test Fixtures =============

@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture
def mock_projects_path(tmp_path):
    """Create a temporary projects directory with test data"""
    project1 = tmp_path / "project1"
    project1.mkdir()
    docs1 = project1 / "docs"
    docs1.mkdir()
    
    dev_status1 = {
        "stage": "dev",
        "iteration": 3,
        "quality_score": 92,
        "blocking_errors": [],
        "updated_at": "2026-04-13T08:30:00.000Z"
    }
    
    with open(docs1 / ".dev_status.json", "w") as f:
        json.dump(dev_status1, f)
    
    project2 = tmp_path / "project2"
    project2.mkdir()
    docs2 = project2 / "docs"
    docs2.mkdir()
    
    dev_status2 = {
        "stage": "prd",
        "iteration": 5,
        "quality_score": 88,
        "blocking_errors": ["Auth module failing"],
        "updated_at": "2026-04-12T10:00:00.000Z"
    }
    
    with open(docs2 / ".dev_status.json", "w") as f:
        json.dump(dev_status2, f)
    
    return tmp_path


@pytest.fixture
def mock_logs_path(tmp_path):
    """Create a temporary logs directory with test data"""
    logs_dir = tmp_path / "logs"
    logs_dir.mkdir()
    
    log_data = {
        "execution_id": "exec-20260413-001",
        "project": "obster-worker",
        "status": "success",
        "duration_ms": 45230
    }
    
    log_file = logs_dir / "execution_001.json"
    with open(log_file, "w") as f:
        json.dump(log_data, f)
    
    return logs_dir


# ============= Health Endpoint Tests =============

class TestHealthEndpoint:
    """Tests for GET /api/health"""
    
    def test_health_returns_healthy_status(self, client):
        """Test that health endpoint returns healthy status"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_health_returns_version(self, client):
        """Test that health endpoint returns version string"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert isinstance(data["version"], str)
    
    def test_health_returns_uptime(self, client):
        """Test that health endpoint returns uptime in seconds"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], float)
        assert data["uptime_seconds"] >= 0


# ============= Projects Endpoint Tests =============

class TestProjectsEndpoint:
    """Tests for GET /api/projects"""
    
    def test_projects_returns_empty_list_when_no_projects(self, client):
        """Test that projects endpoint returns empty list when path doesn't exist"""
        with patch.dict(os.environ, {"PROJECTS_PATH": "/nonexistent/path"}):
            with patch("main.Path.exists", return_value=False):
                response = client.get("/api/projects")
                assert response.status_code == 200
                data = response.json()
                assert "projects" in data
                assert isinstance(data["projects"], list)
    
    @patch("main.scan_projects")
    def test_projects_returns_project_list(self, mock_scan, client):
        """Test that projects endpoint returns list of projects"""
        mock_projects = [
            {
                "name": "test-project",
                "path": "/home/crawd_user/project/test-project",
                "stage": "dev",
                "iteration": 1,
                "quality_score": 90.0,
                "blocking_errors": [],
                "updated_at": "2026-04-13T08:30:00.000Z"
            }
        ]
        mock_scan.return_value = mock_projects
        
        response = client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert len(data["projects"]) == 1
        assert data["projects"][0]["name"] == "test-project"
    
    @patch("main.scan_projects")
    def test_projects_includes_timestamp(self, mock_scan, client):
        """Test that projects response includes timestamp"""
        mock_scan.return_value = []
        
        response = client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data


# ============= CronJobs Endpoint Tests =============

class TestCronJobsEndpoint:
    """Tests for GET /api/cronjobs"""
    
    def test_cronjobs_default_limit(self, client):
        """Test that cronjobs endpoint accepts default limit parameter"""
        with patch("main.call_systemctl_show", return_value=None):
            with patch("main.call_journalctl", return_value=[]):
                response = client.get("/api/cronjobs")
                assert response.status_code == 200
    
    @patch("main.call_systemctl_show")
    @patch("main.call_journalctl")
    def test_cronjobs_returns_service_data(self, mock_journal, mock_systemctl, client):
        """Test that cronjobs endpoint returns data for each service"""
        mock_systemctl.return_value = {
            "ActiveState": "active",
            "ExecMainStatus": "0"
        }
        mock_journal.return_value = ["Log line 1", "Log line 2"]
        
        response = client.get("/api/cronjobs")
        assert response.status_code == 200
        data = response.json()
        assert "cronjobs" in data
    
    @patch("main.call_systemctl_show")
    def test_cronjobs_handles_timeout(self, mock_systemctl, client):
        """Test that cronjobs handles systemctl timeout"""
        mock_systemctl.return_value = None
        
        with patch("main.call_journalctl", return_value=[]):
            response = client.get("/api/cronjobs")
            assert response.status_code == 200
            data = response.json()
            # Timeout should set status to "timeout"
            for job in data["cronjobs"]:
                assert job["name"] in ["obster-monitor", "obster-cron", "openclaw-scheduler"]


# ============= Agents Endpoint Tests =============

class TestAgentsEndpoint:
    """Tests for GET /api/agents"""
    
    @patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": ""})
    def test_agents_returns_unknown_when_no_token(self, client):
        """Test that agents returns unknown status when no token configured"""
        response = client.get("/api/agents")
        assert response.status_code == 200
        data = response.json()
        assert len(data["agents"]) == 6
        for agent in data["agents"]:
            assert agent["status"] == "unknown"
    
    @patch("main.get_telegram_updates")
    @patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": "test_token"})
    def test_agents_returns_error_when_api_fails(self, mock_get_updates, client):
        """Test that agents returns error status when Telegram API fails"""
        mock_get_updates.return_value = None
        
        response = client.get("/api/agents")
        assert response.status_code == 200
        data = response.json()
        for agent in data["agents"]:
            assert agent["status"] == "error"
    
    @patch("main.get_telegram_updates")
    @patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": "test_token"})
    def test_agents_parses_updates_for_agent_names(self, mock_get_updates, client):
        """Test that agents correctly parses Telegram updates for agent names"""
        mock_get_updates.return_value = {
            "ok": True,
            "result": [
                {
                    "update_id": 123456789,
                    "message": {
                        "message_id": 1,
                        "date": int(time.time()) - 60,  # 1 minute ago
                        "text": "Argus reporting status OK"
                    }
                }
            ]
        }
        
        response = client.get("/api/agents")
        assert response.status_code == 200
        data = response.json()
        
        # Find Argus agent
        argus = next((a for a in data["agents"] if a["name"] == "Argus"), None)
        assert argus is not None
        assert argus["status"] == "healthy"


# ============= Logs Endpoint Tests =============

class TestLogsEndpoint:
    """Tests for GET /api/logs"""
    
    @patch("main.scan_logs")
    def test_logs_returns_empty_when_no_logs(self, mock_scan_logs, client):
        """Test that logs endpoint returns empty list when no logs found"""
        mock_scan_logs.return_value = []
        
        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert data["logs"] == []
        assert data["count"] == 0
    
    @patch("main.scan_logs")
    def test_logs_returns_log_entries(self, mock_scan_logs, client):
        """Test that logs endpoint returns log entries with content"""
        mock_logs = [
            {
                "filename": "execution_001.json",
                "path": "/home/crawd_user/.openclaw/workspace/logs/executions/execution_001.json",
                "timestamp": "2026-04-13T08:00:00.000Z",
                "content": {"execution_id": "exec-001", "status": "success"}
            }
        ]
        mock_scan_logs.return_value = mock_logs
        
        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert data["logs"][0]["filename"] == "execution_001.json"
    
    def test_logs_accepts_limit_parameter(self, client):
        """Test that logs endpoint accepts limit query parameter"""
        with patch("main.scan_logs", return_value=[]):
            response = client.get("/api/logs?limit=5")
            assert response.status_code == 200
    
    @patch("main.scan_logs")
    def test_logs_includes_timestamp(self, mock_scan_logs, client):
        """Test that logs response includes timestamp"""
        mock_scan_logs.return_value = []
        
        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data


# ============= Config Endpoint Tests =============

class TestConfigEndpoint:
    """Tests for GET /api/config"""
    
    def test_config_returns_all_settings(self, client):
        """Test that config endpoint returns all configuration settings"""
        response = client.get("/api/config")
        assert response.status_code == 200
        data = response.json()
        assert "projects_path" in data
        assert "logs_path" in data
        assert "timeout_minutes" in data
        assert "agents" in data
    
    def test_config_returns_agent_list(self, client):
        """Test that config endpoint returns list of agents"""
        response = client.get("/api/config")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["agents"], list)
        assert len(data["agents"]) == 6
        assert "Argus" in data["agents"]


# ============= Error Handling Tests =============

class TestErrorHandling:
    """Tests for error handling behavior"""
    
    @patch("main.scan_projects")
    def test_projects_error_returns_500(self, mock_scan, client):
        """Test that projects endpoint returns 500 on internal error"""
        mock_scan.side_effect = Exception("Simulated error")
        
        response = client.get("/api/projects")
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "code" in data
    
    @patch("main.scan_logs")
    def test_logs_error_returns_500(self, mock_scan, client):
        """Test that logs endpoint returns 500 on internal error"""
        mock_scan.side_effect = Exception("Simulated error")
        
        response = client.get("/api/logs")
        assert response.status_code == 500


# ============= Test Entry Point =============

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
