import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TZ } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, PageTitle } from "@/components/ui-bits";
import { VET_APPT_SELECT, VetAppointmentCard, type VetAppt } from "@/components/vet-appointment";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({ meta: [{ title: "Agenda · Eduarda Nunes Veterinária" }] }),
  component: Agenda,
});

function range(kind: "dia" | "semana") {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + (kind === "dia" ? 1 : 7));
  return { start: start.toISOString(), end: end.toISOString() };
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "long" });
}

function Agenda() {
  const [kind, setKind] = useState<"dia" | "semana">("dia");
  const { start, end } = range(kind);
  const { data, isLoading } = useQuery({
    queryKey: ["vet-appts", "agenda", kind, start],
    queryFn: async () => {
      // inclui pet sittings em andamento (começaram antes, terminam depois do início)
      const { data, error } = await supabase
        .from("appointments")
        .select(VET_APPT_SELECT)
        .in("status", ["pendente", "confirmado", "concluido"])
        .or(`and(starts_at.gte.${start},starts_at.lt.${end}),and(starts_at.lt.${start},ends_at.gte.${start})`)
        .order("starts_at");
      if (error) throw error;
      return data as unknown as VetAppt[];
    },
  });

  const groups = new Map<string, VetAppt[]>();
  data?.forEach((a) => {
    const k = dayLabel(a.starts_at);
    groups.set(k, [...(groups.get(k) ?? []), a]);
  });

  return (
    <>
      <PageTitle sub="Atendimentos confirmados, pendentes e concluídos.">Agenda</PageTitle>
      <Tabs value={kind} onValueChange={(v) => setKind(v as "dia" | "semana")}>
        <TabsList className="mb-6 h-auto rounded-full p-1">
          <TabsTrigger value="dia" className="min-h-11 rounded-full px-6 text-base">Hoje</TabsTrigger>
          <TabsTrigger value="semana" className="min-h-11 rounded-full px-6 text-base">Próximos 7 dias</TabsTrigger>
        </TabsList>
      </Tabs>
      {isLoading ? (
        <p role="status">Carregando...</p>
      ) : !data?.length ? (
        <Empty>Nada agendado {kind === "dia" ? "para hoje" : "nesta semana"}.</Empty>
      ) : (
        [...groups.entries()].map(([day, list]) => (
          <section key={day} className="mb-8">
            <h2 className="mb-3 text-xl font-bold capitalize text-secondary">{day}</h2>
            <ul className="space-y-4">{list.map((a) => <VetAppointmentCard key={a.id} a={a} />)}</ul>
          </section>
        ))
      )}
    </>
  );
}
