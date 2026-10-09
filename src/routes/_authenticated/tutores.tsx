import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Empty, PageTitle, PetPhoto } from "@/components/ui-bits";
import { RouteLinks, fullAddress } from "@/components/vet-appointment";

export const Route = createFileRoute("/_authenticated/tutores")({
  head: () => ({ meta: [{ title: "Tutores e pets · Eduarda Nunes Veterinária" }] }),
  component: Tutores,
});

function Tutores() {
  const { user } = useSession();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["vet-tutors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*, pets(*)").order("full_name");
      if (error) throw error;
      return data;
    },
  });
  const term = q.trim().toLowerCase();
  const list = (data ?? [])
    .filter((t) => t.id !== user?.id)
    .filter(
      (t) =>
        !term ||
        t.full_name.toLowerCase().includes(term) ||
        (t.phone ?? "").includes(term) ||
        (t.neighborhood ?? "").toLowerCase().includes(term) ||
        t.pets.some((p) => p.name.toLowerCase().includes(term) || p.species.toLowerCase().includes(term)),
    );

  return (
    <>
      <PageTitle>Tutores e pets</PageTitle>
      <div className="mb-6 max-w-md space-y-1.5">
        <Label htmlFor="busca">Buscar por tutor, telefone, bairro ou pet</Label>
        <Input id="busca" type="search" value={q} onChange={(e) => setQ(e.target.value)} className="h-12 text-base" />
      </div>
      <p className="sr-only" aria-live="polite">{list.length} resultados</p>
      {isLoading ? (
        <p role="status">Carregando...</p>
      ) : !list.length ? (
        <Empty>Nenhum tutor encontrado.</Empty>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((t) => (
            <li key={t.id} className="rounded-3xl bg-card p-5 shadow-sm">
              <h2 className="text-xl font-bold">{t.full_name || "Sem nome"}</h2>
              {t.phone && (
                <a href={`tel:${t.phone}`} className="inline-flex min-h-11 items-center gap-1 font-semibold text-secondary underline">
                  <Phone className="h-4 w-4" aria-hidden="true" /> {t.phone}
                </a>
              )}
              {fullAddress(t) && <p className="text-sm">{fullAddress(t)}</p>}
              <div className="mt-2"><RouteLinks address={fullAddress(t)} /></div>
              <ul className="mt-4 space-y-2">
                {t.pets.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-muted p-2">
                    <PetPhoto path={p.photo_path} name={p.name} className="h-12 w-12" />
                    <span>
                      <strong>{p.name}</strong> · {p.species}{p.breed ? ` · ${p.breed}` : ""}
                      {p.temperament && <span className="block text-sm text-muted-foreground">{p.temperament}</span>}
                    </span>
                  </li>
                ))}
                {!t.pets.length && <li className="text-sm text-muted-foreground">Sem pets cadastrados</li>}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
