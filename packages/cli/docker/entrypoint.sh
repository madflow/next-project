#!/bin/sh
set -e

# Write DATABASE_URL to .env file if present
if [ -n "${DATABASE_URL:-}" ]; then
    echo "Writing DATABASE_URL to /app/packages/cli/.env"
    mkdir -p /app/packages/cli
    echo "DATABASE_URL=${DATABASE_URL}" > /app/packages/cli/.env
fi

