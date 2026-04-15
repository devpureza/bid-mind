# VM — Provisionamento e primeiro deploy (INFRA-03)

Tudo o que **vive em arquivo** já está no repo. O que segue depende de ter uma KVM
provisionada (Ubuntu 24.04). Faça quando as KVMs estiverem prontas.

## 0) Pré-requisitos

- KVM Staging: Ubuntu 24.04, 2 vCPU / 4 GB RAM, IP público, domínio `staging.bidmind.com.br` apontado.
- KVM Produção: Ubuntu 24.04, 4 vCPU / 8 GB RAM, IP público, `bidmind.com.br` + `www.bidmind.com.br` apontados.
- Acesso SSH inicial como `root` (ou usuário com sudo) — usado **só** para o primeiro setup.

---

## 1) Gerar chaves SSH de deploy (na sua máquina)

```bash
./infra/scripts/gen-deploy-keys.sh
# Cria .deploy-keys/bidmind_{staging,production}{,.pub}
```

A pasta `.deploy-keys/` está no `.gitignore`.

---

## 2) Provisionar cada VM

Copie `infra/scripts/setup-vm.sh` para a VM e execute:

```bash
# Da sua máquina:
scp infra/scripts/setup-vm.sh root@<IP_STAGING>:/root/setup-vm.sh

# Na VM (root):
ENVIRONMENT=staging \
DEPLOY_PUBLIC_KEY="$(cat ~/.ssh/bidmind_staging.pub)" \
bash /root/setup-vm.sh
```

Mesmo procedimento para production.

O script é **idempotente**: pode ser rodado de novo sem quebrar nada.

---

## 3) Configurar `.env` em cada VM

```bash
ssh deploy@<IP_STAGING>
cd /opt/bidmind
nano .env   # use .env.example do repo como base; preencher segredos reais
```

Lembre de gerar `JWT_SECRET` longo (>= 64 chars) e configurar `DATABASE_URL`,
`REDIS_URL`, `OPENAI_API_KEY` etc.

---

## 4) Primeiro deploy manual (Staging)

Antes de habilitar o workflow automático, faça um deploy manual para validar:

```bash
# Da sua máquina:
rsync -az --delete infra/docker/  deploy@<IP_STAGING>:/opt/bidmind/compose/
rsync -az --delete infra/nginx/   deploy@<IP_STAGING>:/opt/bidmind/nginx/
rsync -az --delete infra/scripts/ deploy@<IP_STAGING>:/opt/bidmind/scripts/

# Na VM:
ssh deploy@<IP_STAGING>
cd /opt/bidmind
chmod +x scripts/*.sh

# Login no GHCR (PAT com read:packages)
echo $GHCR_PAT | docker login ghcr.io -u devpureza --password-stdin

ENVIRONMENT=staging IMAGE_TAG=staging ./scripts/deploy.sh
```

Verifique:
```bash
docker compose -f compose/docker-compose.staging.yml ps
curl -sI http://127.0.0.1:3000   # web
curl -sI http://127.0.0.1:3001/health  # api
```

---

## 5) Habilitar Nginx no host

```bash
sudo cp /opt/bidmind/nginx/staging.conf /etc/nginx/sites-available/bidmind
sudo ln -sf /etc/nginx/sites-available/bidmind /etc/nginx/sites-enabled/bidmind
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Para produção:
```bash
sudo cp /opt/bidmind/nginx/production.conf /etc/nginx/sites-available/bidmind
sudo ln -sf /etc/nginx/sites-available/bidmind /etc/nginx/sites-enabled/bidmind
sudo certbot --nginx -d bidmind.com.br -d www.bidmind.com.br
```

---

## 6) Cadastrar secrets no GitHub

Voltar para `docs/spec/github-setup.md` agora que você tem os IPs e as chaves
privadas. Use `infra/scripts/github-setup.sh`.

---

## 7) Testar deploy automático

Faça um commit qualquer na branch `staging` e veja o workflow `Deploy · Staging`
rodar. O workflow vai:

1. Buildar e dar push das 3 imagens (`web`/`api`/`workers`) para `ghcr.io/devpureza/bidmind-*:staging` e `:sha-<commit>`.
2. Sincronizar `infra/docker/`, `infra/nginx/`, `infra/scripts/` para a VM.
3. Rodar `deploy.sh` na VM (pull, up, migrate quando INFRA-04 estiver pronto, prune).

---

## 8) Rollback manual (RNF-07)

Em caso de problema em produção:

```bash
ssh deploy@<IP_PRODUCTION>
cd /opt/bidmind
ENVIRONMENT=production ./scripts/rollback.sh
# (volta para a tag :previous, que foi promovida automaticamente no último deploy)
```

Tempo esperado: < 5 min.

---

## Checklist final

- [ ] KVM staging provisionada
- [ ] KVM production provisionada
- [ ] `setup-vm.sh` rodado em ambas
- [ ] Chaves SSH de deploy criadas e instaladas
- [ ] `.env` preenchido em cada VM
- [ ] Primeiro deploy manual em staging passou
- [ ] Nginx ativo e respondendo (staging via HTTP, production via HTTPS)
- [ ] Certbot configurado em production
- [ ] Secrets cadastrados no GitHub (ver `github-setup.md`)
- [ ] Deploy automático testado (push em `staging` → site atualiza)
- [ ] Rollback testado em staging
