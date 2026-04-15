// Plugin de autenticação JWT.
// - Registra @fastify/jwt para emissão/verificação de tokens
// - Expõe app.authenticate (preHandler) que rejeita 401 quando não autenticado
// - Tipa request.user com { sub, tenantId, role }

import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { config } from "../config.js";
import type { UserRole } from "@bidmind/types";

export interface AuthTokenPayload {
  sub: string; // user id
  tenantId: string;
  role: UserRole;
  type?: "access" | "refresh";
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: config.JWT_EXPIRES_IN },
  });

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
      if (req.user.type && req.user.type !== "access") {
        return reply.unauthorized("token type inválido");
      }
    } catch {
      return reply.unauthorized("token ausente ou inválido");
    }
  });
});
