# Project-X

## Development Setup

### Option 1: Dev Container (Recommended)

The easiest way to get started is using the Dev Container, which provides a fully configured development environment with all dependencies and services.

**Prerequisites:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

**Quick Start:**
1. Open this project in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Select "Dev Containers: Open Folder in Container..."
4. Wait for the container to build and initialize

See [.devcontainer/README.md](.devcontainer/README.md) for more details.

### Option 2: Local Development

If you prefer to develop locally without containers, ensure you have:
- Node.js 24+
- pnpm 10.27.0
- Python 3.10+
- PostgreSQL 18

Then run:
```bash
pnpm install
make docker-up    # Start supporting services
make migrate      # Run database migrations
make seed         # Seed database
make dev          # Start development server
```
