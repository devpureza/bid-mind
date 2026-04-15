# syntax=docker/dockerfile:1.7
# =============================================================================
# BidMind · workers (BullMQ consumers dos Agentes 1-3) — monorepo pnpm
# =============================================================================

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/workers/package.json apps/workers/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/config/package.json packages/config/package.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @bidmind/workers... --filter @bidmind/types --filter @bidmind/config

FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/workers/node_modules ./apps/workers/node_modules
COPY --from=deps /repo/packages ./packages
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/workers ./apps/workers
RUN pnpm --filter @bidmind/workers build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S bidmind && adduser -S -G bidmind bidmind

COPY --from=builder --chown=bidmind:bidmind /repo/apps/workers/dist ./dist
COPY --from=builder --chown=bidmind:bidmind /repo/apps/workers/package.json ./package.json
COPY --from=builder --chown=bidmind:bidmind /repo/apps/workers/node_modules ./node_modules

USER bidmind
CMD ["node", "dist/index.js"]
