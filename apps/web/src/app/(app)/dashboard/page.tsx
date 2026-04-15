// Stub de dashboard. O Kanban real é entregue em KANBAN-01 (Marco 2).
// Aqui provamos apenas que a sessão está ativa e que o /auth/me responde
// com o usuário correto, mostrando dados vindos do backend.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api-server";
import { ACCESS_COOKIE } from "@/lib/cookies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (!accessToken) redirect("/login");

  const { ok, data } = await apiFetch("/auth/me", { token: accessToken });
  if (!ok) redirect("/login");

  const user = data?.user ?? null;

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">BidMind</h1>
        <LogoutButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sessão ativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Olá, <strong>{user?.nome ?? user?.email}</strong>.
          </p>
          <p className="text-muted-foreground">Tenant: {user?.tenantId}</p>
          <p className="text-muted-foreground">Perfil: {user?.role}</p>
          <p className="pt-4 text-muted-foreground">
            O Kanban de licitações é entregue no Marco 2 (KANBAN-01).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
