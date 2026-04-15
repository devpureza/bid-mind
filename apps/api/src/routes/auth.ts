// Rotas de autenticação (RF-01 / AUTH-01)
//   POST /auth/register          — cria tenant + admin
//   POST /auth/login             — email + senha → access + refresh
//   POST /auth/refresh           — refresh → novo access
//   POST /auth/forgot-password   — gera token de reset
//   POST /auth/reset-password    — aplica token de reset
//   GET  /auth/me                — dados do usuário autenticado

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import crypto from "node:crypto";

import { prisma } from "@bidmind/db";
import { config } from "../config.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/tokens.js";

const RegisterSchema = z.object({
  tenantNome: z.string().min(2).max(255),
  nome: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(20),
});

const ForgotSchema = z.object({
  email: z.string().email(),
});

const ResetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

const RESET_TOKEN_TTL_MIN = 60;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function authRoutes(app: FastifyInstance) {
  // -------------------------------------------------------------------------
  app.post("/register", async (req, reply) => {
    const body = RegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.conflict("email já cadastrado");

    const passwordHash = await argon2.hash(body.password);

    const user = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { nome: body.tenantNome } });
      return tx.user.create({
        data: {
          tenantId: tenant.id,
          email: body.email,
          nome: body.nome,
          passwordHash,
          role: "admin",
        },
      });
    });

    const payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    return reply.status(201).send({
      user: { id: user.id, email: user.email, nome: user.nome, role: user.role, tenantId: user.tenantId },
      accessToken: signAccessToken(app, payload),
      refreshToken: signRefreshToken(app, payload),
    });
  });

  // -------------------------------------------------------------------------
  app.post("/login", async (req, reply) => {
    const body = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash) return reply.unauthorized("credenciais inválidas");

    const valid = await argon2.verify(user.passwordHash, body.password);
    if (!valid) return reply.unauthorized("credenciais inválidas");

    const payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    return reply.send({
      user: { id: user.id, email: user.email, nome: user.nome, role: user.role, tenantId: user.tenantId },
      accessToken: signAccessToken(app, payload),
      refreshToken: signRefreshToken(app, payload),
    });
  });

  // -------------------------------------------------------------------------
  app.post("/refresh", async (req, reply) => {
    const { refreshToken } = RefreshSchema.parse(req.body);

    let decoded;
    try {
      decoded = verifyRefreshToken(app, refreshToken);
    } catch {
      return reply.unauthorized("refresh token inválido ou expirado");
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) return reply.unauthorized("usuário inexistente");

    const payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    return reply.send({
      accessToken: signAccessToken(app, payload),
      refreshToken: signRefreshToken(app, payload),
    });
  });

  // -------------------------------------------------------------------------
  app.post("/forgot-password", async (req, reply) => {
    const { email } = ForgotSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    // Resposta sempre genérica — não vazar existência de e-mail.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60_000),
        },
      });
      // TODO(AUTH-02 / e-mail): disparar e-mail com link contendo o token.
      // Por enquanto, em dev, devolvemos no log para o teste manual.
      if (config.NODE_ENV !== "production") {
        req.log.info({ email, resetToken: token }, "[dev] reset token gerado");
      }
    }
    return reply.send({ ok: true });
  });

  // -------------------------------------------------------------------------
  app.post("/reset-password", async (req, reply) => {
    const { token, password } = ResetSchema.parse(req.body);

    const tokenHash = hashToken(token);
    const reset = await prisma.passwordReset.findUnique({ where: { tokenHash } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return reply.unauthorized("token inválido ou expirado");
    }

    const passwordHash = await argon2.hash(password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    ]);

    return reply.send({ ok: true });
  });

  // -------------------------------------------------------------------------
  app.get("/me", { preHandler: app.authenticate }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, nome: true, role: true, tenantId: true, createdAt: true },
    });
    if (!user) return reply.unauthorized();
    return reply.send({ user });
  });
}
