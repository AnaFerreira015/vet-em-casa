import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { SERVICE_LABEL, fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Empty, PageTitle, StatusBadge } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/agendamentos")({
  head: () => ({ meta: [{ title: "Meus agendamentos · Eduarda Nunes Veterinária" }] }),
  component: Agendamentos,
});

function Agendamentos() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-appointments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, pets(name)")
        .eq("tutor_id", user!.id)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelado" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado");
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
    },
    onError: () => toast.error("Não foi possível cancelar."),
  });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle>Meus agendamentos</PageTitle>
        <Button asChild size="lg"><Link to="/agendar">Novo agendamento</Link></Button>
      </div>
      {isLoading ? (
        <p role="status">Carregando...</p>
      ) : !data?.length ? (
        <Empty>Nenhum agendamento ainda.</Empty>
      ) : (
        <ul className="space-y-3">
          {data.map((a) => (
            <li key={a.id} className="rounded-3xl bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">{SERVICE_LABEL[a.service]} · {a.pets?.name}</h2>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-1 text-lg">
                {fmtDateTime(a.starts_at)}
                {a.ends_at && ` até ${fmtDateTime(a.ends_at)}`}
              </p>
              {a.rescheduled_from && <p className="text-sm text-muted-foreground">Remarcado (antes: {fmtDateTime(a.rescheduled_from)})</p>}
              {a.vet_notes && <p className="mt-2 rounded-xl bg-muted p-3"><strong>Recado da Dra.:</strong> {a.vet_notes}</p>}
              {(a.status === "pendente" || a.status === "confirmado") && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => confirm("Cancelar este agendamento?") && cancel.mutate(a.id)}>
                  Cancelar agendamento
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
