import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { apiFetch } from "@/lib/api-server";
import { ACCESS_COOKIE } from "@/lib/cookies";

export async function GET() {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return NextResponse.json({ error: "sem sessão" }, { status: 401 });

  const { ok, status, data } = await apiFetch("/auth/me", { token: accessToken });
  return NextResponse.json(data ?? { error: "falha" }, { status: ok ? 200 : status });
}
