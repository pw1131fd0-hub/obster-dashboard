FROM python:3.11-slim

LABEL org.opencontainers.image.title="Obster Dashboard Backend" \
      org.opencontainers.image.description="FastAPI backend for OpenClaw system monitoring" \
      org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Install dependencies in a separate layer for better cache reuse
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

EXPOSE 8000

# Health check uses Python's built-in urllib so no extra packages are required
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python3 -c \
        "import urllib.request, sys; \
         urllib.request.urlopen('http://localhost:8000/api/health'); \
         sys.exit(0)" \
    || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
