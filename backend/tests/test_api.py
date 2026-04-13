"""
Pytest tests for Obster Dashboard API endpoints.
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Import the app and models directly from main module
# We need to set environment variables before importing
os.environ["PROJECTS_PATH"] = "/tmp/test_projects"
os.environ["LOGS_PATH"] = "/tmp/test_logs"
os.environ["TELEGRAM_BOT_TOKEN"] = "test_token_123"
os.environ["TIMEOUT_MINUTES"] = "30"


class TestHealthEndpoint:
    """Tests for GET /api/health endpoint."""

    def test_health_returns_status(self):
        """Test health endpoint returns status, uptime_seconds, and version."""
        with patch("main.APP_START_TIME", time.time()):
            from main import app

            client = TestClient(app)
            response = client.get("/api/health")

            assert response.status_code == 200
            data = response.json()
            assert "status" in data
            assert "uptime_seconds" in data
            assert "version" in data
            assert data["status"] == "healthy"
            assert data["version"] == "1.0.0"
            assert isinstance(data["uptime_seconds"], float)


class TestProjectsEndpoint:
    """Tests for GET /api/projects endpoint."""

    def test_projects_returns_empty_when_no_projects(self):
        """Test projects endpoint returns empty list when no projects exist."""
        with patch("main.PROJECTS_PATH", "/tmp/nonexistent"):
            from main import app

            client = TestClient(app)
            response = client.get("/api/projects")

            assert response.status_code == 200
            data = response.json()
            assert "projects" in data
            assert "total" in data
            assert data["projects"] == []
            assert data["total"] == 0

    def test_projects_scans_directory(self):
        """Test projects endpoint scans for .dev_status.json files."""
        with patch("main.scan_projects") as mock_scan:
            mock_scan.return_value = [
                {
                    "name": "test-project",
                    "path": "/tmp/test_projects/test-project",
                    "last_updated": "2024-01-01T00:00:00",
                    "dev_status": {"status": "active"},
                }
            ]
            from main import app

            client = TestClient(app)
            response = client.get("/api/projects")

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert len(data["projects"]) == 1
            assert data["projects"][0]["name"] == "test-project"


class TestCronjobsEndpoint:
    """Tests for GET /api/cronjobs endpoint."""

    def test_cronjobs_returns_service_statuses(self):
        """Test cronjobs endpoint returns service information."""
        with patch("main.get_systemctl_show") as mock_show:
            mock_show.side_effect = lambda name: {
                "obster-monitor": {
                    "ActiveState": "active",
                    "SubState": "running",
                    "LoadState": "loaded",
                    "UnitFile": "enabled",
                },
                "obster-cron": {
                    "ActiveState": "active",
                    "SubState": "running",
                    "LoadState": "loaded",
                    "UnitFile": "enabled",
                },
                "openclaw-scheduler": {
                    "ActiveState": "inactive",
                    "SubState": "dead",
                    "LoadState": "loaded",
                    "UnitFile": "disabled",
                },
            }.get(name, {})

            from main import app

            client = TestClient(app)
            response = client.get("/api/cronjobs")

            assert response.status_code == 200
            data = response.json()
            assert "services" in data
            assert "total" in data
            assert data["total"] == 3
            assert len(data["services"]) == 3

    def test_cronjobs_handles_missing_service(self):
        """Test cronjobs handles systemctl failures gracefully."""
        with patch("main.get_systemctl_show") as mock_show:
            mock_show.return_value = {}

            from main import app

            client = TestClient(app)
            response = client.get("/api/cronjobs")

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 3


class TestAgentsEndpoint:
    """Tests for GET /api/agents endpoint."""

    def test_agents_returns_agent_statuses(self):
        """Test agents endpoint returns agent information."""
        with patch("main.poll_telegram_updates") as mock_poll:
            mock_poll.side_effect = lambda name, offset=0: {
                "Argus": {"update": {"message": {"chat": {"username": "Argus"}}}},
                "Hephaestus": {"update": {"message": {"chat": {"username": "Hephaestus"}}}},
                "Atlas": {"update_count": 0, "agent_name": "Atlas"},
                "Hestia": {"error": "Not found"},
                "Hermes": {"update": {"message": {"chat": {"username": "Hermes"}}}},
                "Main": {"update_count": 5, "agent_name": "Main"},
            }.get(name, {"error": "Unknown agent"})

            from main import app

            client = TestClient(app)
            response = client.get("/api/agents")

            assert response.status_code == 200
            data = response.json()
            assert "agents" in data
            assert "total" in data
            assert data["total"] == 6
            assert len(data["agents"]) == 6

    def test_agents_handles_no_token(self):
        """Test agents handles missing Telegram token gracefully."""
        with patch("main.TELEGRAM_BOT_TOKEN", ""):
            from main import app

            client = TestClient(app)
            response = client.get("/api/agents")

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 6
            # All agents should have error when no token
            for agent in data["agents"]:
                assert agent["active"] is False
                assert agent["error"] is not None


class TestLogsEndpoint:
    """Tests for GET /api/logs endpoint."""

    def test_logs_returns_empty_when_no_logs(self):
        """Test logs endpoint returns empty list when no logs exist."""
        with patch("main.scan_logs") as mock_scan:
            mock_scan.return_value = []

            from main import app

            client = TestClient(app)
            response = client.get("/api/logs")

            assert response.status_code == 200
            data = response.json()
            assert "logs" in data
            assert "total" in data
            assert data["logs"] == []
            assert data["total"] == 0

    def test_logs_respects_limit_parameter(self):
        """Test logs endpoint respects limit parameter."""
        with patch("main.scan_logs") as mock_scan:
            mock_scan.return_value = [
                {"filename": "log1.json", "path": "/tmp/log1.json", "mtime": time.time()}
            ]

            from main import app

            client = TestClient(app)
            response = client.get("/api/logs?limit=5")

            assert response.status_code == 200
            mock_scan.assert_called_once_with(limit=5)

    def test_logs_enforces_max_limit(self):
        """Test logs endpoint enforces maximum limit of 100."""
        with patch("main.scan_logs") as mock_scan:
            mock_scan.return_value = []

            from main import app

            client = TestClient(app)
            response = client.get("/api/logs?limit=500")

            assert response.status_code == 200
            # Should default to 20 when limit is out of range
            mock_scan.assert_called_once_with(limit=20)


class TestConfigEndpoint:
    """Tests for GET /api/config endpoint."""

    def test_config_returns_environment(self):
        """Test config endpoint returns environment variables."""
        from main import app

        client = TestClient(app)
        response = client.get("/api/config")

        assert response.status_code == 200
        data = response.json()
        assert "PROJECTS_PATH" in data
        assert "LOGS_PATH" in data
        assert "TELEGRAM_BOT_TOKEN" in data
        assert "TIMEOUT_MINUTES" in data
        assert data["PROJECTS_PATH"] == "/tmp/test_projects"
        assert data["LOGS_PATH"] == "/tmp/test_logs"
        assert data["TELEGRAM_BOT_TOKEN"] == "test_token_123"
        assert data["TIMEOUT_MINUTES"] == 30


class TestPydanticModels:
    """Tests for Pydantic model validation."""

    def test_health_response_model(self):
        """Test HealthResponse model validation."""
        from main import HealthResponse

        response = HealthResponse(status="ok", uptime_seconds=10.5, version="1.0.0")
        assert response.status == "ok"
        assert response.uptime_seconds == 10.5
        assert response.version == "1.0.0"

    def test_project_response_model(self):
        """Test ProjectResponse model validation."""
        from main import ProjectResponse, ProjectStatus

        project = ProjectStatus(
            name="test", path="/path/to/test", last_updated=None, dev_status=None
        )
        response = ProjectResponse(projects=[project], total=1)
        assert len(response.projects) == 1
        assert response.total == 1

    def test_cronjob_response_model(self):
        """Test CronJobResponse model validation."""
        from main import CronJobResponse, CronJobService

        service = CronJobService(
            name="test.service",
            active_state="active",
            sub_state="running",
            load_state="loaded",
        )
        response = CronJobResponse(services=[service], total=1)
        assert len(response.services) == 1
        assert response.services[0].name == "test.service"

    def test_agent_response_model(self):
        """Test AgentResponse model validation."""
        from main import AgentResponse, AgentStatus

        agent = AgentStatus(name="TestBot", active=True, last_update={"update_id": 1})
        response = AgentResponse(agents=[agent], total=1)
        assert len(response.agents) == 1
        assert response.agents[0].name == "TestBot"

    def test_log_response_model(self):
        """Test LogResponse model validation."""
        from main import LogResponse, LogEntry

        log = LogEntry(filename="test.json", path="/path/test.json", mtime=123456.0)
        response = LogResponse(logs=[log], total=1)
        assert len(response.logs) == 1
        assert response.logs[0].filename == "test.json"

    def test_config_response_model(self):
        """Test ConfigResponse model validation."""
        from main import ConfigResponse

        response = ConfigResponse(
            PROJECTS_PATH="/path",
            LOGS_PATH="/logs",
            TELEGRAM_BOT_TOKEN="token",
            TIMEOUT_MINUTES=30,
        )
        assert response.PROJECTS_PATH == "/path"
        assert response.TIMEOUT_MINUTES == 30


class TestHelperFunctions:
    """Tests for helper functions."""

    def test_get_systemctl_show_success(self):
        """Test get_systemctl_show returns parsed data on success."""
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout="ActiveState=active\nSubState=running\nLoadState=loaded\n",
            )

            from main import get_systemctl_show

            result = get_systemctl_show("test.service")
            assert result["ActiveState"] == "active"
            assert result["SubState"] == "running"
            assert result["LoadState"] == "loaded"
            mock_run.assert_called_once()

    def test_get_systemctl_show_failure(self):
        """Test get_systemctl_show returns empty dict on failure."""
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=1, stdout="")

            from main import get_systemctl_show

            result = get_systemctl_show("nonexistent.service")
            assert result == {}

    def test_poll_telegram_updates_no_token(self):
        """Test poll_telegram_updates returns error when no token."""
        with patch("main.TELEGRAM_BOT_TOKEN", ""):
            from main import poll_telegram_updates

            result = poll_telegram_updates("TestBot")
            assert "error" in result
            assert "not configured" in result["error"]

    def test_poll_telegram_updates_success(self):
        """Test poll_telegram_updates successfully polls API."""
        with patch("main.TELEGRAM_BOT_TOKEN", "test_token"):
            with patch("requests.get") as mock_get:
                mock_get.return_value = MagicMock(
                    status_code=200,
                    json=lambda: {"ok": True, "result": [{"update_id": 123}]},
                )

                from main import poll_telegram_updates

                result = poll_telegram_updates("TestBot")
                assert "update_count" in result or "update" in result
                mock_get.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
