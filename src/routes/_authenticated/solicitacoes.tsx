import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Empty, PageTitle } from "@/components/ui-bits";
import { VET_APPT_SELECT, VetAppointmentCard, type VetAppt } from "@/components/vet-appointment";

export const Route = createFileRoute("/_authenticated/solicitacoes")({
  head: () => ({ meta: [{ title: "Solicitações · Eduarda Nunes Veterinária" }] }),
  component: Solicitacoes,
});

function Solicitacoes() {
  const { data, isLoading } = useQuery({
    queryKey: ["vet-appts", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select(VET_APPT_SELECT).eq("status", "pendente").order("starts_at");
      if (error) throw error;
      return data as unknown as VetAppt[];
    },
  });
  return (
    <>
      <PageTitle sub="Aceite, recuse ou remarque os pedidos dos tutores.">Solicitações pendentes</PageTitle>
      {isLoading ? (
        <p role="status">Carregando...</p>
      ) : !data?.length ? (
        <Empty>Nenhuma solicitação pendente.</Empty>
      ) : (
        <ul className="space-y-4">{data.map((a) => <VetAppointmentCard key={a.id} a={a} />)}</ul>
      )}
    </>
  );
}
