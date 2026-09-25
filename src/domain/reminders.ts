import { parseISODate } from "./format";

/**
 * Regras de horário dos lembretes (puras e testáveis).
 * Agendamento: véspera às 9h; se já passou, 2h antes do horário marcado.
 */
export function appointmentReminderDate(date: string, slot: string, now = new Date()): Date | null {
  const [h, m] = slot.split(":").map(Number);
  const serviceAt = parseISODate(date);
  serviceAt.setHours(h, m, 0, 0);

  const dayBefore = parseISODate(date);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(9, 0, 0, 0);

  const twoHoursBefore = new Date(serviceAt.getTime() - 2 * 3600 * 1000);
  const minimum = now.getTime() + 60 * 1000;
  return [dayBefore, twoHoursBefore].find((d) => d.getTime() > minimum) ?? null;
}

export type RevisionReminderOption = "demo" | "amanha" | "semana";

export const REVISION_OPTIONS: { id: RevisionReminderOption; label: string }[] = [
  { id: "demo", label: "Em 1 minuto (demo)" },
  { id: "amanha", label: "Amanhã às 9h" },
  { id: "semana", label: "Em 7 dias às 9h" }
];

export function revisionReminderDate(option: RevisionReminderOption, now = new Date()): Date {
  if (option === "demo") return new Date(now.getTime() + 60 * 1000);
  const d = new Date(now);
  d.setDate(d.getDate() + (option === "amanha" ? 1 : 7));
  d.setHours(9, 0, 0, 0);
  return d;
}
