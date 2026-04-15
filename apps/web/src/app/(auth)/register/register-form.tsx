"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { ApiError, clientFetch } from "@/lib/api-client";

const Schema = z.object({
  tenantNome: z.string().min(2, "Informe o nome da empresa"),
  nome: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
});
type FormData = z.infer<typeof Schema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await clientFetch("/api/auth/register", { method: "POST", body: data });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Erro inesperado");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="tenantNome">Nome da empresa</Label>
        <Input id="tenantNome" {...register("tenantNome")} />
        <FieldError message={errors.tenantNome?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nome">Seu nome</Label>
        <Input id="nome" autoComplete="name" {...register("nome")} />
        <FieldError message={errors.nome?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>
      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
