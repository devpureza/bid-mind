#!/usr/bin/env bash
# =============================================================================
# BidMind — Deploy na VM
#
# Roda em /opt/bidmind. Pull das imagens novas, up, migrate (Prisma) e prune.
#
# Variáveis aceitas:
#   ENVIRONMENT  staging | production   (default: production)
#   IMAGE_TAG    tag a aplicar          (default: staging|latest conforme env)
#   GHCR_OWNER   owner GHCR              (default: devpureza)
# =============================================================================

set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-production}"
GHCR_OWNER="${GHCR_OWNER:-devpureza}"
APP_ROOT="/opt/bidmind"
COMPOSE_FILE="$APP_ROOT/compose/docker-compose.${ENVIRONMENT}.yml"

if [[ "$ENVIRONMENT" == "staging" ]]; then
  IMAGE_TAG="${IMAGE_TAG:-staging}"
else
  IMAGE_TAG="${IMAGE_TAG:-latest}"
fi
export GHCR_OWNER IMAGE_TAG

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose não encontrado: $COMPOSE_FILE" >&2
  exit 1
fi

cd "$APP_ROOT"

log() { echo -e "\033[1;34m[deploy]\033[0m $*"; }

# -----------------------------------------------------------------------------
log "ENV=$ENVIRONMENT  TAG=$IMAGE_TAG  OWNER=$GHCR_OWNER"
# -----------------------------------------------------------------------------

log "1/5 docker login ghcr.io (usa ~/.docker/config.json se já logado)"
if [[ -n "${REGISTRY_USER:-}" && -n "${REGISTRY_PASSWORD:-}" ]]; then
  echo "$REGISTRY_PASSWORD" | docker login ghcr.io -u "$REGISTRY_USER" --password-stdin
fi

log "2/5 pull"
docker compose -f "$COMPOSE_FILE" pull

log "3/5 up -d"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

log "4/5 migrate (Prisma) — placeholder até INFRA-04"
# docker compose -f "$COMPOSE_FILE" exec -T api npx prisma migrate deploy

log "5/5 prune (imagens dangling)"
docker image prune -f >/dev/null

log "Deploy concluído."
docker compose -f "$COMPOSE_FILE" ps
