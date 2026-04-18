FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PROJECTS_PATH=/home/crawd_user/project
ENV LOGS_PATH=/home/crawd_user/.openclaw/workspace/logs/executions
ENV TIMEOUT_MINUTES=30

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]