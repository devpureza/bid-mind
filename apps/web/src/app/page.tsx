import { redirect } from "next/navigation";

export default function RootPage() {
  // Landing ainda não existe no escopo v1 (DESIGN.mnd §5 entra direto no Kanban).
  // Manda para /dashboard — o middleware redireciona para /login se não houver sessão.
  redirect("/dashboard");
}
