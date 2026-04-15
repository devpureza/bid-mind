// OAuth com Google. Só registra quando GOOGLE_OAUTH_CLIENT_ID/SECRET estiverem
// presentes — ambiente de dev sem credenciais simplesmente não expõe as rotas.

import type { FastifyInstance } from "fastify";
import oauthPlugin from "@fastify/oauth2";
import type { OAuth2Namespace } from "@fastify/oauth2";

// Endpoints OIDC do Google (https://accounts.google.com/.well-known/openid-configuration).
// Inline para evitar depender da const exportada em formato CJS.
const GOOGLE_OIDC = {
  authorizeHost: "https://accounts.google.com",
  authorizePath: "/o/oauth2/v2/auth",
  tokenHost: "https://oauth2.googleapis.com",
  tokenPath: "/token",
};

import { prisma } from "@bidmind/db";
import { config, isGoogleOAuthEnabled } from "../config.js";
import { signAccessToken, signRefreshToken } from "../services/tokens.js";

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2?: OAuth2Namespace;
  }
}

export async function oauthGoogleRoutes(app: FastifyInstance) {
  if (!isGoogleOAuthEnabled) {
    app.log.warn("OAuth Google desabilitado (faltam GOOGLE_OAUTH_CLIENT_ID/SECRET).");
    return;
  }

  await app.register(oauthPlugin, {
    name: "googleOAuth2",
    scope: ["openid", "email", "profile"],
    credentials: {
      client: {
        id: config.GOOGLE_OAUTH_CLIENT_ID!,
        secret: config.GOOGLE_OAUTH_CLIENT_SECRET!,
      },
      auth: GOOGLE_OIDC,
    },
    startRedirectPath: "/google",
    callbackUri: config.GOOGLE_OAUTH_REDIRECT_URI,
  });

  app.get("/google/callback", async (req, reply) => {
    const tokenResp = await app.googleOAuth2!.getAccessTokenFromAuthorizationCodeFlow(req);

    const profileResp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenResp.token.access_token}` },
    });
    if (!profileResp.ok) return reply.unauthorized("falha ao obter perfil Google");

    const profile = (await profileResp.json()) as {
      sub: string;
      email: string;
      name?: string;
      email_verified?: boolean;
    };
    if (!profile.email_verified) return reply.unauthorized("e-mail não verificado no Google");

    // Vincula ou cria usuário/tenant.
    let oauth = await prisma.oauthAccount.findUnique({
      where: { provider_providerUserId: { provider: "google", providerUserId: profile.sub } },
      include: { user: true },
    });

    let user = oauth?.user ?? (await prisma.user.findUnique({ where: { email: profile.email } }));

    if (!user) {
      // Primeiro login Google — cria tenant solo (RF-01)
      user = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({ data: { nome: profile.name ?? profile.email } });
        return tx.user.create({
          data: {
            tenantId: tenant.id,
            email: profile.email,
            nome: profile.name,
            role: "admin",
          },
        });
      });
    }

    if (!oauth) {
      await prisma.oauthAccount.create({
        data: { userId: user.id, provider: "google", providerUserId: profile.sub },
      });
    }

    const payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    const accessToken = signAccessToken(app, payload);
    const refreshToken = signRefreshToken(app, payload);

    // Redireciona o frontend com tokens via query string (AUTH-02 vai consumir).
    const url = new URL("/auth/google/callback", config.APP_URL);
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("refresh_token", refreshToken);
    return reply.redirect(url.toString());
  });
}
