.PHONY: help dev build start lint migrate check-types format docker-up docker-down docker-ps docker-logs init shell psql dump-in dump-out prod-dump-in prod-dump-out

## Show this help message
help:
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

## Start the development server (all apps)
dev:
	pnpm run dev

## Build all apps and packages
build:
	pnpm run build

## Build only database
build-database:
	pnpm --filter ./packages/database run build

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

## Export database dump to file. Usage: make dump-out FILE=backup.sql
dump-out:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make dump-out FILE=backup.sql"; \
		exit 1; \
	fi
	docker-compose exec -T postgres pg_dump -U postgres -d postgres > $(FILE)

## Import database dump from file. Usage: make dump-in FILE=backup.sql
dump-in:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make dump-in FILE=backup.sql"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "Error: File $(FILE) does not exist"; \
		exit 1; \
	fi
	docker-compose exec -T postgres psql -U postgres -d postgres < $(FILE)

## Export database dump to file (production). Usage: make prod-dump-out FILE=backup.sql
prod-dump-out:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make prod-dump-out FILE=backup.sql"; \
		exit 1; \
	fi
	docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $${POSTGRES_USER} -d $${POSTGRES_DB} > $(FILE)

## Import database dump from file (production). Usage: make prod-dump-in FILE=backup.sql
prod-dump-in:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make prod-dump-in FILE=backup.sql"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "Error: File $(FILE) does not exist"; \
		exit 1; \
	fi
	docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB} < $(FILE)

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

## Init 
dev-init:
				s3cmd --no-check-certificate -c .config/s3cfg.local mb s3://app
				make migrate
				make seed



