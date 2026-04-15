# syntax=docker/dockerfile:1.7
# =============================================================================
# BidMind · api (Fastify) — multi-stage build no monorepo pnpm
# =============================================================================

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/config/package.json packages/config/package.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @bidmind/api... --filter @bidmind/types --filter @bidmind/config

FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages ./packages
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/api ./apps/api
RUN pnpm --filter @bidmind/api build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
RUN addgroup -S bidmind && adduser -S -G bidmind bidmind

COPY --from=builder --chown=bidmind:bidmind /repo/apps/api/dist ./dist
COPY --from=builder --chown=bidmind:bidmind /repo/apps/api/package.json ./package.json
COPY --from=builder --chown=bidmind:bidmind /repo/apps/api/node_modules ./node_modules

USER bidmind
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health >/dev/null 2>&1 || exit 1

CMD ["node", "dist/index.js"]
