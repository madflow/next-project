FROM node:24-alpine AS base

WORKDIR /app

FROM base AS builder-base

ENV TURBO_TELEMETRY_DISABLED=1

FROM builder-base AS builder

RUN npm install --ignore-scripts -g corepack@latest 
RUN corepack enable
RUN corepack prepare pnpm@10.17.0 --activate


COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm turbo prune @repo/database --docker

FROM base AS runner

RUN corepack enable pnpm

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/packages/database/docker/entrypoint.sh /entrypoint.sh
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Don't run production as root
RUN addgroup --system --gid 1001 appuser
RUN adduser --system --uid 1001 --ingroup appuser appuser
RUN chown -R appuser:appuser /app
RUN chmod +x /entrypoint.sh
USER appuser

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/sh"]
