#!/bin/bash
set -e

# Start FastAPI backend in background
cd /app
pip install -q fastapi==0.109.0 uvicorn==0.27.0 pydantic==2.5.3 requests==2.31.0 python-dotenv==1.0.0
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &

# Start nginx in foreground
nginx -g 'daemon off;'