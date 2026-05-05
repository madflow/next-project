# Analysis API Architecture

## General Rules

- Follow Python and FastAPI best practices
- Use type hints for all function parameters and return values
- Keep code modular and maintainable
- Use kebab-case for file and directory names

## Tech Stack

- **Language:** Python 3.13+
- **Framework:** FastAPI
- **Server:** Uvicorn (dev), Gunicorn (prod)
- **Database:** PostgreSQL 18
- **ORM:** SQLAlchemy 2.0 with asyncio
- **Data Processing:** Pandas, PyReadstat
- **Dependency Management:** Poetry
- **Linting:** Ruff
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

## Database Patterns

- Use SQLAlchemy async session for database operations
- Define models in `analysis/db/models/`
- Use dependency injection for database sessions via `get_db_session()`
- Handle database connections properly in lifecycle events
