// Cliente Prisma compartilhado entre `apps/api` e `apps/workers`.
// Singleton para evitar múltiplas conexões em hot-reload.
//
// Observação sobre interop: @prisma/client é CJS e seus enums não são visíveis
// como named exports via Node ESM. Quem precisar dos enums (em runtime) deve
// usar literais string ("admin", "analista", etc.) — o Prisma valida igualmente.
// Os TIPOS são re-exportados aqui via `export type *`.

import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;

export type * from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: InstanceType<typeof PrismaClient>;
};

export const prisma: InstanceType<typeof PrismaClient> =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
