import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FullLogo } from "@/components/brand";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha · Eduarda Nunes Veterinária" },
      { name: "description", content: "Crie uma nova senha para sua conta." },
      { property: "og:title", content: "Nova senha · Eduarda Nunes Veterinária" },
      { property: "og:description", content: "Crie uma nova senha para sua conta." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) { toast.error("A senha precisa ter pelo menos 8 caracteres."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) { toast.error("Não foi possível alterar. O link pode ter expirado."); return; }
    toast.success("Senha alterada!");
    navigate({ to: "/inicio" });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <FullLogo className="w-36" />
      <h1 className="mt-6 text-center text-3xl font-bold text-primary">Criar nova senha</h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl bg-card p-6 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="pwd">Nova senha</Label>
          <Input id="pwd" type="password" autoComplete="new-password" className="h-12 text-base" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={8} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>Salvar senha</Button>
      </form>
    </main>
  );
}
