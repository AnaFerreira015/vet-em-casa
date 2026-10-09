import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Navigation, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SERVICE_LABEL, fmtDateTime, isoToLocalInput, localToIso, mapsLinks } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PetPhoto, StatusBadge } from "@/components/ui-bits";

type Status = Database["public"]["Enums"]["appointment_status"];

export const VET_APPT_SELECT =
  "*, pets(name, species, breed, photo_path, temperament), profiles(full_name, phone, address, neighborhood, city, zip), pet_sitting_details(*)";

export type VetAppt = Database["public"]["Tables"]["appointments"]["Row"] & {
  pets: { name: string; species: string; breed: string | null; photo_path: string | null; temperament: string | null } | null;
  profiles: { full_name: string; phone: string | null; address: string | null; neighborhood: string | null; city: string | null; zip: string | null } | null;
  pet_sitting_details: Database["public"]["Tables"]["pet_sitting_details"]["Row"] | null;
};

export function fullAddress(p: VetAppt["profiles"]) {
  if (!p) return "";
  return [p.address, p.neighborhood, p.city, p.zip].filter(Boolean).join(", ");
}

export function RouteLinks({ address }: { address: string }) {
  if (!address) return <p className="text-sm text-muted-foreground">Endereço não informado</p>;
  const l = mapsLinks(address);
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="secondary">
        <a href={l.google} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden="true" /> Abrir no Google Maps</a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={l.waze} target="_blank" rel="noopener noreferrer"><Navigation aria-hidden="true" /> Abrir no Waze</a>
      </Button>
    </div>
  );
}

export function VetAppointmentCard({ a }: { a: VetAppt }) {
  const qc = useQueryClient();
  const [resched, setResched] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const address = fullAddress(a.profiles);

  const update = useMutation({
    mutationFn: async (patch: Database["public"]["Tables"]["appointments"]["Update"]) => {
      const { error } = await supabase.from("appointments").update(patch).eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento atualizado");
      qc.invalidateQueries({ queryKey: ["vet-appts"] });
      setResched(false);
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });
  const setStatus = (status: Status) => update.mutate({ status });

  const access = useQuery({
    queryKey: ["home-access", a.tutor_id],
    enabled: showAccess,
    queryFn: async () => {
      const { data, error } = await supabase.from("home_access").select("*").eq("tutor_id", a.tutor_id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const ps = a.pet_sitting_details;

  return (
    <li className="rounded-3xl bg-card p-5 shadow-sm">
      <div className="flex gap-4">
        <PetPhoto path={a.pets?.photo_path ?? null} name={a.pets?.name ?? "pet"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-bold">{SERVICE_LABEL[a.service]} · {a.pets?.name}</h3>
            <StatusBadge status={a.status} />
          </div>
          <p className="text-lg font-semibold">{fmtDateTime(a.starts_at)}{a.ends_at && ` até ${fmtDateTime(a.ends_at)}`}</p>
          <p className="text-muted-foreground">
            {a.pets?.species}{a.pets?.breed ? ` · ${a.pets.breed}` : ""}{a.pets?.temperament ? ` · ${a.pets.temperament}` : ""}
          </p>
          <p>
            Tutor(a): <strong>{a.profiles?.full_name || "—"}</strong>
            {a.profiles?.phone && (
              <a href={`tel:${a.profiles.phone}`} className="ml-2 inline-flex min-h-11 items-center gap-1 font-semibold text-secondary underline">
                <Phone className="h-4 w-4" aria-hidden="true" />{a.profiles.phone}
              </a>
            )}
          </p>
          {address && <p className="text-sm">{address}</p>}
        </div>
      </div>
      {a.tutor_notes && <p className="mt-3 rounded-xl bg-muted p-3"><strong>Observações do tutor:</strong> {a.tutor_notes}</p>}
      {ps && (
        <dl className="mt-3 grid gap-2 rounded-xl bg-muted p-3 sm:grid-cols-2">
          {([["Alimentação", ps.feeding_routine], ["Medicações", ps.medications], ["Instruções da casa", ps.house_instructions], ["Emergência", ps.emergency_contact]] as const).map(
            ([k, v]) => v && (<div key={k}><dt className="font-bold">{k}</dt><dd className="whitespace-pre-wrap">{v}</dd></div>),
          )}
        </dl>
      )}
      {a.service === "pet_sitting" && (
        <div className="mt-3">
          <Button size="sm" variant="ghost" onClick={() => setShowAccess((s) => !s)} aria-expanded={showAccess}>
            {showAccess ? "Ocultar acesso à casa" : "Ver acesso à casa"}
          </Button>
          {showAccess && (
            <div className="mt-2 rounded-xl border-2 border-secondary p-3">
              {access.isLoading ? "Carregando..." : access.data ? (
                <dl className="space-y-1">
                  {access.data.alarm_code && <div><dt className="inline font-bold">Alarme: </dt><dd className="inline">{access.data.alarm_code}</dd></div>}
                  {access.data.key_location && <div><dt className="inline font-bold">Chave: </dt><dd className="inline">{access.data.key_location}</dd></div>}
                  {access.data.access_instructions && <div><dt className="font-bold">Instruções:</dt><dd className="whitespace-pre-wrap">{access.data.access_instructions}</dd></div>}
                </dl>
              ) : "Nenhum dado de acesso (o tutor não informou ou já apagou)."}
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {a.status === "pendente" && (
          <>
            <Button variant="success" onClick={() => setStatus("confirmado")}>Aceitar</Button>
            <Button variant="destructive" onClick={() => confirm("Recusar esta solicitação?") && setStatus("recusado")}>Recusar</Button>
          </>
        )}
        {(a.status === "pendente" || a.status === "confirmado") && (
          <Button variant="outline" onClick={() => setResched(true)}>Remarcar</Button>
        )}
        {a.status === "confirmado" && <Button variant="secondary" onClick={() => setStatus("concluido")}>Marcar concluído</Button>}
      </div>
      <div className="mt-3"><RouteLinks address={address} /></div>

      <Dialog open={resched} onOpenChange={setResched}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-2xl text-primary">Remarcar {a.pets?.name}</DialogTitle></DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget)) as Partial<Record<"starts_at" | "ends_at" | "vet_notes", string>>;
              if (!f.starts_at) { toast.error("Escolha a nova data."); return; }
              update.mutate({
                starts_at: localToIso(f.starts_at),
                ends_at: f.ends_at ? localToIso(f.ends_at) : null,
                rescheduled_from: a.starts_at,
                status: "confirmado",
                vet_notes: f.vet_notes?.trim().slice(0, 1000) || a.vet_notes,
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor={`rs-${a.id}`}>Nova data e horário</Label>
              <Input id={`rs-${a.id}`} name="starts_at" type="datetime-local" defaultValue={isoToLocalInput(a.starts_at)} className="h-12 text-base" />
            </div>
            {a.ends_at && (
              <div className="space-y-1.5">
                <Label htmlFor={`re-${a.id}`}>Novo fim</Label>
                <Input id={`re-${a.id}`} name="ends_at" type="datetime-local" defaultValue={isoToLocalInput(a.ends_at)} className="h-12 text-base" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`rn-${a.id}`}>Recado para o tutor</Label>
              <Textarea id={`rn-${a.id}`} name="vet_notes" maxLength={1000} defaultValue={a.vet_notes ?? ""} className="text-base" />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={update.isPending}>Confirmar nova data</Button>
          </form>
        </DialogContent>
      </Dialog>
    </li>
  );
}
