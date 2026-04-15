#!/usr/bin/env bash
# =============================================================================
# BidMind — Provisionamento de VM (Ubuntu 24.04)
#
# Idempotente: pode ser rodado quantas vezes quiser. Instala/configura:
#   - Docker Engine + Docker Compose plugin
#   - Nginx
#   - Certbot (apenas em production)
#   - UFW (libera somente 22, 80, 443)
#   - Fail2ban
#   - Usuário `deploy` com chave autorizada
#   - Estrutura /opt/bidmind/{compose,nginx,scripts,data}
#
# Uso (na VM, como root):
#   ENVIRONMENT=staging  DEPLOY_PUBLIC_KEY="ssh-ed25519 ..." ./setup-vm.sh
#   ENVIRONMENT=production DEPLOY_PUBLIC_KEY="ssh-ed25519 ..." ./setup-vm.sh
# =============================================================================

set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:?defina ENVIRONMENT=staging|production}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PUBLIC_KEY="${DEPLOY_PUBLIC_KEY:?defina DEPLOY_PUBLIC_KEY (conteúdo da chave pública SSH)}"
APP_ROOT="/opt/bidmind"

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "ENVIRONMENT deve ser 'staging' ou 'production'" >&2
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Rode como root (sudo)." >&2
  exit 1
fi

log() { echo -e "\033[1;34m==>\033[0m $*"; }

# -----------------------------------------------------------------------------
log "Atualizando apt"
# -----------------------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# -----------------------------------------------------------------------------
log "Instalando pacotes base"
# -----------------------------------------------------------------------------
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg lsb-release ufw fail2ban nginx unattended-upgrades \
  software-properties-common

# -----------------------------------------------------------------------------
log "Instalando Docker Engine + Compose plugin"
# -----------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi

# -----------------------------------------------------------------------------
log "Criando usuário '$DEPLOY_USER' e autorizando chave SSH"
# -----------------------------------------------------------------------------
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

DEPLOY_HOME=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$DEPLOY_HOME/.ssh"
AUTH_KEYS="$DEPLOY_HOME/.ssh/authorized_keys"
touch "$AUTH_KEYS"
if ! grep -qF "$DEPLOY_PUBLIC_KEY" "$AUTH_KEYS"; then
  echo "$DEPLOY_PUBLIC_KEY" >> "$AUTH_KEYS"
fi
chown "$DEPLOY_USER:$DEPLOY_USER" "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"

# -----------------------------------------------------------------------------
log "Endurecendo SSH (sem root login, sem senha)"
# -----------------------------------------------------------------------------
SSHD_CONF=/etc/ssh/sshd_config.d/99-bidmind.conf
cat > "$SSHD_CONF" <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
EOF
systemctl reload ssh

# -----------------------------------------------------------------------------
log "Configurando UFW (22, 80, 443)"
# -----------------------------------------------------------------------------
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# -----------------------------------------------------------------------------
log "Configurando Fail2ban (sshd)"
# -----------------------------------------------------------------------------
cat > /etc/fail2ban/jail.d/bidmind.local <<'EOF'
[sshd]
enabled  = true
port     = ssh
maxretry = 5
findtime = 10m
bantime  = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

# -----------------------------------------------------------------------------
log "Estrutura de diretórios em $APP_ROOT"
# -----------------------------------------------------------------------------
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "$APP_ROOT" "$APP_ROOT/compose" "$APP_ROOT/nginx" "$APP_ROOT/scripts" \
  "$APP_ROOT/data" "$APP_ROOT/data/postgres" "$APP_ROOT/data/redis" \
  "$APP_ROOT/storage"

touch "$APP_ROOT/.env"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_ROOT/.env"
chmod 600 "$APP_ROOT/.env"

# -----------------------------------------------------------------------------
log "Configurando Nginx (placeholder — substituído pelo deploy)"
# -----------------------------------------------------------------------------
systemctl enable --now nginx

# -----------------------------------------------------------------------------
if [[ "$ENVIRONMENT" == "production" ]]; then
  log "Instalando Certbot (apenas produção)"
  apt-get install -y certbot python3-certbot-nginx
fi

# -----------------------------------------------------------------------------
log "Habilitando unattended-upgrades (security only)"
# -----------------------------------------------------------------------------
dpkg-reconfigure -f noninteractive unattended-upgrades

# -----------------------------------------------------------------------------
log "Concluído. Próximos passos:"
# -----------------------------------------------------------------------------
cat <<EOF

  1. Suba o repo deste app pra $APP_ROOT (compose, nginx, scripts) — o workflow
     deploy-${ENVIRONMENT}.yml pode fazer isso, ou rsync manual para o primeiro deploy.
  2. Preencha $APP_ROOT/.env (use .env.example como base).
  3. Em produção, rode:
        certbot --nginx -d bidmind.com.br -d www.bidmind.com.br
  4. Faça o deploy:
        cd $APP_ROOT && ENVIRONMENT=$ENVIRONMENT IMAGE_TAG=latest ./scripts/deploy.sh

EOF
