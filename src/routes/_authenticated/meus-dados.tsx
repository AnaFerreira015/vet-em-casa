import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { deleteMyAccount } from "@/lib/account.functions";
import { fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/meus-dados")({
  head: () => ({ meta: [{ title: "Meus dados · Eduarda Nunes Veterinária" }] }),
  component: MeusDados,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome").max(120),
  phone: z.string().trim().max(30),
  address: z.string().trim().max(200),
  neighborhood: z.string().trim().max(100),
  city: z.string().trim().max(100),
  zip: z.string().trim().max(12),
  emergency_contact: z.string().trim().max(150),
});

const fields: [keyof z.infer<typeof schema>, string, string?][] = [
  ["full_name", "Nome completo", "name"],
  ["phone", "Telefone (WhatsApp)", "tel"],
  ["address", "Endereço (rua, número, complemento)", "street-address"],
  ["neighborhood", "Bairro"],
  ["city", "Cidade", "address-level2"],
  ["zip", "CEP", "postal-code"],
  ["emergency_contact", "Contato de emergência (nome e telefone)"],
];

function MeusDados() {
  const { user } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const del = useServerFn(deleteMyAccount);
  const [busy, setBusy] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: accessAt, refetch: refetchAccess } = useQuery({
    queryKey: ["home-access-at", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("my_home_access_updated_at");
      return data ?? null;
    },
  });

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos"); return; }
    const row = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v || null])) as Record<string, string | null>;
    const { error } = await supabase.from("profiles").update({ ...row, full_name: parsed.data.full_name }).eq("id", user!.id);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Dados salvos!");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function clearAccess() {
    if (!confirm("Apagar código do alarme, local da chave e instruções de acesso?")) return;
    const { error } = await supabase.rpc("clear_home_access");
    if (error) { toast.error("Não foi possível apagar."); return; }
    toast.success("Dados de acesso apagados.");
    refetchAccess();
  }

  async function exportData() {
    const uid = user!.id;
    const [p, pets, appts] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase.from("pets").select("*").eq("tutor_id", uid),
      supabase.from("appointments").select("*, pet_sitting_details(*)").eq("tutor_id", uid),
    ]);
    const blob = new Blob(
      [JSON.stringify({ exportado_em: new Date().toISOString(), email: user!.email, perfil: p.data, pets: pets.data, agendamentos: appts.data }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meus-dados.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function deleteAccount() {
    if (!confirm("Excluir sua conta apaga todos os seus dados, pets e agendamentos. Isso não pode ser desfeito. Continuar?")) return;
    setBusy(true);
    try {
      await del();
      qc.clear();
      await supabase.auth.signOut();
      toast.success("Conta excluída.");
      navigate({ to: "/", replace: true });
    } catch {
      toast.error("Não foi possível excluir a conta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle sub="Seu endereço é usado para a Dra. chegar até sua casa.">Meus dados</PageTitle>
      {profile && (
        <form onSubmit={save} className="space-y-4 rounded-3xl bg-card p-5 shadow-sm sm:p-8">
          <p className="text-muted-foreground">E-mail: <strong className="text-foreground">{user?.email}</strong></p>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([k, label, ac]) => (
              <div key={k} className={k === "address" || k === "emergency_contact" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
                <Label htmlFor={k}>{label}</Label>
                <Input id={k} name={k} autoComplete={ac} defaultValue={profile[k] ?? ""} className="h-12 text-base" />
              </div>
            ))}
          </div>
          <Button type="submit" size="lg">Salvar dados</Button>
        </form>
      )}

      <section aria-labelledby="acesso" className="mt-6 rounded-3xl bg-card p-5 shadow-sm sm:p-8">
        <h2 id="acesso" className="text-2xl font-bold text-primary">Acesso à casa</h2>
        {accessAt ? (
          <>
            <p className="mt-2">Há dados de acesso salvos (atualizados em {fmtDateTime(accessAt)}). Apenas a Dra. Eduarda pode vê-los.</p>
            <Button variant="destructive" className="mt-3" onClick={clearAccess}>Apagar dados de acesso</Button>
          </>
        ) : (
          <p className="mt-2 text-muted-foreground">Nenhum dado de acesso salvo.</p>
        )}
      </section>

      <section aria-labelledby="privacidade" className="mt-6 rounded-3xl bg-card p-5 shadow-sm sm:p-8">
        <h2 id="privacidade" className="text-2xl font-bold text-primary">Privacidade (LGPD)</h2>
        {profile?.lgpd_consent_at && <p className="mt-2">Consentimento aceito em {fmtDateTime(profile.lgpd_consent_at)}.</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportData}>Exportar meus dados</Button>
          <Button variant="destructive" onClick={deleteAccount} disabled={busy}>{busy ? "Excluindo..." : "Excluir minha conta"}</Button>
        </div>
      </section>
    </>
  );
}
