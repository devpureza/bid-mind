// Callback de OAuth Google. O backend redireciona o navegador para
// `${APP_URL}/auth/google/callback?access_token=...&refresh_token=...`
// após a troca de código → token. Aqui pegamos os tokens da query,
// gravamos como cookies httpOnly e mandamos o usuário para o dashboard.
//
// Como é um route handler (GET), os tokens nunca entram no bundle JS do
// browser nem ficam acessíveis via `document.cookie`.

import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/cookies";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/login?error=oauth", url));
  }

  const redirectUrl = new URL("/dashboard", url);
  const res = NextResponse.redirect(redirectUrl);
  setAuthCookies(res, { accessToken, refreshToken });
  return res;
}
