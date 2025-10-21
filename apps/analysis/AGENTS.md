# Analysis Application Architecture

## General Rules

- Follow Python and FastAPI best practices
- Use type hints for all function parameters and return values
- Keep code modular and maintainable
- Use kebab-case for file and directory names

## Tech Stack

- **Language:** Python 3.9+
- **Framework:** FastAPI
- **Server:** Uvicorn (dev), Gunicorn (prod)
- **Database:** PostgreSQL 18
- **ORM:** SQLAlchemy 2.0 with asyncio
- **Data Processing:** Pandas, PyReadstat
- **Dependency Management:** Poetry
- **Linting:** Ruff, Black, MyPy
- **Testing:** Pytest

## Project Structure

- `analysis/` - Main application package
  - `web/` - FastAPI application and API routes
    - `api/` - API endpoints and schemas
    - `application.py` - FastAPI app factory
    - `lifespan.py` - Application lifecycle management
  - `db/` - Database models and utilities
    - `models/` - SQLAlchemy ORM models
    - `dependencies.py` - Database session management
  - `services/` - Business logic and data processing
  - `settings.py` - Application configuration
  - `tests/` - Unit and integration tests
- `scripts/` - Utility scripts
- `sandbox/` - Development and testing sandbox

## Python & FastAPI Patterns

- Use async/await for database operations and I/O
- Define Pydantic models for request/response validation in `web/api/schemas/`
- Keep route handlers thin, move business logic to services
- Use dependency injection for database sessions
- Follow RESTful conventions for API endpoints

## Type Hints & Validation

- Always use type hints for function signatures
- Use Pydantic models for data validation
- Enable MyPy strict mode for type checking
- Avoid using `Any` type unless absolutely necessary

## Database Patterns

- Use SQLAlchemy async session for database operations
- Define models in `analysis/db/models/`
- Use dependency injection for database sessions via `get_db_session()`
- Handle database connections properly in lifecycle events

## Development Workflow

### Running the Application

```bash
# From apps/analysis directory
poetry install
poetry run python -m analysis
```

### Testing

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=analysis
```

### Linting & Formatting

```bash
# Format code
poetry run black analysis/

# Lint with Ruff
poetry run ruff check analysis/

# Type checking
poetry run mypy analysis/
```

## API Development

- API routes are defined in `analysis/web/api/`
- Use router groups for logical endpoint organization
- Document endpoints with proper OpenAPI annotations
- API documentation available at `/api/docs` (Swagger UI)

## Error Handling

- Use FastAPI's HTTPException for API errors
- Provide clear, descriptive error messages
- Log errors appropriately using loguru
- Handle database errors gracefully

## Configuration

- Application settings defined in `analysis/settings.py`
- Use environment variables for configuration
- Support for Sentry error tracking
- Database connection configured via settings
