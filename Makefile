.PHONY: help dev build start lint migrate check-types format docker-up docker-down docker-ps docker-logs shell psql

## Show this help message
help:
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

## Start the development server (all apps)
dev:
	pnpm run dev

## Build all apps
build:
	pnpm run build

## Start all apps in production mode
start:
	pnpm run start

## Lint all apps
lint:
	pnpm run lint

## Run database migrations
migrate:
	pnpm run db:migrate

## Check TypeScript types
check-types:
	pnpm run check-types

## Format code with Prettier
format:
	pnpm run format

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
	pnpm run seed

## Create stubs
stubs:
	pnpm run stub

## Check 
check:
	pnpm run test
	pnpm run check-translations
	pnpm run check-types
	pnpm run lint

