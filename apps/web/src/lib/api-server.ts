// Fetch server-side para a API Fastify. Uso interno das route handlers
// (/api/auth/*) e de server components/actions.

import { serverEnv } from "./env";

type JsonBody = Record<string, unknown> | undefined;

export async function apiFetch(
  path: string,
  init: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: JsonBody;
    token?: string;
  } = {},
) {
  const url = `${serverEnv.API_URL}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  return { ok: res.ok, status: res.status, data };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
