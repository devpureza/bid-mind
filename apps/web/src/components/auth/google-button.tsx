"use client";

import { Button } from "@/components/ui/button";

// Quando OAuth Google está habilitado no backend, `/auth/google` (no backend)
// inicia o fluxo — fastify-oauth2 cuida do redirect.
export function GoogleButton({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        window.location.href = `${apiUrl}/auth/google`;
      }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.8h5.4c-.24 1.4-1.68 4.1-5.4 4.1-3.26 0-5.9-2.7-5.9-6s2.64-6 5.9-6c1.85 0 3.1.78 3.8 1.46l2.6-2.5C16.7 3.6 14.6 2.6 12 2.6 6.86 2.6 2.7 6.76 2.7 12S6.86 21.4 12 21.4c6.92 0 9.5-4.85 9.5-9.3 0-.63-.07-1.1-.15-1.5H12z"
        />
      </svg>
      Entrar com Google
    </Button>
  );
}
