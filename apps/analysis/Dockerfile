FROM python:3.14-slim AS prod

COPY --from=ghcr.io/astral-sh/uv:0.8.14 /uv /uvx /bin/

ENV UV_LINK_MODE=copy
ENV UV_PROJECT_ENVIRONMENT=/usr/local

# Copying requirements of a project
COPY pyproject.toml uv.lock /app/src/
WORKDIR /app/src

# Installing requirements
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev --no-install-project

# Copying actuall application
COPY . /app/src/
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev

# Don't run production as root
RUN groupadd --system --gid 1001 appuser
RUN useradd --system --uid 1001 --gid appuser --create-home appuser
RUN chown -R appuser:appuser /app
USER appuser

CMD ["/usr/local/bin/python", "-m", "analysis"]

FROM prod AS dev

USER root
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --dev
RUN chown -R appuser:appuser /app
USER appuser
