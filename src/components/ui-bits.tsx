import { useQuery } from "@tanstack/react-query";
import { PawPrint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["appointment_status"];

const statusStyle: Record<Status, string> = {
  pendente: "bg-warning text-warning-foreground",
  confirmado: "bg-secondary text-secondary-foreground",
  concluido: "bg-success text-success-foreground",
  cancelado: "bg-muted text-muted-foreground border border-border",
  recusado: "bg-destructive text-destructive-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-sm font-bold", statusStyle[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-primary">{children}</h1>
      {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Foto em bucket privado: URL assinada válida por 5 minutos. */
export function PetPhoto({ path, name, className }: { path: string | null; name: string; className?: string }) {
  const { data: url } = useQuery({
    queryKey: ["signed", path],
    enabled: !!path,
    staleTime: 4 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("pet-photos").createSignedUrl(path!, 300);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-accent-foreground", className ?? "h-16 w-16")}>
      {url ? <img src={url} alt={`Foto de ${name}`} className="h-full w-full object-cover" /> : <PawPrint className="h-1/2 w-1/2" aria-hidden="true" />}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center text-muted-foreground">{children}</p>;
}
