#!/bin/sh
set -e

# Write DATABASE_URL to .env file if present
if [ -n "${DATABASE_URL:-}" ]; then
    echo "Writing DATABASE_URL to /app/packages/database/.env"
    mkdir -p /app/packages/database
    echo "DATABASE_URL=${DATABASE_URL}" > /app/packages/database/.env
fi

# Run migrations if requested
if [ "${DOCKER_RUN_MIGRATIONS:-0}" = "1" ]; then
    echo "Running database migrations..."
    npm run db:migrate
fi

