# BidMind — Instruções para o Claude Code

## Sobre o projeto

**BidMind** é uma plataforma SaaS multi-tenant que automatiza a elaboração de propostas para licitações públicas por meio de 3 agentes de IA sequenciais:

1. **Agente 1** — Analista de Edital (extrai estrutura JSON do edital)
2. **Agente 2** — Redator de Proposta Técnica (gera DOCX seguindo template)
3. **Agente 3** — Montador de Orçamento (gera XLSX com BDI/encargos)

Fluxo: `Upload edital → Agente 1 → Agente 2 → Agente 3 → Revisão humana → Exportação`.

## Documentos de referência (LEIA SEMPRE ANTES DE QUALQUER TAREFA)

- **REQUIREMENTS.mnd** — O que o app faz e não faz (RF-01 a RF-10, RNF-01 a RNF-08, escopo v1)
- **DESIGN.mnd** — Stack, arquitetura, schema do banco, decisões técnicas
- **TASKS.mnd** — Lista de tarefas em ordem (Marcos 1 a 7)

## Regras de trabalho

- **Siga EXATAMENTE o que está nos documentos.** Nada fora deles.
- **Não adicione funcionalidade** que não esteja nos requisitos.
- **Não mude a stack** definida no DESIGN.mnd.
- **Execute uma tarefa por vez**, seguindo a ordem do TASKS.mnd.
- **Marque sub-tarefas como concluídas** (`[x]`) no TASKS.mnd ao terminar.
- Nunca pule de marco sem terminar o anterior.
- Quando algo no documento estiver ambíguo, pergunte antes de decidir sozinho.

## Idioma

- **Toda comunicação com o usuário em português brasileiro.**
- **Código, nomes de variáveis, commits e mensagens técnicas em inglês** (padrão da indústria), exceto:
  - Termos de domínio do negócio (`licitacao`, `edital`, `orcamento`, `proposta_tecnica`, `tenant`) seguem o schema do DESIGN.mnd.
  - Textos de UI (labels, mensagens, toasts) em pt-BR.

## Stack (resumo — fonte de verdade é DESIGN.mnd §7)

- **Monorepo:** Turborepo (`apps/web`, `apps/api`, `apps/workers`, `packages/types`, `packages/config`)
- **Frontend:** Next.js 14+ (App Router) + Tailwind + shadcn/ui + Zustand + TanStack Query
- **Backend:** Fastify + Prisma + BullMQ + Zod
- **IA:** OpenAI API (gpt-4o-mini — modelo de baixo custo para MVP/testes; configurável via `OPENAI_MODEL`) + LlamaIndex + Unstructured.io
- **Dados:** PostgreSQL 16 + pgvector, Redis 7, Cloudflare R2
- **Infra:** Docker Compose + Nginx + Certbot, GitHub Container Registry, GitHub Actions

## Estrutura do monorepo (alvo)

```
bidmind/
├── .github/workflows/      # ci.yml, deploy-staging.yml, deploy-production.yml
├── apps/
│   ├── web/                # Next.js
│   ├── api/                # Fastify
│   └── workers/            # Agentes (BullMQ consumers)
├── packages/
│   ├── types/              # Tipos TS compartilhados
│   └── config/             # tsconfig, eslint base
├── infra/
│   ├── docker/
│   ├── nginx/
│   └── scripts/
└── docs/spec/
```

## Convenções

- **Branches:** `feat/nome`, `fix/nome`, `chore/nome`, `hotfix/nome`
- **Tags Docker:** `latest`, `previous`, `staging`, `sha-<commit>`
- **`main` é protegida:** PR obrigatório + Actions verdes, sem bypass.
- **Commits:** mensagem em inglês, modo imperativo curto.

## Ambiente de desenvolvimento

- Sistema: Windows 11 (shell bash via Git Bash / WSL — usar sintaxe Unix)
- Diretório raiz do projeto: `C:\Users\Pureza e-plugin\bid-mind\`
- Não é repositório git ainda — INFRA-01 cria.
