"""
Pytest tests for Obster Dashboard API endpoints.
Total: 18 test cases as specified in PLAN.md section 12.2
- GET /api/health - 3 tests
- GET /api/projects - 3 tests
- GET /api/cronjobs - 3 tests
- GET /api/agents - 3 tests
- GET /api/logs - 4 tests
- GET /api/config - 2 tests
"""

import os
import sys
import time
from datetime import datetime
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import (
    app,
    AGENTS,
    CRONJOB_SERVICES,
    PROJECTS_PATH,
    LOGS_PATH,
)


# ============= Test Fixtures =============

@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


# ============= Health Endpoint Tests (3 tests) =============

class TestHealthEndpoint:
    """Tests for GET /api/health"""

    def test_health_returns_healthy_status(self, client):
        """Test that health endpoint returns status=healthy."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_health_returns_uptime_seconds(self, client):
        """Test that health endpoint returns uptime_seconds."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], (int, float))
        assert data["uptime_seconds"] >= 0

    def test_health_returns_version(self, client):
        """Test that health endpoint returns version string."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert isinstance(data["version"], str)
        assert len(data["version"]) > 0


# ============= Projects Endpoint Tests (3 tests) =============

class TestProjectsEndpoint:
    """Tests for GET /api/projects"""

    def test_projects_returns_projects_list(self, client):
        """Test that projects endpoint returns projects array."""
        with patch("main.Path") as mock_path:
            mock_projects_path = MagicMock()
            mock_projects_path.exists.return_value = False
            mock_path.return_value = mock_projects_path

            response = client.get("/api/projects")
            assert response.status_code == 200
            data = response.json()
            assert "projects" in data
            assert isinstance(data["projects"], list)

    def test_projects_returns_timestamp(self, client):
        """Test that projects endpoint returns timestamp."""
        response = client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data
        assert isinstance(data["timestamp"], str)

    @patch("main.Path")
    def test_projects_handles_missing_path(self, mock_path, client):
        """Test that projects endpoint handles missing path gracefully."""
        mock_projects_path = MagicMock()
        mock_projects_path.exists.return_value = False
        mock_path.return_value = mock_projects_path

        response = client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert data["projects"] == []


# ============= Cronjobs Endpoint Tests (3 tests) =============

class TestCronjobsEndpoint:
    """Tests for GET /api/cronjobs"""

    def test_cronjobs_returns_cronjobs_list(self, client):
        """Test that cronjobs endpoint returns cronjobs array."""
        response = client.get("/api/cronjobs")
        assert response.status_code == 200
        data = response.json()
        assert "cronjobs" in data
        assert isinstance(data["cronjobs"], list)

    def test_cronjobs_returns_timestamp(self, client):
        """Test that cronjobs endpoint returns timestamp."""
        response = client.get("/api/cronjobs")
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data
        assert isinstance(data["timestamp"], str)

    @patch("main.subprocess.run")
    def test_cronjobs_handles_service_error(self, mock_run, client):
        """Test that cronjobs endpoint handles subprocess errors gracefully."""
        mock_run.side_effect = Exception("subprocess error")

        response = client.get("/api/cronjobs")
        assert response.status_code == 200
        data = response.json()
        assert len(data["cronjobs"]) == len(CRONJOB_SERVICES)


# ============= Agents Endpoint Tests (3 tests) =============

class TestAgentsEndpoint:
    """Tests for GET /api/agents"""

    def test_agents_returns_agents_list(self, client):
        """Test that agents endpoint returns agents array."""
        with patch.dict("os.environ", {"TELEGRAM_BOT_TOKEN": ""}):
            response = client.get("/api/agents")
            assert response.status_code == 200
            data = response.json()
            assert "agents" in data
            assert isinstance(data["agents"], list)
            assert len(data["agents"]) == len(AGENTS)

    def test_agents_returns_timestamp(self, client):
        """Test that agents endpoint returns timestamp."""
        with patch.dict("os.environ", {"TELEGRAM_BOT_TOKEN": ""}):
            response = client.get("/api/agents")
            assert response.status_code == 200
            data = response.json()
            assert "timestamp" in data
            assert isinstance(data["timestamp"], str)

    def test_agents_with_no_token_returns_unknown(self, client):
        """Test that agents with no token returns unknown status."""
        with patch.dict("os.environ", {"TELEGRAM_BOT_TOKEN": ""}):
            response = client.get("/api/agents")
            assert response.status_code == 200
            data = response.json()
            for agent in data["agents"]:
                assert agent["status"] == "unknown"


# ============= Logs Endpoint Tests (4 tests) =============

class TestLogsEndpoint:
    """Tests for GET /api/logs"""

    def test_logs_returns_logs_list(self, client):
        """Test that logs endpoint returns logs array."""
        with patch("main.Path") as mock_path:
            mock_logs_path = MagicMock()
            mock_logs_path.exists.return_value = False
            mock_path.return_value = mock_logs_path

            response = client.get("/api/logs")
            assert response.status_code == 200
            data = response.json()
            assert "logs" in data
            assert isinstance(data["logs"], list)

    def test_logs_returns_count(self, client):
        """Test that logs endpoint returns count."""
        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)

    def test_logs_returns_timestamp(self, client):
        """Test that logs endpoint returns timestamp."""
        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data
        assert isinstance(data["timestamp"], str)

    @patch("main.Path")
    def test_logs_handles_missing_path(self, mock_path, client):
        """Test that logs endpoint handles missing path gracefully."""
        mock_logs_path = MagicMock()
        mock_logs_path.exists.return_value = False
        mock_path.return_value = mock_logs_path

        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert data["logs"] == []
        assert data["count"] == 0


# ============= Config Endpoint Tests (2 tests) =============

class TestConfigEndpoint:
    """Tests for GET /api/config"""

    def test_config_returns_all_fields(self, client):
        """Test that config endpoint returns all required fields."""
        response = client.get("/api/config")
        assert response.status_code == 200
        data = response.json()
        assert "PROJECTS_PATH" in data
        assert "LOGS_PATH" in data
        assert "TELEGRAM_BOT_TOKEN_SET" in data
        assert "TIMEOUT_MINUTES" in data
        assert "AGENTS" in data
        assert "CRONJOB_SERVICES" in data

    def test_config_token_not_exposed(self, client):
        """Test that config does not expose actual telegram token."""
        response = client.get("/api/config")
        assert response.status_code == 200
        data = response.json()
        # TELEGRAM_BOT_TOKEN_SET should be boolean, not the actual token
        assert isinstance(data["TELEGRAM_BOT_TOKEN_SET"], bool)


# ============= Integration Tests =============

class TestAPIIntegration:
    """Integration tests for API endpoints."""

    def test_all_endpoints_accessible(self, client):
        """Test that all API endpoints are accessible."""
        endpoints = [
            "/api/health",
            "/api/projects",
            "/api/cronjobs",
            "/api/agents",
            "/api/logs",
            "/api/config",
        ]
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 200, f"Endpoint {endpoint} not accessible"

    def test_response_content_type(self, client):
        """Test that all responses return JSON."""
        endpoints = [
            "/api/health",
            "/api/projects",
            "/api/cronjobs",
            "/api/agents",
            "/api/logs",
            "/api/config",
        ]
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.headers["content-type"].startswith("application/json"), \
                f"Endpoint {endpoint} does not return JSON"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])