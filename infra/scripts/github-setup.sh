#!/usr/bin/env bash
# =============================================================================
# BidMind — Setup remoto do GitHub (INFRA-02)
#
# Configura environments (staging/production), secrets e branch protection no
# repositório usando o GitHub CLI (gh).
#
# Pré-requisitos:
#   - gh CLI instalado: https://cli.github.com/
#   - Autenticado: `gh auth login`
#   - Variáveis de ambiente preenchidas (ver bloco abaixo) ou exportadas antes.
#
# Uso:
#   chmod +x infra/scripts/github-setup.sh
#   ./infra/scripts/github-setup.sh
# =============================================================================

set -euo pipefail

REPO="${REPO:-devpureza/bid-mind}"

# -----------------------------------------------------------------------------
# Secrets — preencher antes de rodar (ou exportar no shell)
# -----------------------------------------------------------------------------
: "${STAGING_HOST:?defina STAGING_HOST (ex: 1.2.3.4)}"
: "${STAGING_USER:?defina STAGING_USER (ex: deploy)}"
: "${STAGING_SSH_KEY_FILE:?defina STAGING_SSH_KEY_FILE (caminho da chave privada)}"
: "${PRODUCTION_HOST:?defina PRODUCTION_HOST}"
: "${PRODUCTION_USER:?defina PRODUCTION_USER}"
: "${PRODUCTION_SSH_KEY_FILE:?defina PRODUCTION_SSH_KEY_FILE}"
: "${REGISTRY_USER:?defina REGISTRY_USER (geralmente o owner do repo)}"
: "${REGISTRY_PASSWORD:?defina REGISTRY_PASSWORD (PAT com escopo write:packages)}"
: "${OPENAI_API_KEY:?defina OPENAI_API_KEY}"

echo "==> Repo alvo: $REPO"
gh auth status >/dev/null

# -----------------------------------------------------------------------------
# 1) Environments
# -----------------------------------------------------------------------------
echo "==> Criando environments staging e production"
for env in staging production; do
  gh api -X PUT "repos/$REPO/environments/$env" --silent && \
    echo "  - environment '$env' ok"
done

# -----------------------------------------------------------------------------
# 2) Secrets de repositório (compartilhados)
# -----------------------------------------------------------------------------
echo "==> Definindo secrets de repositório"
gh secret set REGISTRY_USER     -R "$REPO" --body "$REGISTRY_USER"
gh secret set REGISTRY_PASSWORD -R "$REPO" --body "$REGISTRY_PASSWORD"
gh secret set OPENAI_API_KEY    -R "$REPO" --body "$OPENAI_API_KEY"

# -----------------------------------------------------------------------------
# 3) Secrets por environment
# -----------------------------------------------------------------------------
echo "==> Definindo secrets do environment staging"
gh secret set STAGING_HOST     -R "$REPO" --env staging --body "$STAGING_HOST"
gh secret set STAGING_USER     -R "$REPO" --env staging --body "$STAGING_USER"
gh secret set STAGING_SSH_KEY  -R "$REPO" --env staging < "$STAGING_SSH_KEY_FILE"

echo "==> Definindo secrets do environment production"
gh secret set PRODUCTION_HOST    -R "$REPO" --env production --body "$PRODUCTION_HOST"
gh secret set PRODUCTION_USER    -R "$REPO" --env production --body "$PRODUCTION_USER"
gh secret set PRODUCTION_SSH_KEY -R "$REPO" --env production < "$PRODUCTION_SSH_KEY_FILE"

# -----------------------------------------------------------------------------
# 4) Branch protection — main (estrita)
# -----------------------------------------------------------------------------
echo "==> Branch protection: main"
gh api -X PUT "repos/$REPO/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint, type-check & build"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "required_conversation_resolution": true
}
JSON

# -----------------------------------------------------------------------------
# 5) Branch protection — staging (mais leve)
# -----------------------------------------------------------------------------
echo "==> Branch protection: staging"
gh api -X PUT "repos/$REPO/branches/staging/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint, type-check & build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

echo
echo "✅ Setup do GitHub concluído."
echo "Lembre-se: a branch 'staging' precisa existir antes da branch protection ser aplicada."
