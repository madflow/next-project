FROM node:22-alpine AS base

WORKDIR /app

FROM base AS builder-base

ENV TURBO_TELEMETRY_DISABLED=1

FROM builder-base AS builder

RUN npm install --global turbo@^2

COPY . .

RUN turbo prune @repo/cli --docker

FROM base AS runner

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/packages/database/docker/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/sh"]
