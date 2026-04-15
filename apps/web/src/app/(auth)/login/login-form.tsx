"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { ApiError, clientFetch } from "@/lib/api-client";
import { useState } from "react";

const Schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
type FormData = z.infer<typeof Schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") ?? "/dashboard";
  const [serverError, setServerError] = useState<string | null>(
    params.get("error") === "oauth" ? "Falha no login com Google. Tente novamente." : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await clientFetch("/api/auth/login", { method: "POST", body: data });
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Erro inesperado");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>
      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
