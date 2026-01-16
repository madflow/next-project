# Dev Container Configuration

This directory contains the development container configuration for the Next Project. The dev container provides a consistent, fully-configured development environment with all necessary tools and services.

## Features

- **Node.js 24** with pnpm package manager
- **Python 3.10+** with Poetry for the analysis app
- **PostgreSQL 18** database
- **All supporting services**: S3 storage, SMTP server, PostgREST, pgAdmin
- **Pre-configured VS Code extensions** for TypeScript, Python, Tailwind, ESLint, etc.
- **Automatic setup** with post-create script

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Opening the Project

1. Open VS Code
2. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Select **"Dev Containers: Open Folder in Container..."**
4. Select the project folder
5. Wait for the container to build and initialize (first time takes a few minutes)

The post-create script will automatically:
- Install all Node.js dependencies
- Build the database package
- Run database migrations
- Seed the database
- Install Python dependencies

### Alternative: Rebuild Container

If you need to rebuild the container:
1. Open command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Select **"Dev Containers: Rebuild Container"**

## Available Services

Once the container is running, the following services are available:

| Service | Port | Description |
|---------|------|-------------|
| Next.js Dev | 3000 | Main web application (dev mode) |
| App Service | 3001 | Production-built app service |
| PostgREST | 3002 | REST API for PostgreSQL |
| Analysis API | 3003 | Python FastAPI analysis service |
| PostgreSQL | 5432 | Main database |
| pgAdmin | 5050 | Database admin UI (admin@example.com / admin) |
| Mailpit UI | 8025 | Email testing UI |
| Mailpit SMTP | 1025 | SMTP server for testing |
| S3 Storage | 7070 | Local S3-compatible storage |

## Development Workflow

### Start Development Server

```bash
make dev
# or
pnpm run dev
```

### Run Tests and Checks

```bash
make check           # Run all checks
make lint           # Run linters
make check-types    # Check TypeScript types
pnpm run test       # Run tests
```

### Database Operations

```bash
make migrate        # Run migrations
make seed           # Seed database
make psql           # Open psql shell
```

### View All Commands

```bash
make help
```

## Configuration Files

- `devcontainer.json` - Main dev container configuration
- `docker-compose.yml` - Services and volumes for development
- `Dockerfile` - Development environment image
- `post-create.sh` - Automatic setup script

## Customization

### Adding VS Code Extensions

Edit the `extensions` array in `devcontainer.json`:

```json
"extensions": [
  "your-publisher.your-extension"
]
```

### Changing Environment Variables

Edit the `environment` section in `docker-compose.yml` for the `app` service.

### Installing Additional Tools

Add installation commands to the `Dockerfile`:

```dockerfile
RUN apt-get update && apt-get install -y your-package
```

## Troubleshooting

### Container Won't Start

1. Make sure Docker Desktop is running
2. Check Docker Desktop has enough resources (4GB+ RAM recommended)
3. Try rebuilding: **Dev Containers: Rebuild Container**

### Port Already in Use

If a port is already in use on your host machine, you can change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change 3001 to another port
```

### Database Connection Issues

The post-create script waits for PostgreSQL to be ready. If you still have issues:

```bash
# Check if PostgreSQL is running
docker compose ps

# View PostgreSQL logs
docker compose logs postgres
```

### Dependencies Not Installing

Try manually running:

```bash
pnpm install
cd apps/analysis && poetry install
```

## VS Code Extensions Included

- **JavaScript/TypeScript**: ESLint, Prettier, Tailwind CSS IntelliSense
- **Python**: Python, Black Formatter, Ruff
- **Database**: SQLTools with PostgreSQL driver
- **Git**: GitLens
- **Docker**: Docker extension
- **General**: EditorConfig, Code Spell Checker

## Additional Resources

- [Dev Containers Documentation](https://containers.dev/)
- [VS Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
