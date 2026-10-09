import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope, Syringe, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark, FullLogo, SiteFooter, VET_CRMV, VET_NAME } from "@/components/brand";
import fotoEduarda from "@/assets/eduarda.webp";

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
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-4 sm:gap-4">
        <BrandMark />
        <Button asChild variant="outline" size="sm" className="shrink-0">
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
        <section aria-labelledby="sobre" className="py-8">
          <div className="grid items-center gap-8 rounded-3xl bg-card p-6 shadow-sm sm:p-10 md:grid-cols-[minmax(0,320px)_1fr]">
            <img
              src={fotoEduarda}
              alt="Eduarda Nunes sorrindo, com jaleco branco da UFAL, segurando um filhote de cachorro preto, branco e caramelo."
              width={720}
              height={714}
              loading="lazy"
              className="mx-auto aspect-square w-full max-w-xs rounded-3xl object-cover"
            />
            <div>
              <h2 id="sobre" className="text-2xl font-bold uppercase tracking-widest text-primary">
                Sobre mim
              </h2>
              <p className="mt-4 text-lg">
                Olá! Eu sou a {VET_NAME}, médica veterinária ({VET_CRMV}).
              </p>
              {/* Adicione aqui formação, especializações e tempo de experiência. */}
              <p className="mt-3">
                Atendo o seu pet no conforto da sua casa, onde ele fica mais tranquilo, sem o estresse do
                transporte e da sala de espera. Também cuido dele como pet sitter quando você precisa viajar
                ou passar o dia fora, seguindo a rotina de alimentação, medicação e passeios que você me passar.
              </p>
              <p className="mt-3">
                Meu compromisso é um atendimento calmo e cuidadoso, com tempo para ouvir você e conhecer o
                seu pet.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
