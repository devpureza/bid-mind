-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "plano" TEXT NOT NULL DEFAULT 'free',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'analista',
    "password_hash" TEXT,
    "nome" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "licitacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "orgao_licitante" TEXT,
    "prazo_proposta" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'aguardando_edital',
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "licitacoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "licitacoes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "arquivos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "licitacao_id" TEXT,
    "tipo" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "arquivos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "arquivos_licitacao_id_fkey" FOREIGN KEY ("licitacao_id") REFERENCES "licitacoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "licitacao_contexto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licitacao_id" TEXT NOT NULL,
    "edital_estruturado" JSONB,
    "proposta_tecnica" JSONB,
    "orcamento" JSONB,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "licitacao_contexto_licitacao_id_fkey" FOREIGN KEY ("licitacao_id") REFERENCES "licitacoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agente_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licitacao_id" TEXT NOT NULL,
    "agente" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "prompt" TEXT,
    "resposta" TEXT,
    "duracao_ms" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agente_logs_licitacao_id_fkey" FOREIGN KEY ("licitacao_id") REFERENCES "licitacoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_hash_key" ON "password_resets"("token_hash");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_user_id_key" ON "oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "licitacoes_tenant_id_status_idx" ON "licitacoes"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "licitacoes_prazo_proposta_idx" ON "licitacoes"("prazo_proposta");

-- CreateIndex
CREATE INDEX "arquivos_tenant_id_tipo_idx" ON "arquivos"("tenant_id", "tipo");

-- CreateIndex
CREATE INDEX "arquivos_licitacao_id_idx" ON "arquivos"("licitacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "licitacao_contexto_licitacao_id_key" ON "licitacao_contexto"("licitacao_id");

-- CreateIndex
CREATE INDEX "agente_logs_licitacao_id_agente_created_at_idx" ON "agente_logs"("licitacao_id", "agente", "created_at");
