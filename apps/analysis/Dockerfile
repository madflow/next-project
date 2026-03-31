FROM python:3.13.6-slim-bullseye AS prod

RUN pip --no-cache-dir install poetry==1.8.2

RUN poetry config virtualenvs.create false
RUN poetry config cache-dir /tmp/poetry_cache

COPY pyproject.toml poetry.lock /app/src/
WORKDIR /app/src

RUN --mount=type=cache,target=/tmp/poetry_cache poetry install --only main

COPY . /app/src/
RUN --mount=type=cache,target=/tmp/poetry_cache poetry install --only main

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
