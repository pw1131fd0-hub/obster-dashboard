"""
Pytest tests for Obster Dashboard API endpoints.
"""

import os
import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

# Set environment variables before importing app
os.environ["PROJECTS_PATH"] = "/tmp/test_projects"
os.environ["LOGS_PATH"] = "/tmp/test_logs"
os.environ["TELEGRAM_BOT_TOKEN"] = "test_token_123"
os.environ["TIMEOUT_MINUTES"] = "30"


class TestHealthEndpoint:
    """Tests for GET /api/health endpoint."""

    def test_health_returns_uptime(self):
        """Test health endpoint returns status, uptime_seconds, and version."""
        with patch("main.APP_START_TIME", time.time() - 10):
            from main import app
            client = TestClient(app)
            response = client.get("/api/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "uptime_seconds" in data
            assert data["version"] == "1.0.0"
            assert isinstance(data["uptime_seconds"], float)


class TestProjectsEndpoint:
    """Tests for GET /api/projects endpoint."""

    def test_projects_returns_list_or_empty(self):
        """Test projects endpoint returns list or empty when no projects exist."""
        with patch("main.scan_projects") as mock_scan:
            mock_scan.return_value = []
            from main import app
            client = TestClient(app)
            response = client.get("/api/projects")

            assert response.status_code == 200
            data = response.json()
            assert "projects" in data
            assert "timestamp" in data
            assert isinstance(data["projects"], list)


class TestCronjobsEndpoint:
    """Tests for GET /api/cronjobs endpoint."""

    def test_cronjobs_returns_service_status(self):
        """Test cronjobs endpoint returns service statuses."""
        from main import CronJobServiceStatus, app
        client = TestClient(app)
        response = client.get("/api/cronjobs")

        assert response.status_code == 200
        data = response.json()
        assert "cronjobs" in data
        assert "timestamp" in data
        assert len(data["cronjobs"]) == 3


class TestAgentsEndpoint:
    """Tests for GET /api/agents endpoint."""

    def test_agents_returns_known_agents(self):
        """Test agents endpoint returns known agents list."""
        with patch("main.poll_telegram_updates") as mock_poll:
            mock_poll.return_value = {"updates": []}
            from main import app
            client = TestClient(app)
            response = client.get("/api/agents")

            assert response.status_code == 200
            data = response.json()
            assert "agents" in data
            assert "timestamp" in data
            assert len(data["agents"]) == 6
            agent_names = [a["name"] for a in data["agents"]]
            assert "Argus" in agent_names
            assert "Hephaestus" in agent_names
            assert "Atlas" in agent_names
            assert "Hestia" in agent_names
            assert "Hermes" in agent_names
            assert "Main" in agent_names


class TestLogsEndpoint:
    """Tests for GET /api/logs endpoint."""

    def test_logs_returns_recent_files(self):
        """Test logs endpoint returns recent files sorted by mtime."""
        from main import LogFile, app
        client = TestClient(app)
        response = client.get("/api/logs")

        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert "count" in data
        assert "timestamp" in data


class TestConfigEndpoint:
    """Tests for GET /api/config endpoint."""

    def test_config_returns_settings(self):
        """Test config endpoint returns environment settings."""
        from main import app
        client = TestClient(app)
        response = client.get("/api/config")

        assert response.status_code == 200
        data = response.json()
        assert "PROJECTS_PATH" in data
        assert "LOGS_PATH" in data
        assert "TELEGRAM_BOT_TOKEN" in data
        assert "TIMEOUT_MINUTES" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
