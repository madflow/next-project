# E2E Testing with Playwright

## Overview

- This package contains end-to-end tests for the web application using Playwright.
- The tests verify user flows, UI interactions, and data persistence across the entire application stack.

## Test Structure

### Test Organization

- `tests/` - All test files (`.spec.ts` files)
- `testdata/` - Test data files (SPSS files, fixtures)
- `config.ts` - Test configuration and environment setup
- `utils.ts` - Shared test utilities and helpers
- `playwright.config.ts` - Playwright configuration

## Running Tests

### Prerequisites

1. **Web application must be running**: `http://localhost:3000`
2. **Database must be running**: PostgreSQL via Docker Compose
3. **Test environment**: Configured in `config.ts`

#### Checking Development Server Status

**Always verify the dev server is running before starting tests:**

```bash
# Check if the web app is accessible
curl -f http://localhost:3000 > /dev/null 2>&1 && echo "Server is running" || echo "Server is not running"

# Alternative check to see what's running on port 3000
lsof -i :3000

# Or using netstat
netstat -an | grep :3000
```

#### Starting the Development Server (if needed)

**Only start if the server is not already running:**

```bash
# From project root - start the development environment
make dev
```

**Important**:

- Do not start multiple dev server instances on port 3000
- Always check server status before attempting to start
- The dev server must be running outside of Docker for tests to work properly
