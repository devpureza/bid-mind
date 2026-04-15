import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-server";
import { setAuthCookies } from "@/lib/cookies";

export async function POST(req: Request) {
  const body = await req.json();
  const { ok, status, data } = await apiFetch("/auth/login", { method: "POST", body });
  if (!ok) return NextResponse.json(data ?? { error: "falha no login" }, { status });

  const res = NextResponse.json({ user: data.user });
  setAuthCookies(res, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return res;
}
