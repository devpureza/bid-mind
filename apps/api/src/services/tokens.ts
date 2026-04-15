// Helpers de emissão/verificação de tokens.
// Access: usa @fastify/jwt (expira conforme JWT_EXPIRES_IN).
// Refresh: usa o mesmo segredo mas com type=refresh e expiração maior.

import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import type { AuthTokenPayload } from "../plugins/auth.js";

export function signAccessToken(app: FastifyInstance, payload: Omit<AuthTokenPayload, "type">) {
  return app.jwt.sign({ ...payload, type: "access" });
}

export function signRefreshToken(app: FastifyInstance, payload: Omit<AuthTokenPayload, "type">) {
  return app.jwt.sign({ ...payload, type: "refresh" }, { expiresIn: config.JWT_REFRESH_EXPIRES_IN });
}

export function verifyRefreshToken(app: FastifyInstance, token: string): AuthTokenPayload {
  const decoded = app.jwt.verify<AuthTokenPayload>(token);
  if (decoded.type !== "refresh") {
    throw new Error("token não é refresh");
  }
  return decoded;
}
