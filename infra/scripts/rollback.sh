#!/usr/bin/env bash
# =============================================================================
# BidMind — Rollback (RNF-07: < 5 min)
#
# Estratégia:
#   - Em produção, cada deploy promove a tag corrente :latest para :previous
#     ANTES de subir a nova (vide deploy-production.yml).
#   - Rollback faz repull de :previous e sobe novamente.
#
# Uso (em /opt/bidmind):
#   ENVIRONMENT=production ./scripts/rollback.sh
#   ENVIRONMENT=production IMAGE_TAG=sha-<commit> ./scripts/rollback.sh   # tag específica
# =============================================================================

set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-production}"
GHCR_OWNER="${GHCR_OWNER:-devpureza}"
IMAGE_TAG="${IMAGE_TAG:-previous}"
APP_ROOT="/opt/bidmind"
COMPOSE_FILE="$APP_ROOT/compose/docker-compose.${ENVIRONMENT}.yml"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose não encontrado: $COMPOSE_FILE" >&2
  exit 1
fi

cd "$APP_ROOT"
export GHCR_OWNER IMAGE_TAG

log() { echo -e "\033[1;33m[rollback]\033[0m $*"; }

log "Voltando $ENVIRONMENT para a tag '$IMAGE_TAG'"
docker compose -f "$COMPOSE_FILE" pull
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

log "Rollback concluído."
docker compose -f "$COMPOSE_FILE" ps
