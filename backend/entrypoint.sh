#!/bin/bash

# Default to running API if no command specified or just "api"
MODE=${1:-api}

echo "Starting in mode: $MODE"

if [ "$MODE" = "all" ]; then
    echo "Starting Celery Worker in background..."
    celery -A app.worker.celery worker --loglevel=info &
    CELERY_PID=$!
    
    echo "Starting Uvicorn API..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    UVICORN_PID=$!
    
    # Wait for any process to exit
    wait -n
    
    # Exit with status of process that exited first
    exit $?
    
elif [ "$MODE" = "worker" ]; then
    echo "Starting Celery Worker..."
    exec celery -A app.worker.celery worker --loglevel=info
    
else
    echo "Starting Uvicorn API..."
    # Auto-run migrations in single-container mode if strictly needed
    # alembic upgrade head
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
