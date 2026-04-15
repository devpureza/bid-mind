import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-server";

export async function POST(req: Request) {
  const body = await req.json();
  const { ok, status, data } = await apiFetch("/auth/forgot-password", {
    method: "POST",
    body,
  });
  return NextResponse.json(data ?? { ok }, { status: ok ? 200 : status });
}
