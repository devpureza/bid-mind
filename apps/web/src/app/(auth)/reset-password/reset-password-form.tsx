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

const Schema = z
  .object({
    password: z.string().min(8, "Mínimo de 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  });
type FormData = z.infer<typeof Schema>;

export function ResetPasswordForm({ token }: { token: string }) {
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
      await clientFetch("/api/auth/reset-password", {
        method: "POST",
        body: { token, password: data.password },
      });
      router.push("/login?reset=ok");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Erro inesperado");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          {...register("confirm")}
        />
        <FieldError message={errors.confirm?.message} />
      </div>
      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
