FROM node:24-alpine AS base

WORKDIR /app

FROM base AS builder-base

ENV TURBO_TELEMETRY_DISABLED=1

FROM builder-base AS builder

RUN npm install --ignore-scripts -g corepack@latest 
RUN corepack enable
RUN corepack prepare pnpm@10.32.1 --activate


COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm turbo prune @repo/worker --docker

FROM base AS runner

RUN corepack enable pnpm

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Don't run production as root
RUN addgroup --system --gid 1001 appuser
RUN adduser --system --uid 1001 --ingroup appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

ENTRYPOINT ["node", "dist/runner.js"]
CMD ["/bin/sh"]
