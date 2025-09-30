## Show this help message
.PHONY: help
help:
	@echo "Available commands:"
	@awk '/^##/ { comment = substr($$0, 4) } /^[a-zA-Z_-]+:/ && comment { printf "  \033[36m%-20s\033[0m %s\n", $$1, comment; comment = "" }' $(MAKEFILE_LIST)

## Start the development server (all apps)
.PHONY: dev
dev:
	pnpm run dev

## Build all apps and packages
.PHONY: build
build:
	pnpm run build

## Build only database
.PHONY: build-database
build-database:
	pnpm --filter ./packages/database run build

## Start all apps in production mode
.PHONY: start
start:
	pnpm run start

## Lint all apps
.PHONY: lint
lint:
	pnpm run lint

## Run database migrations
.PHONY: migrate
migrate:
	pnpm run db:migrate

## Check TypeScript types
.PHONY: check-types
check-types:
	pnpm run check-types

## Format code with Prettier
.PHONY: format
format:
	pnpm run format

## Start all Docker services (db, pgadmin, smtp)
.PHONY: docker-up
docker-up:
	docker compose up -d --build --remove-orphans

## Stop all Docker services
.PHONY: docker-down
docker-down:
	docker compose down

## Destroy all Docker services and volumes
.PHONY: docker-destroy
docker-destroy:
	docker compose down --volumes

## Show running Docker containers
.PHONY: docker-ps
docker-ps:
	docker compose ps

## Show logs for all Docker services
.PHONY: docker-logs
docker-logs:
	docker compose logs -f

## Shell into a running container. Usage: make shell SERVICE=postgres
.PHONY: shell
shell:
	docker compose exec $(SERVICE) sh

## Run psql inside the postgres container
.PHONY: psql
psql:
	docker compose exec postgres psql -U postgres postgres

## Export database dump to file. Usage: make dump-out FILE=backup.sql
.PHONY: dump-out
dump-out:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make dump-out FILE=backup.sql"; \
		exit 1; \
	fi
	docker compose exec -T postgres pg_dump -U postgres -d postgres > $(FILE)

## Import database dump from file. Usage: make dump-in FILE=backup.sql
.PHONY: dump-in
dump-in:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make dump-in FILE=backup.sql"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "Error: File $(FILE) does not exist"; \
		exit 1; \
	fi
	docker compose exec -T postgres psql -U postgres -d postgres < $(FILE)

## Export database dump to file (production). Usage: make prod-dump-out FILE=backup.sql
.PHONY: prod-dump-out
prod-dump-out:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make prod-dump-out FILE=backup.sql"; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $${POSTGRES_USER} -d $${POSTGRES_DB} > $(FILE)

## Import database dump from file (production). Usage: make prod-dump-in FILE=backup.sql
.PHONY: prod-dump-in
prod-dump-in:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make prod-dump-in FILE=backup.sql"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "Error: File $(FILE) does not exist"; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml exec -T postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB} < $(FILE)

## Seed database with test data
.PHONY: seed
seed:
	pnpm run seed

## Create TypeScript stubs
.PHONY: stubs
stubs:
	pnpm run stub

## Run all checks (tests, types, lint, translations)
.PHONY: check
check:
	pnpm run test
	pnpm run check-translations
	pnpm run check-types
	pnpm run lint

## Initialize development environment
.PHONY: dev-init
dev-init:
	s3cmd --no-check-certificate -c .config/s3cfg.local mb s3://app
	make migrate
	make seed