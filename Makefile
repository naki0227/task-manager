# Makefile for DreamCatcher

.PHONY: up down build logs shell migrate api-logs worker-logs

# Start all services (Docker)
up:
	docker-compose up -d

# Hybrid Dev Mode (Backend in Docker, Frontend Local)
dev:
	docker-compose up -d backend db redis worker
	@echo "Backend started. Starting Frontend..."
	cd frontend && npm run dev

# Start with build
build:
	docker-compose up -d --build

# Stop all services
down:
	docker-compose down

# View logs (all)
logs:
	docker-compose logs -f

# View API logs
api-logs:
	docker-compose logs -f backend

# View Worker logs
worker-logs:
	docker-compose logs -f worker

# Shell into backend
shell:
	docker-compose exec backend /bin/bash

# Run DB Migrations (Alembic)
# Note: Requires running backend container
migrate:
	docker-compose exec backend alembic upgrade head

# Generate Migration (Auto)
# Usage: make revision msg="add_user_table"
revision:
	docker-compose exec backend alembic revision --autogenerate -m "$(msg)"

# Clean everything (Volumes too)
clean:
	docker-compose down -v
