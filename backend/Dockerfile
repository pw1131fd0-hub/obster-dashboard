FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for systemd/journalctl access
RUN apt-get update && apt-get install -y --no-install-recommends \
    dbus \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Environment variables
ENV PROJECTS_PATH=/home/crawd_user/project
ENV LOGS_PATH=/home/crawd_user/.openclaw/workspace/logs/executions
ENV TIMEOUT_MINUTES=30

EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]