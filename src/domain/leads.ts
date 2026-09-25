import type { Tone } from "../design-system/tokens";
import { daysToMonths, normalize, parseISODate, titleCase } from "./format";
import type { ContactChannel, ContactOutcome, IotAlert, Lead, LeadStatus } from "./types";

// ---------------------------------------------------------------------------
// Status do funil de retenção (CRM local)
// ---------------------------------------------------------------------------

export const LEAD_STATUS: Record<LeadStatus, { label: string; tone: Tone; icon: string; description: string }> = {
  novo: { label: "Novo", tone: "accent", icon: "sparkles-outline", description: "Aguardando primeiro contato" },
  contatado: { label: "Em contato", tone: "warning", icon: "chatbubbles-outline", description: "Cliente abordado, sem agendamento" },
  agendado: { label: "Agendado", tone: "info", icon: "calendar-outline", description: "Serviço marcado na concessionária" },
  retido: { label: "Retido", tone: "success", icon: "shield-checkmark-outline", description: "Voltou para a rede Ford" },
  perdido: { label: "Perdido", tone: "danger", icon: "close-circle-outline", description: "Recusou ou migrou" }
};

export const STATUS_ORDER: LeadStatus[] = ["novo", "contatado", "agendado", "retido", "perdido"];

export const CHANNELS: Record<ContactChannel, { label: string; icon: string }> = {
  whatsapp: { label: "WhatsApp", icon: "logo-whatsapp" },
  ligacao: { label: "Ligação", icon: "call-outline" },
  email: { label: "E-mail", icon: "mail-outline" },
  sms: { label: "SMS", icon: "chatbox-outline" }
};

export const OUTCOMES: Record<ContactOutcome, { label: string; next: LeadStatus }> = {
  interessado: { label: "Interessado", next: "contatado" },
  retornar: { label: "Pediu retorno", next: "contatado" },
  sem_resposta: { label: "Sem resposta", next: "contatado" },
  recusou: { label: "Recusou", next: "perdido" }
};

export function priorityTone(priority: Lead["priority"]): Tone {
  if (priority === "Alta") return "danger";
  if (priority === "Media") return "warning";
  return "accent";
}

export function priorityLabel(priority: Lead["priority"]): string {
  return priority === "Media" ? "Média" : priority;
}

export function leadTitle(lead: Lead): string {
  return `${titleCase(lead.modelName)}${lead.modelYear ? ` ${lead.modelYear}` : ""}`;
}

// ---------------------------------------------------------------------------
// Explicabilidade do score (mesmas regras do pipeline scripts/build-service-summary.py)
// ---------------------------------------------------------------------------

export type ScoreFactor = { key: string; label: string; points: number; max: number; detail: string };

export function scoreFactors(lead: Lead, analysisDate: string): ScoreFactor[] {
  const factors: ScoreFactor[] = [];
  const d = lead.daysSinceService;
  const recency = d >= 420 ? 45 : d >= 330 ? 32 : d >= 240 ? 18 : 0;
  factors.push({ key: "recency", label: "Tempo sem serviço", points: recency, max: 45, detail: `${d} dias (~${daysToMonths(d)} meses) desde a última OS` });

  const history = lead.serviceCount <= 1 ? 16 : lead.serviceCount === 2 ? 8 : 0;
  factors.push({ key: "history", label: "Histórico na rede", points: history, max: 16, detail: `${lead.serviceCount} passagem(ns) registrada(s)` });

  const kmy = lead.estimatedKmPerYear;
  const usage = kmy && kmy >= 18000 ? 12 : kmy && kmy >= 12000 ? 6 : 0;
  factors.push({
    key: "usage",
    label: "Rodagem estimada",
    points: usage,
    max: 12,
    detail: kmy ? `${Math.round(kmy).toLocaleString("pt-BR")} km/ano` : "Sem dado de rodagem (não disponível)"
  });

  let warranty = 0;
  let warrantyDetail = "Sem data de garantia (não disponível)";
  if (lead.warrantyEndDate) {
    const diff = Math.round((parseISODate(lead.warrantyEndDate).getTime() - parseISODate(analysisDate).getTime()) / 86400000);
    if (diff >= -180 && diff <= 120) {
      warranty = 10;
      warrantyDetail = diff >= 0 ? `Garantia termina em ${diff} dias` : `Garantia encerrada há ${-diff} dias`;
    } else if (diff < -180) {
      warranty = 4;
      warrantyDetail = `Fora da garantia há ${-diff} dias`;
    } else {
      warrantyDetail = `Garantia ativa por mais ${diff} dias`;
    }
  }
  factors.push({ key: "warranty", label: "Fase da garantia", points: warranty, max: 10, detail: warrantyDetail });

  const known = recency + history + usage + warranty;
  const agendaByReason = normalize(lead.reason).includes("agendamento");
  const agenda = agendaByReason || lead.score - known >= 10 ? 10 : 0;
  factors.push({ key: "agenda", label: "Agenda digital", points: agenda, max: 10, detail: agenda ? "Nunca usou agendamento digital" : "Já utiliza agendamento digital" });

  return factors;
}

// ---------------------------------------------------------------------------
// Jornada do cliente: mensagem personalizada e próximo melhor serviço
// ---------------------------------------------------------------------------

export function suggestedService(lead: Lead): string {
  if (lead.estimatedKmPerYear && lead.estimatedKmPerYear >= 18000) return "Revisão + freios e pneus";
  if (lead.serviceCount <= 1) return "Segunda revisão programada";
  if (lead.daysSinceService >= 420) return "Check-up completo de retorno";
  return "Revisão periódica";
}

export function contactMessage(lead: Lead, dealerCode: string, alert?: IotAlert | null): string {
  const model = titleCase(lead.modelName);
  const months = daysToMonths(lead.daysSinceService);
  const opener = `Olá! Aqui é da concessionária Ford ${dealerCode}. Tudo bem?`;
  let body: string;
  if (alert) {
    body = `Recebemos um aviso do seu ${model}: ${alert.title.toLowerCase()}. Para sua segurança, recomendamos uma avaliação rápida na nossa oficina, com técnicos e peças originais Ford.`;
  } else if (lead.daysSinceService >= 420) {
    body = `Notamos que o seu ${model} está há cerca de ${months} meses sem passar pela rede Ford. Preparamos um check-up completo de retorno com condição especial para você.`;
  } else if (lead.serviceCount <= 1) {
    body = `Está chegando a hora da próxima revisão do seu ${model}. Manter as revisões na rede preserva a garantia e o valor de revenda.`;
  } else {
    body = `A revisão periódica do seu ${model} está próxima. Temos horários disponíveis esta semana.`;
  }
  const cta = "Posso reservar um horário? Se preferir, oferecemos leva-e-traz.";
  return `${opener}\n\n${body}\n\n${cta}`;
}

// ---------------------------------------------------------------------------
// Ordenação/filtragem da fila de leads
// ---------------------------------------------------------------------------

export type LeadWithState = Lead & { status: LeadStatus; iotAlert: IotAlert | null };

export function sortQueue(items: LeadWithState[]): LeadWithState[] {
  const rank = (l: LeadWithState) => (l.iotAlert && !l.iotAlert.acknowledged ? 1000 : 0) + l.score;
  return [...items].sort((a, b) => rank(b) - rank(a) || b.daysSinceService - a.daysSinceService);
}

export function matchesQuery(lead: Lead, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return [lead.modelName, lead.dealerCode, lead.vinMask, lead.reason, lead.priority].some((v) => normalize(String(v)).includes(q));
}
