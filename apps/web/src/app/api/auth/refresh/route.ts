import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { apiFetch } from "@/lib/api-server";
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "@/lib/cookies";

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.json({ error: "sem sessão" }, { status: 401 });

  const { ok, status, data } = await apiFetch("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  if (!ok) {
    const res = NextResponse.json(data ?? { error: "refresh inválido" }, { status });
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return res;
}
