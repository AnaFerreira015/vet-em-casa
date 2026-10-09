import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSession } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, PageTitle, PetPhoto } from "@/components/ui-bits";

type Pet = Database["public"]["Tables"]["pets"]["Row"];

export const Route = createFileRoute("/_authenticated/pets")({
  head: () => ({ meta: [{ title: "Meus pets · Eduarda Nunes Veterinária" }] }),
  component: PetsPage,
});

const petSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do pet").max(60),
  species: z.string().trim().min(1, "Informe a espécie").max(40),
  breed: z.string().trim().max(60).optional(),
  sex: z.enum(["macho", "femea"]).optional(),
  birth_date: z
    .string()
    .optional()
    .refine((v) => !v || new Date(v) <= new Date(), "A data de nascimento não pode ser no futuro"),
  weight_kg: z
    .string()
    .optional()
    .refine((v) => !v || (Number(v.replace(",", ".")) > 0 && Number(v.replace(",", ".")) < 200), "Peso inválido"),
  temperament: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

function PetsPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Pet | "new" | null>(null);
  const { data: pets, isLoading } = useQuery({
    queryKey: ["pets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("pets").select("*").eq("tutor_id", user!.id).order("name");
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (p: Pet) => {
      const { error } = await supabase.from("pets").delete().eq("id", p.id);
      if (error) throw error;
      if (p.photo_path) await supabase.storage.from("pet-photos").remove([p.photo_path]);
    },
    onSuccess: () => {
      toast.success("Pet removido");
      qc.invalidateQueries({ queryKey: ["pets"] });
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle sub="Cadastre seus animais para poder agendar.">Meus pets</PageTitle>
        <Button size="lg" onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" /> Adicionar pet
        </Button>
      </div>
      {isLoading ? (
        <p role="status">Carregando...</p>
      ) : !pets?.length ? (
        <Empty>Você ainda não cadastrou nenhum pet. Toque em “Adicionar pet”.</Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {pets.map((p) => (
            <li key={p.id} className="flex gap-4 rounded-3xl bg-card p-5 shadow-sm">
              <PetPhoto path={p.photo_path} name={p.name} className="h-20 w-20" />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold">{p.name}</h2>
                <p className="text-muted-foreground">
                  {p.species}
                  {p.breed ? ` · ${p.breed}` : ""}
                  {p.sex ? ` · ${p.sex === "macho" ? "Macho" : "Fêmea"}` : ""}
                </p>
                {p.birth_date && <p className="text-sm">Nascimento: {fmtDate(p.birth_date + "T12:00:00")}</p>}
                {p.weight_kg && <p className="text-sm">Peso: {String(p.weight_kg).replace(".", ",")} kg</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                    <Pencil aria-hidden="true" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => confirm(`Remover ${p.name}? Os agendamentos dele também serão apagados.`) && del.mutate(p)}
                  >
                    <Trash2 aria-hidden="true" /> Remover
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!!pets?.length && (
        <p className="mt-6">
          <Button asChild variant="secondary" size="lg">
            <Link to="/agendar">Agendar atendimento</Link>
          </Button>
        </p>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">{editing === "new" ? "Novo pet" : "Editar pet"}</DialogTitle>
          </DialogHeader>
          {editing && user && (
            <PetForm
              pet={editing === "new" ? null : editing}
              userId={user.id}
              onDone={() => {
                setEditing(null);
                qc.invalidateQueries({ queryKey: ["pets"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PetForm({ pet, userId, onDone }: { pet: Pet | null; userId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries([...fd.entries()].filter(([k, v]) => k !== "photo" && v !== "")) as Record<string, string>;
    const parsed = petSchema.safeParse(raw);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    const file = fd.get("photo") as File | null;
    if (file && file.size > 0) {
      if (!file.type.startsWith("image/")) return setError("A foto precisa ser uma imagem.");
      if (file.size > 5 * 1024 * 1024) return setError("A foto deve ter no máximo 5 MB.");
    }
    setBusy(true);
    try {
      let photo_path = pet?.photo_path ?? null;
      if (file && file.size > 0) {
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("pet-photos").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        if (photo_path) await supabase.storage.from("pet-photos").remove([photo_path]);
        photo_path = path;
      }
      const d = parsed.data;
      const row = {
        name: d.name,
        species: d.species,
        breed: d.breed ?? null,
        sex: d.sex ?? null,
        birth_date: d.birth_date ?? null,
        weight_kg: d.weight_kg ? Number(d.weight_kg.replace(",", ".")) : null,
        temperament: d.temperament ?? null,
        notes: d.notes ?? null,
        photo_path,
      };
      const { error } = pet
        ? await supabase.from("pets").update(row).eq("id", pet.id)
        : await supabase.from("pets").insert({ ...row, tutor_id: userId });
      if (error) throw error;
      toast.success("Pet salvo!");
      onDone();
    } catch {
      setError("Não foi possível salvar. Confira os dados e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <F id="name" label="Nome *" defaultValue={pet?.name} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <F id="species" label="Espécie *" placeholder="Ex.: Cachorro, Gato" defaultValue={pet?.species} required list="species-list" />
        <datalist id="species-list">
          <option value="Cachorro" />
          <option value="Gato" />
          <option value="Ave" />
          <option value="Coelho" />
        </datalist>
        <F id="breed" label="Raça" defaultValue={pet?.breed ?? ""} />
      </div>
      <fieldset>
        <legend className="mb-2 font-semibold">Sexo</legend>
        <div className="flex gap-3">
          {(["macho", "femea"] as const).map((s) => (
            <label key={s} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-border px-4 has-[:checked]:border-primary has-[:checked]:bg-accent">
              <input type="radio" name="sex" value={s} defaultChecked={pet?.sex === s} className="h-5 w-5 accent-[var(--primary)]" />
              {s === "macho" ? "Macho" : "Fêmea"}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <F id="birth_date" label="Data de nascimento" type="date" defaultValue={pet?.birth_date ?? ""} />
        <F id="weight_kg" label="Peso (kg)" inputMode="decimal" defaultValue={pet?.weight_kg?.toString().replace(".", ",") ?? ""} />
      </div>
      <F id="temperament" label="Temperamento" placeholder="Ex.: dócil, medroso, agitado" defaultValue={pet?.temperament ?? ""} />
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" maxLength={1000} defaultValue={pet?.notes ?? ""} className="text-base" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="photo">Foto (opcional, até 5 MB)</Label>
        <Input id="photo" name="photo" type="file" accept="image/*" className="h-12 text-base" />
      </div>
      {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 font-semibold text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}

function F({ id, label, ...props }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} className="h-12 text-base" {...props} />
    </div>
  );
}
