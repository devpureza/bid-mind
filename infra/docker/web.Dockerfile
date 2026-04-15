# syntax=docker/dockerfile:1.7
# =============================================================================
# BidMind · web (Next.js 15) — multi-stage build no monorepo pnpm
# =============================================================================

ARG NODE_VERSION=20-alpine

# ---- base com pnpm -----------------------------------------------------------
FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /repo

# ---- deps: instala apenas o que o workspace `web` precisa --------------------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/config/package.json packages/config/package.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @bidmind/web... --filter @bidmind/types --filter @bidmind/config

# ---- builder ----------------------------------------------------------------
FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /repo/packages ./packages
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @bidmind/web build

# ---- runner -----------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN addgroup -S bidmind && adduser -S -G bidmind bidmind

COPY --from=builder --chown=bidmind:bidmind /repo/apps/web/.next ./.next
COPY --from=builder --chown=bidmind:bidmind /repo/apps/web/public ./public
COPY --from=builder --chown=bidmind:bidmind /repo/apps/web/package.json ./package.json
COPY --from=builder --chown=bidmind:bidmind /repo/apps/web/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=bidmind:bidmind /repo/apps/web/node_modules ./node_modules

USER bidmind
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ >/dev/null 2>&1 || exit 1

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
