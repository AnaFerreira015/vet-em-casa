import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FullLogo, SiteFooter } from "@/components/brand";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode | undefined } => ({
    mode: s["mode"] === "signup" || s["mode"] === "forgot" ? s["mode"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar · Eduarda Nunes Veterinária" },
      { name: "description", content: "Acesse sua conta para cadastrar pets e agendar atendimentos." },
      { property: "og:title", content: "Entrar · Eduarda Nunes Veterinária" },
      { property: "og:description", content: "Acesse sua conta para cadastrar pets e agendar atendimentos." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome completo").max(120),
  phone: z.string().trim().min(8, "Informe um telefone válido").max(30),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(72),
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Partial<Record<"email" | "password" | "full_name" | "phone", string>>;
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email ?? "", password: f.password ?? "" });
        if (error) throw new Error("E-mail ou senha incorretos, ou e-mail ainda não confirmado.");
        navigate({ to: "/inicio" });
      } else if (mode === "signup") {
        const parsed = signupSchema.safeParse(f);
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
        if (!consent) throw new Error("É preciso aceitar o termo de consentimento para continuar.");
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin + "/inicio",
            data: { full_name: parsed.data.full_name, phone: parsed.data.phone, lgpd_consent: "true" },
          },
        });
        if (error) throw new Error(error.message);
        setDone("Conta criada! Enviamos um link para o seu e-mail. Abra-o para confirmar e depois entre aqui.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(f.email ?? "", {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw new Error(error.message);
        setDone("Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.");
      }
    } catch (err) {
      setError((err as Error).message);
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha";

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <Link to="/" aria-label="Voltar ao início">
          <FullLogo className="w-40" />
        </Link>
        <h1 className="mt-6 text-center text-3xl font-bold text-primary">{title}</h1>

        {done ? (
          <div role="status" className="mt-6 rounded-2xl bg-card p-5 text-center shadow-sm">
            <p>{done}</p>
            <Button className="mt-4" onClick={() => { setDone(null); setMode("login"); }}>
              Ir para o login
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-3xl bg-card p-6 shadow-sm" noValidate>
            {mode === "signup" && (
              <>
                <Field id="full_name" label="Nome completo" autoComplete="name" />
                <Field id="phone" label="Telefone (WhatsApp)" type="tel" autoComplete="tel" />
              </>
            )}
            <Field id="email" label="E-mail" type="email" autoComplete="email" />
            {mode !== "forgot" && (
              <Field
                id="password"
                label="Senha"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                hint={mode === "signup" ? "Mínimo de 8 caracteres." : undefined}
              />
            )}
            {mode === "signup" && (
              <div className="flex items-start gap-3 rounded-2xl bg-muted p-4">
                <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-1 h-6 w-6" />
                <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
                  Li e concordo com o tratamento dos meus dados e dos meus pets pela Dra. Eduarda Nunes,
                  conforme a LGPD, exclusivamente para agendamentos e atendimento veterinário. Posso
                  exportar ou excluir meus dados a qualquer momento em “Meus dados”.
                </Label>
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 p-3 font-semibold text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
            </Button>
          </form>
        )}

        <nav aria-label="Outras opções" className="mt-6 flex flex-col items-center gap-1">
          {mode !== "login" && <Button variant="link" onClick={() => setMode("login")}>Já tenho conta — entrar</Button>}
          {mode !== "signup" && <Button variant="link" onClick={() => setMode("signup")}>Não tenho conta — criar</Button>}
          {mode === "login" && <Button variant="link" onClick={() => setMode("forgot")}>Esqueci minha senha</Button>}
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ id, label, hint, ...props }: { id: string; label: string; hint?: string | undefined } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} required className="h-12 text-base" aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      {hint && <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
