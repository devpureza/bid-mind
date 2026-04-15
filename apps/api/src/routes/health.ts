// Healthcheck simples — usado pelo Docker e Nginx upstream.

import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "ok",
    service: "bidmind-api",
    timestamp: new Date().toISOString(),
  }));
}
