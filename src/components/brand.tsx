import mark from "@/assets/mark.png";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export const VET_NAME = "Eduarda Nunes";
export const VET_CRMV = "CRMV-AL 02124";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2 sm:gap-3", className)}>
      <img src={mark} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-12 sm:w-12" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-lg font-bold text-primary sm:text-xl">{VET_NAME}</span>
        <span className="truncate text-xs font-semibold uppercase tracking-[0.1em] text-secondary sm:tracking-[0.2em]">
          Médica veterinária
        </span>
      </span>
    </span>
  );
}

export function FullLogo({ className }: { className?: string }) {
  return (
    <img
      src={logo}
      alt={`${VET_NAME}, médica veterinária, ${VET_CRMV}`}
      className={cn("mx-auto w-56 rounded-3xl", className)}
    />
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card py-6 text-center text-sm text-muted-foreground">
      <p className="font-semibold text-foreground">
        {VET_NAME} · Médica Veterinária · {VET_CRMV}
      </p>
      <p>Atendimento veterinário domiciliar e pet sitting</p>
    </footer>
  );
}
