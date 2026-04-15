# GitHub — Setup remoto (INFRA-02)

Esta página documenta a configuração que precisa ser feita **no GitHub** (não no código)
para INFRA-02 ficar 100% concluída.

Há **dois caminhos** equivalentes:
- **A.** Script automatizado via `gh` CLI — `infra/scripts/github-setup.sh`
- **B.** Manual via UI do GitHub — passos descritos abaixo

---

## A. Caminho automatizado

### Pré-requisitos

1. Instalar GitHub CLI: <https://cli.github.com/>
2. Autenticar:
   ```bash
   gh auth login
   ```
3. Ter as variáveis abaixo prontas (host das KVMs serão obtidos em **INFRA-03**;
   a key do registry pode ser um **PAT clássico** com escopo `write:packages`).

### Executar

```bash
export STAGING_HOST="..."
export STAGING_USER="deploy"
export STAGING_SSH_KEY_FILE="$HOME/.ssh/bidmind_staging"
export PRODUCTION_HOST="..."
export PRODUCTION_USER="deploy"
export PRODUCTION_SSH_KEY_FILE="$HOME/.ssh/bidmind_production"
export REGISTRY_USER="devpureza"
export REGISTRY_PASSWORD="ghp_xxx"   # PAT com write:packages
export OPENAI_API_KEY="sk-..."

chmod +x infra/scripts/github-setup.sh
./infra/scripts/github-setup.sh
```

> ⚠️ A branch `staging` precisa existir **antes** de aplicar a branch protection
> nela. Crie com `git checkout -b staging && git push -u origin staging`.

---

## B. Caminho manual (UI)

### 1. Environments

`Settings → Environments → New environment`

Criar dois: **`staging`** e **`production`**.

Em cada um:
- Adicionar os secrets correspondentes (ver tabela abaixo).
- (Opcional) Adicionar `Required reviewers` em `production` para aprovação manual antes do deploy.

### 2. Secrets

| Escopo | Nome | Valor |
|---|---|---|
| Repository | `REGISTRY_USER` | usuário do GHCR (geralmente o owner) |
| Repository | `REGISTRY_PASSWORD` | PAT com `write:packages` |
| Repository | `OPENAI_API_KEY` | chave da API OpenAI |
| Environment `staging` | `STAGING_HOST` | IP/host da VM staging |
| Environment `staging` | `STAGING_USER` | usuário SSH da VM staging |
| Environment `staging` | `STAGING_SSH_KEY` | conteúdo da chave privada SSH |
| Environment `production` | `PRODUCTION_HOST` | IP/host da VM produção |
| Environment `production` | `PRODUCTION_USER` | usuário SSH da VM produção |
| Environment `production` | `PRODUCTION_SSH_KEY` | conteúdo da chave privada SSH |

### 3. Branch protection — `main`

`Settings → Branches → Add rule` (ou Ruleset)

- Branch name pattern: `main`
- ✅ Require a pull request before merging
  - Required approving reviews: **1**
  - Dismiss stale pull request approvals when new commits are pushed
  - Require review from Code Owners
- ✅ Require status checks to pass before merging
  - Require branches to be up to date
  - Status checks required: **`Lint, type-check & build`**
- ✅ Require conversation resolution before merging
- ✅ Require linear history
- ✅ Do not allow bypassing the above settings (no bypass)
- ❌ Allow force pushes
- ❌ Allow deletions

### 4. Branch protection — `staging`

Mesma régua, porém:
- Required approving reviews: **1**
- ❌ Require review from Code Owners (mais leve)
- ❌ Enforce admins (devs podem destravar fluxos rápidos)

---

## Checklist final

- [ ] Environments `staging` e `production` criados
- [ ] Secrets `REGISTRY_*`, `OPENAI_API_KEY` no repo
- [ ] Secrets `STAGING_*` no environment staging
- [ ] Secrets `PRODUCTION_*` no environment production
- [ ] Branch protection na `main` aplicada e testada (PR de teste rejeitado sem checks verdes)
- [ ] Branch protection na `staging` aplicada
- [ ] `CODEOWNERS` reconhecido pelo GitHub (aparece como reviewer obrigatório nos PRs)
