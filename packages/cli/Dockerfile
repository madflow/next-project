FROM node:22-alpine AS base

RUN apk add --no-cache bash

WORKDIR /app

FROM base AS builder-base

ENV TURBO_TELEMETRY_DISABLED=1

FROM builder-base AS builder

RUN npm install --global turbo@^2

COPY . .

RUN turbo prune @repo/cli --docker

FROM base AS runner

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/packages/cli/docker/entrypoint.sh /entrypoint.sh
RUN npm install
RUN npm run build

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]
