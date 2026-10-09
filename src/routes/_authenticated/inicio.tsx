import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useRole, useSession } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Início · Eduarda Nunes Veterinária" }] }),
  component: Inicio,
});

function Inicio() {
  const { user } = useSession();
  const { data: role } = useRole(user?.id);
  if (!role) return <p role="status">Carregando...</p>;
  return <Navigate to={role === "vet" ? "/agenda" : "/pets"} replace />;
}
