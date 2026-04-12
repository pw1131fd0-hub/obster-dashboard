import pytest
from fastapi.testclient import TestClient
from datetime import datetime

# Import the FastAPI app
import sys
sys.path.insert(0, '/home/crawd_user/project/obster-dashboard/backend')
from main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_200(self):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_response_has_status(self):
        response = client.get("/api/health")
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"

    def test_health_response_has_version(self):
        response = client.get("/api/health")
        data = response.json()
        assert "version" in data
        assert data["version"] == "1.0.0"


class TestProjectsEndpoint:
    def test_projects_returns_200(self):
        response = client.get("/api/projects")
        assert response.status_code == 200

    def test_projects_response_has_projects_array(self):
        response = client.get("/api/projects")
        data = response.json()
        assert "projects" in data
        assert isinstance(data["projects"], list)

    def test_projects_response_has_timestamp(self):
        response = client.get("/api/projects")
        data = response.json()
        assert "timestamp" in data


class TestCronjobsEndpoint:
    def test_cronjobs_returns_200(self):
        response = client.get("/api/cronjobs")
        assert response.status_code == 200

    def test_cronjobs_response_has_cronjobs_array(self):
        response = client.get("/api/cronjobs")
        data = response.json()
        assert "cronjobs" in data
        assert isinstance(data["cronjobs"], list)

    def test_cronjobs_accepts_limit_param(self):
        response = client.get("/api/cronjobs?limit=5")
        assert response.status_code == 200


class TestAgentsEndpoint:
    def test_agents_returns_200(self):
        response = client.get("/api/agents")
        assert response.status_code == 200

    def test_agents_response_has_agents_array(self):
        response = client.get("/api/agents")
        data = response.json()
        assert "agents" in data
        assert isinstance(data["agents"], list)

    def test_agents_accepts_timeout_param(self):
        response = client.get("/api/agents?timeout_minutes=60")
        assert response.status_code == 200


class TestLogsEndpoint:
    def test_logs_returns_200(self):
        response = client.get("/api/logs")
        assert response.status_code == 200

    def test_logs_response_has_logs_array(self):
        response = client.get("/api/logs")
        data = response.json()
        assert "logs" in data
        assert isinstance(data["logs"], list)

    def test_logs_response_has_count(self):
        response = client.get("/api/logs")
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)

    def test_logs_accepts_limit_param(self):
        response = client.get("/api/logs?limit=10")
        assert response.status_code == 200


class TestConfigEndpoint:
    def test_config_returns_200(self):
        response = client.get("/api/config")
        assert response.status_code == 200

    def test_config_has_required_fields(self):
        response = client.get("/api/config")
        data = response.json()
        assert "projects_path" in data
        assert "logs_path" in data
        assert "refresh_interval" in data
        assert "agents" in data