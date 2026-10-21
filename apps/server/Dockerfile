# ==============================================================================
# Production Dockerfile for apps/server (Express REST API)
# ==============================================================================

FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate

FROM base AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy workspace manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json .npmrc .nvmrc ./

# Copy apps manifests
COPY apps/server/package.json apps/server/
COPY apps/front/package.json apps/front/
COPY apps/dashboard/package.json apps/dashboard/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/server/ apps/server/

# Build TypeScript. This does not execute the app or consume deployment variables.
# Database, JWT, and service configuration are injected by Compose at runtime.
RUN pnpm --filter oneself-server build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and built dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist

WORKDIR /app/apps/server
ENV APP_ROOT=/app/apps/server
# Keep the pnpm workspace paths intact so dependency symlinks remain valid.
RUN test -f dist/server.js && node --check dist/server.js

EXPOSE 5000

CMD ["node", "dist/server.js"]
