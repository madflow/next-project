FROM node:22-alpine AS base

WORKDIR /app

FROM base AS builder-base

ENV TURBO_TELEMETRY_DISABLED=1

FROM builder-base AS builder

RUN npm install --ignore-scripts -g corepack@latest 
RUN corepack enable
RUN corepack prepare pnpm@10.17.0 --activate

RUN pnpm add --global turbo@^2

COPY . .

RUN turbo prune @repo/database --docker

FROM base AS runner

RUN corepack enable pnpm

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/packages/database/docker/entrypoint.sh /entrypoint.sh
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
RUN pnpm run build

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/sh"]
