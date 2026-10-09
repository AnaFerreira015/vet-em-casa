import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole, useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BrandMark, SiteFooter } from "@/components/brand";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AppShell,
});

const tutorNav = [
  { to: "/pets", label: "Meus pets" },
  { to: "/agendar", label: "Agendar" },
  { to: "/agendamentos", label: "Agendamentos" },
  { to: "/meus-dados", label: "Meus dados" },
] as const;

const vetNav = [
  { to: "/agenda", label: "Agenda" },
  { to: "/solicitacoes", label: "Solicitações" },
  { to: "/tutores", label: "Tutores e pets" },
] as const;

function AppShell() {
  const { user } = useSession();
  const { data: role } = useRole(user?.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const nav = role === "vet" ? vetNav : tutorNav;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3">
        Pular para o conteúdo
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/inicio" aria-label="Página inicial do app" className="min-w-0">
            <BrandMark />
          </Link>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut aria-hidden="true" /> Sair
          </Button>
        </div>
        {role && (
          <nav aria-label="Menu principal" className="mx-auto max-w-5xl overflow-x-auto px-2 pb-2">
            <ul className="flex gap-2">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 font-semibold text-foreground hover:bg-accent"
                    activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary", "aria-current": "page" }}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
