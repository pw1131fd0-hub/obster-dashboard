"""
Pytest tests for Obster Dashboard Backend API.
Covers all endpoints with mocks for external dependencies.
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from main import app, AGENTS, SYSTEMD_SERVICES, VERSION


client = TestClient(app)


class TestHealthEndpoint:
    """Tests for GET /api/health"""

    def test_health_returns_healthy_status(self):
        """Health endpoint should return status=healthy"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_health_returns_version(self):
        """Health endpoint should return version"""
        response = client.get("/api/health")
        data = response.json()
        assert "version" in data
        assert data["version"] == VERSION

    def test_health_returns_uptime(self):
        """Health endpoint should return uptime_seconds"""
        response = client.get("/api/health")
        data = response.json()
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], (int, float))
        assert data["uptime_seconds"] >= 0


class TestProjectsEndpoint:
    """Tests for GET /api/projects"""

    @patch("main.Path")
    def test_projects_returns_empty_when_path_not_exists(self, mock_path_cls):
        """Projects endpoint should return empty list when path doesn't exist"""
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = False
        mock_path_cls.return_value = mock_path_instance

        response = client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert data["projects"] == []
        assert "timestamp" in data

    @patch("main.read_json_file")
    @patch("main.Path")
    def test_projects_scans_subdirectories_for_dev_status(self, mock_path_cls, mock_read_json):
        """Projects endpoint should scan subdirectories for docs/.dev_status.json"""
        mock_projects_path = MagicMock()
        mock_projects_path.exists.return_value = True

        mock_subdir1 = MagicMock()
        mock_subdir1.is_dir.return_value = True
        mock_subdir1.name = "project-alpha"

        mock_subdir2 = MagicMock()
        mock_subdir2.is_dir.return_value = True
        mock_subdir2.name = "project-beta"

        def mock_truediv(self, other):
            result = MagicMock()
            if other == "docs/.dev_status.json":
                result.exists.return_value = True
            else:
                result.exists.return_value = False
            return result

        type(mock_subdir1).__truediv__ = lambda self, x: mock_truediv(self, x)
        type(mock_subdir2).__truediv__ = lambda self, x: mock_truediv(self, x)

        mock_projects_path.iterdir.return_value = [mock_subdir1, mock_subdir2]
        mock_path_cls.return_value = mock_projects_path

        dev_status_content = {
            "stage": "dev",
            "iteration": 3,
            "quality_score": 92,
            "blocking_errors": [],
            "updated_at": "2026-04-13T08:30:00.000Z"
        }
        mock_read_json.return_value = dev_status_content

        response = client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert isinstance(data["projects"], list)
        assert len(data["projects"]) == 2

    @patch("main.Path")
    def test_projects_response_has_timestamp(self, mock_path_cls):
        """Projects response should include timestamp"""
        mock_instance = MagicMock()
        mock_instance.exists.return_value = False
        mock_path_cls.return_value = mock_instance

        response = client.get("/api/projects")
        data = response.json()
        assert "timestamp" in data


class TestCronjobsEndpoint:
    """Tests for GET /api/cronjobs"""

    @patch("main.parse_systemctl_show")
    @patch("main.get_journal_logs")
    def test_cronjobs_returns_service_list(self, mock_journal, mock_systemctl):
        """Cronjobs endpoint should return list of services"""
        mock_systemctl.return_value = {
            "ActiveState": "active",
            "ExecMainStatus": "0",
            "ActiveEnterTimestamp": "2026-04-18T10:00:00 UTC"
        }
        mock_journal.return_value = ["Log line 1", "Log line 2"]

        response = client.get("/api/cronjobs")
        assert response.status_code == 200
        data = response.json()
        assert "cronjobs" in data
        assert len(data["cronjobs"]) == len(SYSTEMD_SERVICES)

    @patch("main.parse_systemctl_show")
    @patch("main.get_journal_logs")
    def test_cronjobs_active_state_mapping(self, mock_journal, mock_systemctl):
        """Cronjobs should correctly map ActiveState to status"""
        mock_systemctl.return_value = {
            "ActiveState": "failed",
            "ExecMainStatus": "1",
            "ActiveEnterTimestamp": "2026-04-18T10:00:00 UTC"
        }
        mock_journal.return_value = []

        response = client.get("/api/cronjobs")
        data = response.json()

        for job in data["cronjobs"]:
            if job["name"] == "obster-monitor":
                assert job["status"] == "failed"
                assert job["exit_code"] == 1
                break
        else:
            pytest.fail("obster-monitor not found in cronjobs response")

    @patch("main.parse_systemctl_show")
    @patch("main.get_journal_logs")
    def test_cronjobs_inactive_state(self, mock_journal, mock_systemctl):
        """Cronjobs should handle inactive state"""
        mock_systemctl.return_value = {
            "ActiveState": "inactive",
            "ExecMainStatus": "0",
            "ActiveEnterTimestamp": ""
        }
        mock_journal.return_value = []

        response = client.get("/api/cronjobs")
        data = response.json()

        for job in data["cronjobs"]:
            if job["name"] == "obster-monitor":
                assert job["status"] == "inactive"
                break
        else:
            pytest.fail("obster-monitor not found in cronjobs response")


class TestAgentsEndpoint:
    """Tests for GET /api/agents"""

    def test_agents_returns_all_agents_when_no_token(self):
        """Agents endpoint should return all agents as unknown when no token"""
        with patch("main.TELEGRAM_BOT_TOKEN", ""):
            response = client.get("/api/agents")
            assert response.status_code == 200
            data = response.json()
            assert "agents" in data
            assert len(data["agents"]) == len(AGENTS)

            for agent in data["agents"]:
                assert agent["status"] == "unknown"
                assert agent["minutes_ago"] is None

    @patch("main.poll_telegram_get_updates")
    def test_agents_parses_updates_for_agent_names(self, mock_poll):
        """Agents endpoint should parse updates for agent names"""
        now = int(time.time())
        mock_poll.return_value = [
            {
                "message": {
                    "text": "Argus completed task",
                    "date": str(now - 300),  # 5 minutes ago
                }
            },
            {
                "message": {
                    "text": "Hephaestus deployed",
                    "date": str(now - 600),  # 10 minutes ago
                }
            }
        ]

        with patch("main.TELEGRAM_BOT_TOKEN", "fake_token"):
            with patch("main.TIMEOUT_MINUTES", 30):
                response = client.get("/api/agents")
                data = response.json()

                argus = next(a for a in data["agents"] if a["name"] == "Argus")
                assert argus["status"] == "healthy"
                assert argus["minutes_ago"] is not None
                assert argus["minutes_ago"] < 30

    @patch("main.poll_telegram_get_updates")
    def test_agents_unhealthy_when_timeout_exceeded(self, mock_poll):
        """Agents should be marked unhealthy when timeout exceeded"""
        now = int(time.time())
        mock_poll.return_value = [
            {
                "message": {
                    "text": "Argus completed task",
                    "date": str(now - 3600),  # 60 minutes ago - exceeds 30 min timeout
                }
            }
        ]

        with patch("main.TELEGRAM_BOT_TOKEN", "fake_token"):
            with patch("main.TIMEOUT_MINUTES", 30):
                response = client.get("/api/agents")
                data = response.json()

                argus = next(a for a in data["agents"] if a["name"] == "Argus")
                assert argus["status"] == "unhealthy"
                assert argus["minutes_ago"] >= 30


class TestLogsEndpoint:
    """Tests for GET /api/logs"""

    @patch("main.Path")
    def test_logs_returns_empty_when_path_not_exists(self, mock_path_cls):
        """Logs endpoint should return empty list when path doesn't exist"""
        mock_instance = MagicMock()
        mock_instance.exists.return_value = False
        mock_path_cls.return_value = mock_instance

        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert data["logs"] == []
        assert data["count"] == 0

    @patch("main.read_json_file")
    @patch("main.Path")
    def test_logs_reads_json_files(self, mock_path_cls, mock_read_json):
        """Logs endpoint should read JSON files from LOGS_PATH"""
        mock_logs_path = MagicMock()
        mock_logs_path.exists.return_value = True

        mock_file = MagicMock()
        mock_file.name = "exec-001.json"
        mock_file.stat.return_value.st_mtime = 1713432000

        mock_logs_path.glob.return_value = [mock_file]
        mock_path_cls.return_value = mock_logs_path

        log_content = {
            "execution_id": "exec-001",
            "status": "success",
            "completed_at": "2026-04-18T10:00:00.000Z"
        }
        mock_read_json.return_value = log_content

        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert data["count"] >= 0

    @patch("main.read_json_file")
    @patch("main.Path")
    def test_logs_respects_limit_parameter(self, mock_path_cls, mock_read_json):
        """Logs endpoint should respect limit parameter"""
        mock_logs_path = MagicMock()
        mock_logs_path.exists.return_value = True

        mock_files = []
        for i in range(25):
            mock_file = MagicMock()
            mock_file.name = f"exec-{i:03d}.json"
            mock_file.stat.return_value.st_mtime = 1713432000 - i
            mock_files.append(mock_file)

        mock_logs_path.glob.return_value = mock_files
        mock_path_cls.return_value = mock_logs_path

        mock_read_json.return_value = {"status": "success"}

        response = client.get("/api/logs?limit=10")
        data = response.json()
        assert len(data["logs"]) == 10

    @patch("main.read_json_file")
    @patch("main.Path")
    def test_logs_sorted_by_mtime_descending(self, mock_path_cls, mock_read_json):
        """Logs should be sorted by modification time descending"""
        mock_logs_path = MagicMock()
        mock_logs_path.exists.return_value = True

        mock_files = []
        for name, mtime in [("oldest.json", 1000), ("middle.json", 2000), ("newest.json", 3000)]:
            mock_file = MagicMock()
            mock_file.name = name
            mock_file.stat.return_value.st_mtime = mtime
            mock_files.append(mock_file)

        mock_logs_path.glob.return_value = mock_files
        mock_path_cls.return_value = mock_logs_path

        mock_read_json.return_value = {"status": "success"}

        response = client.get("/api/logs")
        data = response.json()

        filenames = [log["filename"] for log in data["logs"]]
        assert filenames == ["newest.json", "middle.json", "oldest.json"]


class TestConfigEndpoint:
    """Tests for GET /api/config"""

    def test_config_returns_all_settings(self):
        """Config endpoint should return all configuration settings"""
        response = client.get("/api/config")
        assert response.status_code == 200
        data = response.json()
        assert "projects_path" in data
        assert "logs_path" in data
        assert "timeout_minutes" in data
        assert "telegram_bot_token_set" in data
        assert "agents" in data
        assert "systemd_services" in data

    def test_config_returns_correct_values(self):
        """Config endpoint should return correct config values"""
        import main
        with patch.object(main, "PROJECTS_PATH", "/test/projects"):
            with patch.object(main, "LOGS_PATH", "/test/logs"):
                with patch.object(main, "TELEGRAM_BOT_TOKEN", "test_token"):
                    with patch.object(main, "TIMEOUT_MINUTES", 45):
                        response = client.get("/api/config")
                        data = response.json()
                        assert data["projects_path"] == "/test/projects"
                        assert data["logs_path"] == "/test/logs"
                        assert data["telegram_bot_token_set"] is True
                        assert data["timeout_minutes"] == 45
                        assert data["agents"] == ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]
                        assert data["systemd_services"] == ["obster-monitor", "obster-cron", "openclaw-scheduler"]

    def test_config_telegram_token_not_set(self):
        """Config endpoint should return telegram_bot_token_set=False when no token"""
        import main
        with patch.object(main, "TELEGRAM_BOT_TOKEN", ""):
            response = client.get("/api/config")
            data = response.json()
            assert data["telegram_bot_token_set"] is False
