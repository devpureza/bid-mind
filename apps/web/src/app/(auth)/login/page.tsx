import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta BidMind</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-md bg-muted" />}>
          <LoginForm />
        </Suspense>
        {googleEnabled ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>
            <GoogleButton enabled={googleEnabled} />
          </>
        ) : null}
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Esqueci minha senha
          </Link>
          <Link href="/register" className="text-primary hover:underline">
            Criar conta
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
