#!/bin/bash
set -e

# Install backend dependencies
pip install -q -r /home/crawd_user/project/obster-dashboard/backend/requirements.txt

# Start FastAPI backend
cd /home/crawd_user/project/obster-dashboard/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000