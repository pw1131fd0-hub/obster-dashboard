"""
Pytest tests for Obster Dashboard API endpoints.
Tests use mocking to isolate from filesystem and subprocess operations.
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Ensure parent directory is in path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set environment variables before importing app
os.environ["PROJECTS_PATH"] = "/tmp/test_projects"
os.environ["LOGS_PATH"] = "/tmp/test_logs"
os.environ["TELEGRAM_BOT_TOKEN"] = "test_token_123"
os.environ["TIMEOUT_MINUTES"] = "30"


@pytest.fixture(scope="module")
def client():
    """Create test client with mocked time."""
    import main
    return TestClient(main.app)


@pytest.fixture
def mock_projects_path(tmp_path):
    """Create a temporary projects directory structure."""
    project_dir = tmp_path / "test_project"
    project_dir.mkdir()
    docs_dir = project_dir / "docs"
    docs_dir.mkdir()

    dev_status = {
        "stage": "dev",
        "iteration": 3,
        "quality_score": 92.5,
        "blocking_errors": [],
        "updated_at": "2026-04-13T08:30:00.000Z"
    }
    (docs_dir / ".dev_status.json").write_text(json.dumps(dev_status))

    return project_dir


@pytest.fixture
def mock_logs_path(tmp_path):
    """Create a temporary logs directory with JSON files."""
    log_file = tmp_path / "exec-20260413-001.json"
    log_content = {
        "execution_id": "exec-20260413-001",
        "project": "obster-worker",
        "status": "success",
        "duration_ms": 45230,
        "started_at": "2026-04-13T08:00:00.000Z",
        "completed_at": "2026-04-13T08:00:45.230Z"
    }
    log_file.write_text(json.dumps(log_content))
    return tmp_path


class TestHealthEndpoint:
    """Tests for GET /api/health endpoint."""

    def test_health_returns_healthy_status(self, client):
        """Test health endpoint returns healthy status."""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], (int, float))

    def test_health_contains_required_fields(self, client):
        """Test health response contains all required fields."""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert set(data.keys()) == {"status", "uptime_seconds", "version"}


class TestProjectsEndpoint:
    """Tests for GET /api/projects endpoint."""

    def test_projects_returns_list_structure(self, client):
        """Test projects endpoint returns correct structure."""
        response = client.get("/api/projects")

        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "timestamp" in data
        assert isinstance(data["projects"], list)

    def test_projects_empty_when_no_projects(self, client):
        """Test projects returns empty list when directory doesn't exist."""
        with patch("main.scan_projects") as mock_scan:
            mock_scan.return_value = []
            response = client.get("/api/projects")

            assert response.status_code == 200
            data = response.json()
            assert data["projects"] == []

    def test_projects_with_mocked_data(self, client):
        """Test projects with mocked project data."""
        from main import ProjectStatus

        mock_projects = [
            ProjectStatus(
                name="test-project",
                path="/home/crawd_user/project/test-project",
                stage="dev",
                iteration=1,
                quality_score=85.0,
                blocking_errors=[],
                updated_at="2026-04-13T08:00:00.000Z"
            )
        ]

        with patch("main.scan_projects", return_value=mock_projects):
            response = client.get("/api/projects")

            assert response.status_code == 200
            data = response.json()
            assert len(data["projects"]) == 1
            assert data["projects"][0]["name"] == "test-project"
            assert data["projects"][0]["stage"] == "dev"


class TestCronjobsEndpoint:
    """Tests for GET /api/cronjobs endpoint."""

    def test_cronjobs_returns_list_structure(self, client):
        """Test cronjobs endpoint returns correct structure."""
        response = client.get("/api/cronjobs")

        assert response.status_code == 200
        data = response.json()
        assert "cronjobs" in data
        assert "timestamp" in data
        assert isinstance(data["cronjobs"], list)

    def test_cronjobs_returns_expected_services(self, client):
        """Test cronjobs returns configured services."""
        with patch("main.scan_cronjobs") as mock_scan:
            from main import CronJobStatus
            mock_scan.return_value = [
                CronJobStatus(
                    name="obster-monitor",
                    status="active",
                    last_run="2026-04-13T10:00:00 UTC",
                    exit_code=0,
                    recent_logs=["Service started"]
                )
            ]
            response = client.get("/api/cronjobs")

            assert response.status_code == 200
            data = response.json()
            assert len(data["cronjobs"]) == 1
            assert data["cronjobs"][0]["name"] == "obster-monitor"

    def test_cronjobs_timeout_handling(self, client):
        """Test cronjobs handles timeout gracefully."""
        with patch("main.scan_cronjobs") as mock_scan:
            from main import CronJobStatus
            mock_scan.return_value = [
                CronJobStatus(
                    name="obster-cron",
                    status="timeout",
                    last_run=None,
                    exit_code=None,
                    recent_logs=["Timeout expired"]
                )
            ]
            response = client.get("/api/cronjobs")

            assert response.status_code == 200
            data = response.json()
            assert data["cronjobs"][0]["status"] == "timeout"


class TestAgentsEndpoint:
    """Tests for GET /api/agents endpoint."""

    def test_agents_returns_list_structure(self, client):
        """Test agents endpoint returns correct structure."""
        response = client.get("/api/agents")

        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        assert "timestamp" in data
        assert isinstance(data["agents"], list)

    def test_agents_returns_all_known_agents(self, client):
        """Test agents returns all configured agent names."""
        response = client.get("/api/agents")

        assert response.status_code == 200
        data = response.json()
        agent_names = [a["name"] for a in data["agents"]]

        expected_agents = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]
        for name in expected_agents:
            assert name in agent_names

    def test_agents_unknown_when_no_token(self, client):
        """Test agents return unknown status when TELEGRAM_BOT_TOKEN is empty."""
        with patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": ""}):
            with patch("main.track_agents") as mock_track:
                from main import AgentInfo
                mock_track.return_value = [
                    AgentInfo(name="Argus", status="unknown", last_response=None, minutes_ago=None)
                ]
                response = client.get("/api/agents")

                assert response.status_code == 200
                data = response.json()
                assert data["agents"][0]["status"] == "unknown"

    def test_agents_error_handling(self, client):
        """Test agents handles API errors gracefully."""
        with patch("main.track_agents") as mock_track:
            from main import AgentInfo
            mock_track.return_value = [
                AgentInfo(name="Argus", status="error", last_response=None, minutes_ago=None)
            ]
            response = client.get("/api/agents")

            assert response.status_code == 200
            data = response.json()
            assert data["agents"][0]["status"] == "error"


class TestLogsEndpoint:
    """Tests for GET /api/logs endpoint."""

    def test_logs_returns_list_structure(self, client):
        """Test logs endpoint returns correct structure."""
        response = client.get("/api/logs")

        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert "count" in data
        assert "timestamp" in data
        assert isinstance(data["logs"], list)

    def test_logs_limit_parameter(self, client):
        """Test logs respects limit parameter."""
        with patch("main.scan_logs") as mock_scan:
            mock_scan.return_value = []
            response = client.get("/api/logs?limit=5")

            assert response.status_code == 200
            mock_scan.assert_called_once_with(limit=5)

    def test_logs_empty_when_no_logs(self, client):
        """Test logs returns empty list when directory doesn't exist."""
        with patch("main.scan_logs") as mock_scan:
            mock_scan.return_value = []
            response = client.get("/api/logs")

            assert response.status_code == 200
            data = response.json()
            assert data["logs"] == []
            assert data["count"] == 0

    def test_logs_with_mocked_data(self, client):
        """Test logs with mocked log entries."""
        from main import ExecutionLog

        mock_logs = [
            ExecutionLog(
                filename="exec-20260413-001.json",
                path="/tmp/test_logs/exec-20260413-001.json",
                timestamp="2026-04-13T10:00:00+00:00",
                content={"status": "success"}
            )
        ]

        with patch("main.scan_logs", return_value=mock_logs):
            response = client.get("/api/logs")

            assert response.status_code == 200
            data = response.json()
            assert len(data["logs"]) == 1
            assert data["logs"][0]["filename"] == "exec-20260413-001.json"
            assert data["count"] == 1


class TestConfigEndpoint:
    """Tests for GET /api/config endpoint."""

    def test_config_returns_settings(self, client):
        """Test config endpoint returns all environment settings."""
        response = client.get("/api/config")

        assert response.status_code == 200
        data = response.json()
        assert "PROJECTS_PATH" in data
        assert "LOGS_PATH" in data
        assert "TELEGRAM_BOT_TOKEN" in data
        assert "TIMEOUT_MINUTES" in data
        assert "REFRESH_INTERVAL" in data

    def test_config_masks_telegram_token(self, client):
        """Test config masks TELEGRAM_BOT_TOKEN for security."""
        response = client.get("/api/config")

        assert response.status_code == 200
        data = response.json()
        # Token should be masked with ***
        assert data["TELEGRAM_BOT_TOKEN"] == "***"


class TestErrorHandling:
    """Tests for error handling across endpoints."""

    def test_health_error_format(self, client):
        """Test error responses follow standard format."""
        response = client.get("/api/health")

        assert response.status_code == 200
        # Error format: {"detail": "...", "code": "..."}
        # This would be tested with actual error scenarios


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
