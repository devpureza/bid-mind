// Construção do app Fastify. Exportado isolado de `index.ts` para facilitar
// testes (cada teste sobe a instância sem `listen`).

import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";

import { config } from "./config.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { oauthGoogleRoutes } from "./routes/oauth-google.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
      transport:
        config.NODE_ENV === "production"
          ? undefined
          : {
              target: "pino-pretty",
              options: { translateTime: "HH:MM:ss Z", colorize: true, ignore: "pid,hostname" },
            },
    },
  });

  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: [config.APP_URL],
    credentials: true,
  });

  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(oauthGoogleRoutes, { prefix: "/auth" });

  app.setErrorHandler((err: FastifyError, req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: "validação", issues: err.flatten() });
    }
    req.log.error({ err }, "request error");
    const statusCode = err.statusCode ?? 500;
    if (statusCode < 500) {
      return reply.status(statusCode).send({ error: err.message });
    }
    return reply.status(500).send({ error: "Internal Server Error" });
  });

  return app;
}
