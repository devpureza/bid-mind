import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-server";
import { setAuthCookies } from "@/lib/cookies";

export async function POST(req: Request) {
  const body = await req.json();
  const { ok, status, data } = await apiFetch("/auth/register", { method: "POST", body });
  if (!ok) return NextResponse.json(data ?? { error: "falha no cadastro" }, { status });

  const res = NextResponse.json({ user: data.user }, { status: 201 });
  setAuthCookies(res, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return res;
}
