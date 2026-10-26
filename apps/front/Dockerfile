# syntax=docker/dockerfile:1
# ==============================================================================
# Production Dockerfile for apps/front (Next.js Customer Storefront)
# ==============================================================================

FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate

FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy workspace manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json .npmrc .nvmrc ./

# Copy apps manifests
COPY apps/front/package.json apps/front/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/server/package.json apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/front/ apps/front/

# Build standalone Next.js bundle
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096 --dns-result-order=ipv4first"
# GitHub Actions supplies the app configuration from Variables (or Secrets)
# as a BuildKit file mount. Its content hash invalidates the build cache.
ARG FRONTEND_ENV_HASH
RUN --mount=type=secret,id=frontend_env,target=/app/apps/front/.env.production,required=true \
    test -n "$FRONTEND_ENV_HASH" && pnpm --filter oneself-front build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets and standalone output
COPY --from=builder /app/apps/front/public ./apps/front/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/front/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/front/.next/static ./apps/front/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/front/server.js"]
