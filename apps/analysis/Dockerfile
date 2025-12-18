FROM python:3.13.6-slim-bullseye AS prod


RUN pip install poetry==1.8.2

# Configuring poetry
RUN poetry config virtualenvs.create false
RUN poetry config cache-dir /tmp/poetry_cache

# Copying requirements of a project
COPY pyproject.toml poetry.lock /app/src/
WORKDIR /app/src

# Installing requirements
RUN --mount=type=cache,target=/tmp/poetry_cache poetry install --only main

# Copying actuall application
COPY . /app/src/
RUN --mount=type=cache,target=/tmp/poetry_cache poetry install --only main

# Don't run production as root
RUN groupadd --system --gid 1001 appuser
RUN useradd --system --uid 1001 --gid appuser --create-home appuser
RUN chown -R appuser:appuser /app
USER appuser

CMD ["/usr/local/bin/python", "-m", "analysis"]

FROM prod AS dev

USER root
RUN --mount=type=cache,target=/tmp/poetry_cache poetry install
RUN chown -R appuser:appuser /app
USER appuser
