#!/usr/bin/env bash
# =============================================================================
# BidMind — Gera par de chaves SSH para deploy automático
#
# Cria duas chaves ed25519 (staging e production) sem passphrase, prontas para
# serem usadas como GitHub Actions secrets (STAGING_SSH_KEY / PRODUCTION_SSH_KEY).
#
# Uso:
#   ./gen-deploy-keys.sh [DIR_DESTINO]    # default: ./.deploy-keys
# =============================================================================

set -euo pipefail

OUT_DIR="${1:-$(pwd)/.deploy-keys}"
mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

for env in staging production; do
  KEY_FILE="$OUT_DIR/bidmind_${env}"
  if [[ -f "$KEY_FILE" ]]; then
    echo "==> Já existe: $KEY_FILE  (pulando)"
    continue
  fi
  echo "==> Gerando chave $env"
  ssh-keygen -t ed25519 -N "" -C "bidmind-deploy-${env}" -f "$KEY_FILE"
done

cat <<EOF

✅ Chaves geradas em: $OUT_DIR

Próximos passos:
  1. Copiar a chave PÚBLICA correspondente para a VM (vai no setup-vm.sh):
       cat $OUT_DIR/bidmind_staging.pub
       cat $OUT_DIR/bidmind_production.pub

  2. Carregar a chave PRIVADA no GitHub como secret de environment:
       gh secret set STAGING_SSH_KEY    --env staging    < $OUT_DIR/bidmind_staging
       gh secret set PRODUCTION_SSH_KEY --env production < $OUT_DIR/bidmind_production

  3. ❗ NÃO COMMITAR $OUT_DIR — está no .gitignore (.deploy-keys/).
EOF
