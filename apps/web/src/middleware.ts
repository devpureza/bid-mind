// Protege rotas do app logado. Não valida o JWT aqui (edge runtime não tem
// acesso ao secret do backend com segurança); apenas verifica presença de
// um dos cookies de sessão. A validação forte é feita na API ao chamar
// `/auth/me` no server component do dashboard. Se o access token estiver
// expirado e o refresh ainda válido, o client pode chamar `/api/auth/refresh`.

import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookies";

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession =
    !!req.cookies.get(ACCESS_COOKIE)?.value || !!req.cookies.get(REFRESH_COOKIE)?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Exclui assets estáticos do Next e as rotas internas de API/auth callback,
  // que precisam continuar respondendo livremente.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|auth/google).*)"],
};
