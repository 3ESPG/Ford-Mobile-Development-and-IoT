import type { LeadWithState } from "../domain/leads";
import type { LeadStatus } from "../domain/types";

export function funnelCounts(items: LeadWithState[]): Record<LeadStatus, number> {
  const counts: Record<LeadStatus, number> = { novo: 0, contatado: 0, agendado: 0, retido: 0, perdido: 0 };
  items.forEach((l) => {
    counts[l.status] += 1;
  });
  return counts;
}

/** Taxa de conversão do funil: (agendados + retidos) / leads trabalhados */
export function conversionRate(counts: Record<LeadStatus, number>): number {
  const worked = counts.contatado + counts.agendado + counts.retido + counts.perdido;
  return worked ? Math.round(((counts.agendado + counts.retido) / worked) * 100) : 0;
}
