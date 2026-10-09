import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { SERVICE_LABEL, localToIso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, PageTitle } from "@/components/ui-bits";

type Service = keyof typeof SERVICE_LABEL;

export const Route = createFileRoute("/_authenticated/agendar")({
  head: () => ({ meta: [{ title: "Agendar · Eduarda Nunes Veterinária" }] }),
  component: Agendar,
});

function Agendar() {
  const { user } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [service, setService] = useState<Service>("consulta");
  const [period, setPeriod] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: pets } = useQuery({
    queryKey: ["pets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("pets").select("*").eq("tutor_id", user!.id).order("name");
      if (error) throw error;
      return data;
    },
  });

  if (pets && !pets.length)
    return (
      <>
        <PageTitle>Agendar atendimento</PageTitle>
        <Empty>
          Primeiro cadastre um pet.{" "}
          <Link to="/pets" className="font-semibold text-primary underline">Ir para Meus pets</Link>
        </Empty>
      </>
    );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Partial<Record<"pet_id" | "starts_at" | "ends_at" | "tutor_notes" | "feeding_routine" | "medications" | "house_instructions" | "emergency_contact" | "alarm_code" | "key_location" | "access_instructions", string>>;
    if (!f.pet_id) return setError("Escolha o pet.");
    if (!f.starts_at) return setError("Escolha a data e o horário.");
    const starts = new Date(f.starts_at);
    if (starts < new Date()) return setError("Escolha uma data no futuro.");
    const isPS = service === "pet_sitting";
    let ends_at: string | null = null;
    if (isPS && period) {
      if (!f.ends_at) return setError("Informe a data final do período.");
      if (new Date(f.ends_at) < starts) return setError("A data final precisa ser depois da inicial.");
      ends_at = localToIso(f.ends_at);
    }
    for (const k of ["tutor_notes", "feeding_routine", "medications", "house_instructions", "access_instructions"] as const)
      if ((f[k] ?? "").length > 1000) return setError("Algum campo passou de 1000 caracteres.");
    setBusy(true);
    try {
      const { data: appt, error } = await supabase
        .from("appointments")
        .insert({
          tutor_id: user!.id,
          pet_id: f.pet_id!,
          service,
          starts_at: localToIso(f.starts_at!),
          ends_at,
          tutor_notes: f.tutor_notes?.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (isPS) {
        const { error: e2 } = await supabase.from("pet_sitting_details").insert({
          appointment_id: appt.id,
          feeding_routine: f.feeding_routine?.trim() || null,
          medications: f.medications?.trim() || null,
          house_instructions: f.house_instructions?.trim() || null,
          emergency_contact: f.emergency_contact?.trim().slice(0, 150) || null,
        });
        if (e2) throw e2;
        if (f.alarm_code || f.key_location || f.access_instructions) {
          const { error: e3 } = await supabase.rpc("set_home_access", {
            _alarm: f.alarm_code?.slice(0, 50) ?? "",
            _key: f.key_location?.slice(0, 300) ?? "",
            _instr: f.access_instructions ?? "",
          });
          if (e3) throw e3;
        }
      }
      toast.success("Solicitação enviada! Você verá a confirmação em Agendamentos.");
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
      navigate({ to: "/agendamentos" });
    } catch {
      setError("Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle sub="A Dra. Eduarda vai confirmar o horário com você.">Agendar atendimento</PageTitle>
      <form onSubmit={submit} className="space-y-6 rounded-3xl bg-card p-5 shadow-sm sm:p-8" noValidate>
        <fieldset>
          <legend className="mb-3 text-lg font-bold">1. Qual serviço?</legend>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(SERVICE_LABEL) as Service[]).map((s) => (
              <label key={s} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-border px-4 text-lg font-semibold has-[:checked]:border-primary has-[:checked]:bg-accent">
                <input type="radio" name="service" value={s} checked={service === s} onChange={() => setService(s)} className="h-5 w-5 accent-[var(--primary)]" />
                {SERVICE_LABEL[s]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="pet_id" className="text-lg">2. Qual pet?</Label>
          <select id="pet_id" name="pet_id" required className="h-12 w-full rounded-md border border-input bg-card px-3 text-base">
            {pets?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
          </select>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-lg font-bold">3. Quando?</legend>
          {service === "pet_sitting" && (
            <div className="flex flex-wrap gap-3">
              {[false, true].map((v) => (
                <label key={String(v)} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-border px-4 has-[:checked]:border-primary has-[:checked]:bg-accent">
                  <input type="radio" name="period_kind" checked={period === v} onChange={() => setPeriod(v)} className="h-5 w-5 accent-[var(--primary)]" />
                  {v ? "Período (vários dias)" : "Data única"}
                </label>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="starts_at">{service === "pet_sitting" && period ? "Início" : "Data e horário"}</Label>
              <Input id="starts_at" name="starts_at" type="datetime-local" required className="h-12 text-base" />
            </div>
            {service === "pet_sitting" && period && (
              <div className="space-y-1.5">
                <Label htmlFor="ends_at">Fim</Label>
                <Input id="ends_at" name="ends_at" type="datetime-local" required className="h-12 text-base" />
              </div>
            )}
          </div>
        </fieldset>

        {service === "pet_sitting" && (
          <fieldset className="space-y-4 rounded-2xl bg-muted p-4">
            <legend className="px-1 text-lg font-bold">Informações do pet sitting</legend>
            <T id="feeding_routine" label="Rotina de alimentação" placeholder="Horários, quantidade, tipo de ração" />
            <T id="medications" label="Medicações" placeholder="Nome, dose e horário" />
            <T id="house_instructions" label="Instruções da casa" placeholder="Passeios, plantas, onde fica a ração..." />
            <div className="space-y-1.5">
              <Label htmlFor="emergency_contact">Contato de emergência</Label>
              <Input id="emergency_contact" name="emergency_contact" maxLength={150} placeholder="Nome e telefone" className="h-12 text-base" />
            </div>
            <div className="rounded-2xl border-2 border-secondary bg-card p-4">
              <p className="font-bold">Acesso à casa (sigiloso)</p>
              <p className="mb-3 text-sm text-muted-foreground">
                Só a Dra. Eduarda vê estes dados. Depois de salvos, nem você consegue lê-los aqui — por segurança.
                Você pode apagá-los em “Meus dados” quando o serviço terminar.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="alarm_code">Código do alarme</Label>
                  <Input id="alarm_code" name="alarm_code" maxLength={50} autoComplete="off" className="h-12 text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="key_location">Local da chave</Label>
                  <Input id="key_location" name="key_location" maxLength={300} autoComplete="off" className="h-12 text-base" />
                </div>
              </div>
              <div className="mt-4"><T id="access_instructions" label="Outras instruções de acesso" /></div>
            </div>
          </fieldset>
        )}

        <T id="tutor_notes" label="Observações (opcional)" placeholder="Sintomas, preferências de horário..." />

        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 font-semibold text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Enviando..." : "Enviar solicitação"}</Button>
      </form>
    </>
  );
}

function T({ id, label, placeholder }: { id: string; label: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={id} maxLength={1000} placeholder={placeholder} className="text-base" />
    </div>
  );
}
