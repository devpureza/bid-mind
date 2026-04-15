// Helpers para os cookies httpOnly de sessão.
// Dois cookies, ambos httpOnly:
//   bm_access  — access token JWT (TTL curto, ~15min)
//   bm_refresh — refresh token JWT (TTL longo, ~7d)
// O frontend NUNCA lê esses cookies via JS; quem usa é o route handler
// no Next.js, que repassa o access para a API real.

import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "bm_access";
export const REFRESH_COOKIE = "bm_refresh";

// Espelha JWT_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN do backend (em segundos).
// Valores conservadores; o refresh token permanece válido por 7 dias.
const FIFTEEN_MIN = 60 * 15;
const SEVEN_DAYS = 60 * 60 * 24 * 7;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export function setAuthCookies(res: NextResponse, tokens: AuthTokens) {
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...common,
    maxAge: FIFTEEN_MIN,
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...common,
    maxAge: SEVEN_DAYS,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
}
