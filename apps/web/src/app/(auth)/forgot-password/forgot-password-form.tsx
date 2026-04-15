"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { ApiError, clientFetch } from "@/lib/api-client";

const Schema = z.object({ email: z.string().email("E-mail inválido") });
type FormData = z.infer<typeof Schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await clientFetch("/api/auth/forgot-password", { method: "POST", body: data });
      setSent(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Erro inesperado");
    }
  });

  if (sent) {
    return (
      <p className="rounded-md bg-muted px-4 py-3 text-sm">
        Se o e-mail estiver cadastrado, você receberá um link em instantes.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
