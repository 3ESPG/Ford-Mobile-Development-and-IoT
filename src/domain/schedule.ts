import { toISODate } from "./format";

export const SERVICE_TYPES = [
  { id: "revisao", label: "Revisão periódica", icon: "construct-outline", minutes: 120 },
  { id: "oleo", label: "Troca de óleo e filtros", icon: "water-outline", minutes: 60 },
  { id: "freios", label: "Freios e pneus", icon: "disc-outline", minutes: 90 },
  { id: "diagnostico", label: "Diagnóstico eletrônico", icon: "hardware-chip-outline", minutes: 60 },
  { id: "bateria", label: "Bateria e elétrica", icon: "battery-charging-outline", minutes: 45 },
  { id: "garantia", label: "Check-up de garantia", icon: "shield-checkmark-outline", minutes: 90 }
] as const;

export type ServiceTypeId = (typeof SERVICE_TYPES)[number]["id"];

export const TIME_SLOTS = ["08:00", "09:30", "11:00", "13:30", "15:00", "16:30"];

/** Próximos dias úteis de oficina (seg–sáb), a partir de amanhã */
export function nextWorkshopDays(from: Date, count: number): string[] {
  const days: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0) days.push(toISODate(cursor));
  }
  return days;
}

/** Sugere o tipo de serviço a partir do código do alerta IoT */
export function serviceForAlert(code: string | undefined): ServiceTypeId {
  if (!code) return "revisao";
  if (code.startsWith("OIL")) return "oleo";
  if (code.startsWith("TIRE")) return "freios";
  if (code.startsWith("BATTERY")) return "bateria";
  if (code.startsWith("DTC") || code.startsWith("COOLANT")) return "diagnostico";
  return "revisao";
}

export function serviceLabel(id: string): string {
  return SERVICE_TYPES.find((s) => s.id === id)?.label || id;
}
