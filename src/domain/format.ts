const nf = new Intl.NumberFormat("pt-BR");

const isEmpty = (v: number | null | undefined): v is null | undefined => v === null || v === undefined || Number.isNaN(v);

/** Formato compacto (175,6 mil · 1,2 mi) sem depender de Intl "compact" (suporte parcial no Hermes) */
export function compactNumber(value: number | null | undefined): string {
  if (isEmpty(value)) return "—";
  const abs = Math.abs(value);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  if (abs >= 1_000_000) return `${fmt(value / 1_000_000)} mi`;
  if (abs >= 1_000) return `${fmt(value / 1_000)} mil`;
  return nf.format(value);
}

export function number(value: number | null | undefined): string {
  return isEmpty(value) ? "—" : nf.format(value);
}

export function percent(value: number | null | undefined, digits = 1): string {
  if (isEmpty(value)) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: 0 })}%`;
}

/** Número decimal no padrão brasileiro (vírgula) */
export function decimal(value: number, digits = 1): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function km(value: number | null | undefined): string {
  return isEmpty(value) ? "—" : `${nf.format(Math.round(value))} km`;
}

/** Converte "YYYY-MM-DD" em Date no meio do dia (evita problemas de fuso) */
export function parseISODate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shortDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(parseISODate(value));
}

export function longDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(parseISODate(value)).replace(".", "");
}

export function monthLabel(yyyyMm: string): string {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return months[Number(yyyyMm.slice(5, 7)) - 1] || yyyyMm;
}

export function daysToMonths(days: number): number {
  return Math.round(days / 30.4);
}

export function relativeTime(iso: string, now = new Date()): string {
  const diff = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return `há ${Math.floor(diff / 86400)} d`;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length <= 2 && w !== "ka" ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .replace(/\bKa\b/i, "Ka")
    .replace(/F-series/i, "F-Series");
}

const ACCENTS: Record<string, string> = { á: "a", à: "a", â: "a", ã: "a", é: "e", ê: "e", í: "i", ó: "o", ô: "o", õ: "o", ú: "u", ü: "u", ç: "c" };

/** Minúsculas e sem acentos — busca tolerante ("revisao" encontra "revisão"), sem depender de String.normalize */
export function normalize(value: string): string {
  return value.toLowerCase().replace(/[áàâãéêíóôõúüç]/g, (ch) => ACCENTS[ch] || ch);
}
