// Fetch client-side. Conversa apenas com as route handlers do próprio Next
// (/api/auth/*) — a API real só é acessada pelo servidor, nunca pelo browser.

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function clientFetch<T = unknown>(
  path: string,
  init: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: Record<string, unknown>;
  } = {},
): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : undefined) ?? `Erro ${res.status}`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
