"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { clientFetch } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await clientFetch("/api/auth/logout", { method: "POST" });
        } finally {
          router.push("/login");
          router.refresh();
        }
      }}
    >
      {loading ? "Saindo..." : "Sair"}
    </Button>
  );
}
