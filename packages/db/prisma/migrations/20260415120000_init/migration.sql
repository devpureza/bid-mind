-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'analista');

-- CreateEnum
CREATE TYPE "LicitacaoStatus" AS ENUM ('aguardando_edital', 'analisando_edital', 'elaborando_proposta_tecnica', 'montando_orcamento', 'revisao_humana', 'concluido');

-- CreateEnum
CREATE TYPE "ArquivoTipo" AS ENUM ('edital', 'proposta_tecnica', 'orcamento', 'template');

-- CreateEnum
CREATE TYPE "AgenteStatus" AS ENUM ('running', 'success', 'error');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "plano" VARCHAR(50) NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'analista',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licitacoes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "titulo" VARCHAR(500) NOT NULL,
    "orgao_licitante" VARCHAR(500),
    "prazo_proposta" TIMESTAMP(3),
    "status" "LicitacaoStatus" NOT NULL DEFAULT 'aguardando_edital',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "licitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "licitacao_id" UUID,
    "tipo" "ArquivoTipo" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "nome_original" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licitacao_contexto" (
    "id" UUID NOT NULL,
    "licitacao_id" UUID NOT NULL,
    "edital_estruturado" JSONB,
    "proposta_tecnica" JSONB,
    "orcamento" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licitacao_contexto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agente_logs" (
    "id" UUID NOT NULL,
    "licitacao_id" UUID NOT NULL,
    "agente" SMALLINT NOT NULL,
    "status" "AgenteStatus" NOT NULL,
    "prompt" TEXT,
    "resposta" TEXT,
    "duracao_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agente_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

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

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_licitacao_id_fkey" FOREIGN KEY ("licitacao_id") REFERENCES "licitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacao_contexto" ADD CONSTRAINT "licitacao_contexto_licitacao_id_fkey" FOREIGN KEY ("licitacao_id") REFERENCES "licitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agente_logs" ADD CONSTRAINT "agente_logs_licitacao_id_fkey" FOREIGN KEY ("licitacao_id") REFERENCES "licitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

