import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link inválido</CardTitle>
          <CardDescription>Solicite um novo link de redefinição de senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-primary hover:underline">
            Voltar para recuperar senha
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
