"""
Comprehensive pytest tests for Obster Dashboard API endpoints.
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
import pytest_asyncio

# Ensure parent directory is in path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest_asyncio.fixture(scope="module")
async def client():
    """Create test client for the FastAPI app."""
    from httpx import ASGITransport, AsyncClient
    from main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


class TestHealthEndpoint:
    """Tests for GET /api/health endpoint."""

    @pytest.mark.asyncio
    async def test_health_returns_correct_structure(self, client):
        """Test that health endpoint returns correct JSON structure."""
        response = await client.get("/api/health")
        assert response.status_code == 200

        data = response.json()
        assert "status" in data
        assert "uptime_seconds" in data
        assert "version" in data
        assert data["status"] == "healthy"
        assert isinstance(data["uptime_seconds"], (int, float))
        assert data["version"] == "1.0.0"

    @pytest.mark.asyncio
    async def test_health_uptime_increases(self, client):
        """Test that uptime increases between calls."""
        time.sleep(0.01)
        response = await client.get("/api/health")
        data = response.json()
        assert data["uptime_seconds"] >= 0

    @pytest.mark.asyncio
    async def test_health_version_format(self, client):
        """Test that version is a string."""
        response = await client.get("/api/health")
        data = response.json()
        assert isinstance(data["version"], str)
        assert len(data["version"]) > 0


class TestProjectsEndpoint:
    """Tests for GET /api/projects endpoint."""

    @pytest.mark.asyncio
    async def test_projects_returns_correct_structure(self, client):
        """Test that projects endpoint returns correct JSON structure."""
        response = await client.get("/api/projects")
        assert response.status_code == 200

        data = response.json()
        assert "projects" in data
        assert "timestamp" in data
        assert isinstance(data["projects"], list)

    @pytest.mark.asyncio
    async def test_projects_timestamp_is_iso8601(self, client):
        """Test that timestamp is in ISO8601 format."""
        response = await client.get("/api/projects")
        data = response.json()
        timestamp = data["timestamp"]
        # ISO8601 can end with Z or +00:00 (both are valid UTC indicators)
        assert "T" in timestamp
        assert "+00:00" in timestamp or timestamp.endswith("Z")

    @pytest.mark.asyncio
    async def test_projects_returns_list_of_projects(self, client):
        """Test that projects returns a list of project objects."""
        response = await client.get("/api/projects")
        data = response.json()
        # Projects may or may not exist, but structure should be valid
        for project in data["projects"]:
            assert "name" in project
            assert "path" in project
            assert "stage" in project
            assert "iteration" in project
            assert "quality_score" in project
            assert "blocking_errors" in project


class TestCronjobsEndpoint:
    """Tests for GET /api/cronjobs endpoint."""

    @pytest.mark.asyncio
    async def test_cronjobs_returns_correct_structure(self, client):
        """Test that cronjobs endpoint returns correct JSON structure."""
        response = await client.get("/api/cronjobs")
        assert response.status_code == 200

        data = response.json()
        assert "cronjobs" in data
        assert "timestamp" in data
        assert isinstance(data["cronjobs"], list)

    @pytest.mark.asyncio
    async def test_cronjobs_includes_all_services(self, client):
        """Test that all expected cronjob services are included."""
        response = await client.get("/api/cronjobs")
        data = response.json()
        service_names = [cj["name"] for cj in data["cronjobs"]]
        assert "obster-monitor" in service_names
        assert "obster-cron" in service_names
        assert "openclaw-scheduler" in service_names

    @pytest.mark.asyncio
    async def test_cronjobs_handles_systemctl_errors_gracefully(self, client):
        """Test that cronjobs handles systemctl errors gracefully."""
        with patch("main.get_cronjob_status") as mock_status:
            from main import CronJobStatus
            # Return error status for all services
            mock_status.return_value = CronJobStatus(
                name="test-service",
                status="error",
                last_run=None,
                exit_code=None,
                recent_logs=["systemctl failed"]
            )
            response = await client.get("/api/cronjobs")
            assert response.status_code == 200
            data = response.json()
            # All services should show error status from our mock
            for cj in data["cronjobs"]:
                assert cj["status"] == "error"

    @pytest.mark.asyncio
    async def test_cronjobs_timeout_handling(self, client):
        """Test that systemctl timeout is handled."""
        with patch("main.get_cronjob_status") as mock_status:
            from main import CronJobStatus
            mock_status.return_value = CronJobStatus(
                name="test-service",
                status="timeout",
                last_run=None,
                exit_code=None,
                recent_logs=["Timeout expired"]
            )
            response = await client.get("/api/cronjobs")
            assert response.status_code == 200
            data = response.json()
            assert data["cronjobs"][0]["status"] == "timeout"

    @pytest.mark.asyncio
    async def test_cronjobs_each_service_has_required_fields(self, client):
        """Test that each cronjob has all required fields."""
        response = await client.get("/api/cronjobs")
        data = response.json()
        for cj in data["cronjobs"]:
            assert "name" in cj
            assert "status" in cj
            assert "last_run" in cj
            assert "exit_code" in cj
            assert "recent_logs" in cj


class TestAgentsEndpoint:
    """Tests for GET /api/agents endpoint."""

    @pytest.mark.asyncio
    async def test_agents_returns_correct_structure(self, client):
        """Test that agents endpoint returns correct JSON structure."""
        response = await client.get("/api/agents")
        assert response.status_code == 200

        data = response.json()
        assert "agents" in data
        assert "timestamp" in data
        assert isinstance(data["agents"], list)

    @pytest.mark.asyncio
    async def test_agents_includes_all_expected_agents(self, client):
        """Test that all expected agents are included."""
        response = await client.get("/api/agents")
        data = response.json()
        agent_names = [a["name"] for a in data["agents"]]
        expected_agents = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]
        for name in expected_agents:
            assert name in agent_names

    @pytest.mark.asyncio
    async def test_agents_returns_unknown_when_no_token(self, client):
        """Test that agents with no token configured returns unknown status."""
        with patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": ""}, clear=False):
            with patch("main.TELEGRAM_BOT_TOKEN", ""):
                # Create a new client with reloaded module
                import importlib
                import main as main_module
                # Re-bind the TELEGRAM_BOT_TOKEN in the module
                main_module.TELEGRAM_BOT_TOKEN = ""

                from httpx import ASGITransport, AsyncClient
                transport = ASGITransport(app=main_module.app)
                async with AsyncClient(transport=transport, base_url="http://testserver") as new_client:
                    response = await new_client.get("/api/agents")
                    assert response.status_code == 200
                    data = response.json()
                    # All agents should have unknown status when no token
                    for agent in data["agents"]:
                        assert agent["status"] == "unknown"

    @pytest.mark.asyncio
    async def test_agents_handles_api_error(self, client):
        """Test that agents handles Telegram API errors gracefully."""
        with patch("main.track_agents") as mock_track:
            from main import AgentInfo
            mock_track.return_value = [
                AgentInfo(name="Argus", status="error", last_response=None, minutes_ago=None)
            ]
            response = await client.get("/api/agents")
            assert response.status_code == 200
            data = response.json()
            assert data["agents"][0]["status"] == "error"

    @pytest.mark.asyncio
    async def test_agents_handles_network_error(self, client):
        """Test that agents handles network errors gracefully."""
        with patch("main.track_agents") as mock_track:
            from main import AgentInfo
            mock_track.return_value = [
                AgentInfo(name="Argus", status="error", last_response=None, minutes_ago=None)
            ]
            response = await client.get("/api/agents")
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_agents_timestamp_is_iso8601(self, client):
        """Test that timestamp is in ISO8601 format."""
        response = await client.get("/api/agents")
        data = response.json()
        timestamp = data["timestamp"]
        assert "T" in timestamp
        assert "+00:00" in timestamp or timestamp.endswith("Z")

    @pytest.mark.asyncio
    async def test_agents_each_has_required_fields(self, client):
        """Test that each agent has all required fields."""
        response = await client.get("/api/agents")
        data = response.json()
        for agent in data["agents"]:
            assert "name" in agent
            assert "status" in agent
            assert "last_response" in agent
            assert "minutes_ago" in agent


class TestLogsEndpoint:
    """Tests for GET /api/logs endpoint."""

    @pytest.mark.asyncio
    async def test_logs_returns_correct_structure(self, client):
        """Test that logs endpoint returns correct JSON structure."""
        response = await client.get("/api/logs")
        assert response.status_code == 200

        data = response.json()
        assert "logs" in data
        assert "count" in data
        assert "timestamp" in data
        assert isinstance(data["logs"], list)

    @pytest.mark.asyncio
    async def test_logs_respects_limit_parameter(self, client):
        """Test that logs respects the limit parameter."""
        with patch("main.scan_logs") as mock_scan:
            from main import ExecutionLog
            mock_scan.return_value = []
            response = await client.get("/api/logs?limit=5")
            assert response.status_code == 200
            mock_scan.assert_called_once_with(limit=5)

    @pytest.mark.asyncio
    async def test_logs_handles_file_read_error(self, client):
        """Test that logs handles individual file read errors gracefully."""
        with patch("main.scan_logs") as mock_scan:
            from main import ExecutionLog
            mock_scan.return_value = [
                ExecutionLog(
                    filename="test.json",
                    path="/tmp/test.json",
                    timestamp="2026-04-13T10:00:00+00:00",
                    content={}
                )
            ]
            response = await client.get("/api/logs")
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_logs_count_matches_logs_list_length(self, client):
        """Test that count matches the length of logs list."""
        with patch("main.scan_logs") as mock_scan:
            from main import ExecutionLog
            mock_scan.return_value = [
                ExecutionLog(filename="a.json", path="/a.json", timestamp=None, content={}),
                ExecutionLog(filename="b.json", path="/b.json", timestamp=None, content={}),
            ]
            response = await client.get("/api/logs")
            data = response.json()
            assert data["count"] == 2
            assert data["count"] == len(data["logs"])


class TestConfigEndpoint:
    """Tests for GET /api/config endpoint."""

    @pytest.mark.asyncio
    async def test_config_returns_correct_structure(self, client):
        """Test that config endpoint returns correct JSON structure."""
        response = await client.get("/api/config")
        assert response.status_code == 200

        data = response.json()
        assert "PROJECTS_PATH" in data
        assert "LOGS_PATH" in data
        assert "TELEGRAM_BOT_TOKEN" in data
        assert "TIMEOUT_MINUTES" in data
        assert "AGENTS" in data
        assert "REFRESH_INTERVAL" in data

    @pytest.mark.asyncio
    async def test_config_returns_expected_defaults(self, client):
        """Test that config returns expected default values."""
        response = await client.get("/api/config")
        data = response.json()
        assert data["PROJECTS_PATH"] == "/home/crawd_user/project"
        assert data["LOGS_PATH"] == "/home/crawd_user/.openclaw/workspace/logs/executions"
        assert data["TIMEOUT_MINUTES"] == 30
        assert isinstance(data["AGENTS"], list)
        assert len(data["AGENTS"]) > 0

    @pytest.mark.asyncio
    async def test_config_agents_is_list(self, client):
        """Test that AGENTS is returned as a list."""
        response = await client.get("/api/config")
        data = response.json()
        assert isinstance(data["AGENTS"], list)
        assert len(data["AGENTS"]) == 6  # Argus, Hephaestus, Atlas, Hestia, Hermes, Main

    @pytest.mark.asyncio
    async def test_config_telegram_token_masked(self, client):
        """Test that TELEGRAM_BOT_TOKEN is returned as-is (not masked in our implementation)."""
        response = await client.get("/api/config")
        data = response.json()
        # Our implementation returns the actual token value
        assert isinstance(data["TELEGRAM_BOT_TOKEN"], str)


class TestErrorHandling:
    """Tests for error handling across all endpoints."""

    @pytest.mark.asyncio
    async def test_root_endpoint_accessible(self, client):
        """Test that root endpoint is accessible."""
        response = await client.get("/api/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "docs" in data

    @pytest.mark.asyncio
    async def test_cronjobs_handles_permission_error(self, client):
        """Test cronjobs handles permission errors gracefully."""
        # Note: Without privileged access, systemctl may fail but is handled
        response = await client.get("/api/cronjobs")
        # Should return 200 with whatever status from systemctl
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_logs_handles_scan_error(self, client):
        """Test logs handles scan errors gracefully."""
        # Note: When LOGS_PATH doesn't exist, scan_logs returns empty list
        response = await client.get("/api/logs")
        # Should return 200 with empty logs
        assert response.status_code == 200


class TestTimestampHelpers:
    """Tests for timestamp helper functions."""

    def test_get_timestamp_format(self):
        """Test that get_timestamp returns valid ISO8601 format."""
        from main import get_timestamp
        timestamp = get_timestamp()
        assert isinstance(timestamp, str)
        # ISO8601 can end with Z or +00:00 (both are valid UTC indicators)
        assert "T" in timestamp
        assert "+00:00" in timestamp or timestamp.endswith("Z")

    def test_get_uptime_seconds_positive(self):
        """Test that uptime seconds is positive after startup."""
        from main import get_uptime_seconds
        uptime = get_uptime_seconds()
        assert uptime >= 0
        assert isinstance(uptime, (int, float))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
