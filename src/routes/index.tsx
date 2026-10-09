import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope, Syringe, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark, FullLogo, SiteFooter } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eduarda Nunes · Atendimento veterinário domiciliar" },
      { name: "description", content: "Consultas, vacinas e pet sitting no conforto da sua casa. Agende pelo app." },
      { property: "og:title", content: "Eduarda Nunes · Atendimento veterinário domiciliar" },
      { property: "og:description", content: "Consultas, vacinas e pet sitting no conforto da sua casa." },
    ],
  }),
  component: Index,
});

const services = [
  { icon: Stethoscope, label: "Consultas" },
  { icon: Syringe, label: "Vacinas" },
  { icon: RotateCcw, label: "Retornos" },
  { icon: Home, label: "Pet sitting" },
];

function Index() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <BrandMark />
        <Button asChild variant="outline">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="py-10 text-center">
          <FullLogo className="w-44" />
          <h1 className="mt-8 text-2xl font-semibold uppercase tracking-[0.15em] text-primary sm:text-3xl">
            Atendimento veterinário
          </h1>
          <p className="font-script -mt-1 text-6xl text-secondary sm:text-7xl">domiciliar</p>
          <p className="mt-4 text-lg uppercase tracking-wider text-foreground">
            Cuidado completo onde seu pet se sente seguro
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>Criar minha conta</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Já tenho conta</Link>
            </Button>
          </div>
        </section>
        <section aria-labelledby="servicos" className="py-8">
          <h2 id="servicos" className="text-center text-2xl font-bold uppercase tracking-widest text-primary">
            Serviços
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {services.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex flex-col items-center gap-3 rounded-3xl bg-card p-5 shadow-sm">
                <span
                  className={`grid h-16 w-16 place-items-center rounded-full ${i % 2 ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}
                >
                  <Icon className="h-8 w-8" aria-hidden="true" />
                </span>
                <span className="font-semibold tracking-wide">{label}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
