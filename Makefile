# Makefile for nextjs-better-auth
#
# This Makefile provides common development commands for the project.
# It wraps npm scripts and docker-compose commands for convenience.
#
# Usage:
#   make <target>
#
# Run `make help` to see all available commands.

.PHONY: help dev build start lint migrate check-types format docker-up docker-down docker-ps docker-logs shell psql

## Show this help message
help:
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

## Start the development server (all apps)
dev:
	npm run dev

## Build all apps
build:
	npm run build

## Start all apps in production mode
start:
	npm run start

## Lint all apps
lint:
	npm run lint

## Run database migrations
migrate:
	npm run db:migrate

## Check TypeScript types
check-types:
	npm run check-types

## Format code with Prettier
format:
	npm run format

## Start all Docker services (db, pgadmin, smtp)
docker-up:
	docker-compose up -d --build --remove-orphans

## Stop all Docker services
docker-down:
	docker-compose down

## Destroy all Docker services and volumes
docker-destroy:
	docker-compose down --volumes

## Show running Docker containers
docker-ps:
	docker-compose ps

## Show logs for all Docker services
docker-logs:
	docker-compose logs -f

## Shell into a running container. Usage: make shell SERVICE=postgres
shell:
	docker-compose exec $(SERVICE) sh

## Run psql inside the postgres container
psql:
	docker-compose exec postgres psql -U postgres postgres

## Seed 
seed:
	npm run seed

## Create stubs
stubs:
	npm run stub

## Check 
check:
	npm run test
	npm run check-translations
	npm run check-types
	npm run lint

