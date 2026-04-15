// =============================================================================
// BidMind — Seed para ambiente de desenvolvimento
// Cria 1 tenant + 1 admin + 1 analista + 1 licitação exemplo.
// Roda com: pnpm --filter @bidmind/db db:seed
// =============================================================================

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const DEV_PASSWORD = "bidmind123";

async function main() {
  console.info("[seed] iniciando…");

  const tenant = await prisma.tenant.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      nome: "Empresa Exemplo Ltda",
      plano: "free",
    },
  });
  console.info(`[seed] tenant: ${tenant.nome}`);

  const passwordHash = await argon2.hash(DEV_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bidmind.local" },
    update: { passwordHash, nome: "Admin Dev" },
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      tenantId: tenant.id,
      email: "admin@bidmind.local",
      nome: "Admin Dev",
      role: "admin",
      passwordHash,
    },
  });

  const analista = await prisma.user.upsert({
    where: { email: "analista@bidmind.local" },
    update: { passwordHash, nome: "Analista Dev" },
    create: {
      id: "00000000-0000-0000-0000-000000000011",
      tenantId: tenant.id,
      email: "analista@bidmind.local",
      nome: "Analista Dev",
      role: "analista",
      passwordHash,
    },
  });
  console.info(`[seed] usuários: ${admin.email}, ${analista.email}  (senha: ${DEV_PASSWORD})`);

  const licitacao = await prisma.licitacao.upsert({
    where: { id: "00000000-0000-0000-0000-000000000100" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000100",
      tenantId: tenant.id,
      titulo: "Pregão Eletrônico 001/2026 — Serviços de Consultoria",
      orgaoLicitante: "Prefeitura Municipal de Exemplo",
      prazoProposta: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // +14 dias
      status: "aguardando_edital",
      createdById: admin.id,
    },
  });
  console.info(`[seed] licitação: ${licitacao.titulo}`);

  await prisma.licitacaoContexto.upsert({
    where: { licitacaoId: licitacao.id },
    update: {},
    create: {
      licitacaoId: licitacao.id,
    },
  });

  console.info("[seed] OK");
}

main()
  .catch((err) => {
    console.error("[seed] erro:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
