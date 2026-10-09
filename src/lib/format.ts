export const TZ = "America/Maceio";

export const SERVICE_LABEL = {
  consulta: "Consulta",
  vacina: "Vacina",
  retorno: "Retorno",
  pet_sitting: "Pet sitting",
} as const;

export const STATUS_LABEL = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  recusado: "Recusado",
} as const;

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ });
}

/** Converte valor de <input type="datetime-local"> (horário local) em ISO. */
export function localToIso(v: string) {
  return new Date(v).toISOString();
}

export function isoToLocalInput(iso: string) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function mapsLinks(address: string) {
  const q = encodeURIComponent(address);
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    waze: `https://waze.com/ul?q=${q}&navigate=yes`,
  };
}
