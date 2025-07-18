FROM node:22-alpine AS base

FROM base AS builder
ENV TURBO_TELEMETRY_DISABLED=1
RUN apk update

RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app
RUN npm install --global turbo
COPY . .
RUN turbo prune @app/web --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN npm install

# Build the project
COPY --from=builder /app/out/full/ .

RUN npx turbo build

FROM base AS runner


RUN apk update
RUN apk add --no-cache busybox-extras bash
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max_old_space_size=4096
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD node apps/web/server.js
