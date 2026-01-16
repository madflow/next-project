#!/bin/bash
set -e

echo "🚀 Starting post-create setup..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
pnpm install

# Build database package
echo "🔨 Building database package..."
pnpm run db:build

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U postgres; do
  sleep 1
done

# Run database migrations
echo "🗄️  Running database migrations..."
pnpm run db:migrate

# Initialize S3 bucket (optional, may fail if s3cmd is not available)
echo "🪣 Initializing S3 bucket..."
if command -v s3cmd &> /dev/null; then
  s3cmd --no-check-certificate -c .config/s3cfg.local mb s3://app 2>/dev/null || echo "S3 bucket already exists or s3cmd not configured"
else
  echo "⚠️  s3cmd not found, skipping S3 bucket initialization"
fi

# Seed database (optional)
echo "🌱 Seeding database..."
pnpm run seed || echo "⚠️  Database seeding failed or not configured"

# Install Python dependencies for analysis app
echo "🐍 Installing Python dependencies..."
(cd /workspace/apps/analysis && poetry install) || echo "⚠️  Poetry install failed"

echo "✅ Post-create setup complete!"
echo ""
echo "🎉 Your development environment is ready!"
echo ""
echo "Quick start commands:"
echo "  - make dev          # Start development server"
echo "  - make check        # Run all checks (tests, lint, types)"
echo "  - make docker-up    # Start all Docker services"
echo "  - make help         # Show all available commands"
echo ""
