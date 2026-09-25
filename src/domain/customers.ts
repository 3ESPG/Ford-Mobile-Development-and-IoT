import type { Tone } from "../design-system/tokens";
import { normalize, parseISODate, titleCase, toISODate } from "./format";
import type { Lead, ModelMetric } from "./types";

// ---------------------------------------------------------------------------
// Perfis de cliente (segmentação de retenção)
// ---------------------------------------------------------------------------

export type CustomerProfile = "fiel" | "abandono" | "esquecido" | "economico";

export type ProfileInfo = {
  label: string;
  tone: Tone;
  icon: string;
  description: string;
  action: { title: string; detail: string; cta: "agendar" | "ligar" | "lembrete" | "whatsapp" };
};

export const CUSTOMER_PROFILES: Record<CustomerProfile, ProfileInfo> = {
  fiel: {
    label: "Fiel",
    tone: "success",
    icon: "heart-outline",
    description: "Faz as revisões na rede com regularidade.",
    action: {
      title: "Manter e fidelizar",
      detail: "Agende a próxima revisão pelo app e ofereça o benefício de fidelidade (lavagem ou check-up cortesia).",
      cta: "agendar"
    }
  },
  abandono: {
    label: "Abandono",
    tone: "danger",
    icon: "exit-outline",
    description: "Passou uma única vez pela rede e não voltou; provável migração para oficina independente.",
    action: {
      title: "Reconquistar",
      detail: "Ligação do consultor com check-up de retorno gratuito e condição especial na primeira OS.",
      cta: "ligar"
    }
  },
  esquecido: {
    label: "Esquecido",
    tone: "warning",
    icon: "alarm-outline",
    description: "Tinha rotina de revisões, mas perdeu o prazo. Tende a voltar com um lembrete.",
    action: {
      title: "Lembrar da revisão",
      detail: "Crie um lembrete de revisão e envie a mensagem pronta pelo WhatsApp com horários disponíveis.",
      cta: "lembrete"
    }
  },
  economico: {
    label: "Econômico",
    tone: "teal",
    icon: "pricetag-outline",
    description: "Roda muito e é sensível a preço; compara a rede com oficinas independentes.",
    action: {
      title: "Oferta de preço fechado",
      detail: "Envie pelo WhatsApp um pacote de revisão com preço fechado e peças originais (Motorcraft).",
      cta: "whatsapp"
    }
  }
};

export const PROFILE_ORDER: CustomerProfile[] = ["abandono", "esquecido", "economico", "fiel"];

/** Uso a partir do qual o cliente é considerado sensível a preço (km/ano) */
export const HIGH_USAGE_KM = 42000;

/**
 * Classifica o perfil previsto a partir das mesmas variáveis usadas pelo modelo
 * (recência, frequência na rede e rodagem). Quando a API devolve o perfil do
 * modelo de ML (GET /clientes/{id}/perfil), ele substitui esta classificação.
 */
export function classifyLead(lead: Pick<Lead, "daysSinceService" | "serviceCount" | "estimatedKmPerYear">): { profile: CustomerProfile; confidence: number } {
  const kmy = lead.estimatedKmPerYear || 0;
  if (lead.daysSinceService < 365 && lead.serviceCount >= 3) return { profile: "fiel", confidence: 0.93 };
  if (kmy >= HIGH_USAGE_KM) return { profile: "economico", confidence: clamp(0.7 + (kmy - HIGH_USAGE_KM) / 100000, 0.7, 0.95) };
  if (lead.serviceCount >= 2 || lead.daysSinceService < 1200) {
    return { profile: "esquecido", confidence: lead.serviceCount >= 2 ? 0.86 : 0.74 };
  }
  return { profile: "abandono", confidence: clamp(0.72 + (lead.daysSinceService - 1200) / 5000, 0.72, 0.94) };
}

const clamp = (v: number, min: number, max: number) => Math.round(Math.min(max, Math.max(min, v)) * 100) / 100;

// ---------------------------------------------------------------------------
// Cliente (visão 360°)
// ---------------------------------------------------------------------------

export type ServiceRecord = { id: string; date: string; type: string; km: number | null; paid: boolean };

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  dealerCode: string;
  customerSince: string;
  vehicle: {
    vin: string;
    vinMask: string;
    modelName: string;
    modelYear: number | null;
    km: number | null;
    kmPerYear: number | null;
    warrantyEndDate: string | null;
  };
  lastServiceDate: string;
  daysSinceService: number;
  serviceCount: number;
  profile: CustomerProfile;
  confidence: number;
  riskScore: number;
  leadId: string | null;
  services: ServiceRecord[];
};

// Dados de contato fictícios e determinísticos: a base da Ford é anonimizada (LGPD)
const FIRST = ["Ana", "Bruno", "Camila", "Diego", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João", "Larissa", "Marcos", "Natália", "Otávio", "Paula", "Rafael", "Sofia", "Thiago", "Vanessa", "William"];
const LAST = ["Almeida", "Barbosa", "Cardoso", "Dias", "Ferreira", "Gomes", "Lima", "Martins", "Nunes", "Oliveira", "Pereira", "Rocha", "Santos", "Souza", "Teixeira", "Vieira"];

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Gerador pseudoaleatório determinístico (mulberry32) */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function contactFor(id: string) {
  const rand = rng(hashString(id));
  const first = FIRST[Math.floor(rand() * FIRST.length)];
  const last = LAST[Math.floor(rand() * LAST.length)];
  const h = Math.floor(rand() * 4294967296);
  const phoneTail = String(10000000 + (h % 89999999)).slice(-8);
  return {
    name: `${first} ${last}`,
    phone: `+55 11 9${phoneTail.slice(0, 4)}-${phoneTail.slice(4)}`,
    email: `${normalize(first)}.${normalize(last)}@email.com`
  };
}

const addDays = (iso: string, days: number) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const SERVICE_NAMES = ["1ª revisão", "2ª revisão", "3ª revisão", "4ª revisão", "5ª revisão", "6ª revisão", "7ª revisão", "8ª revisão"];

/** Histórico de OS reconstruído a partir do resumo do VIN (data e km da última passagem, uma revisão por ano) */
export function serviceHistory(id: string, lastDate: string, lastKm: number | null, count: number): ServiceRecord[] {
  const items: ServiceRecord[] = [];
  for (let i = 0; i < count; i += 1) {
    const back = count - 1 - i;
    const date = addDays(lastDate, -back * 365);
    // km proporcional ao número da passagem (evita estimativas negativas em quem roda muito)
    const km = lastKm === null ? null : Math.round((lastKm * (i + 1)) / count);
    items.push({ id: `${id}-${i}`, date, type: SERVICE_NAMES[i] || "Revisão periódica", km, paid: true });
  }
  return items.reverse();
}

export function customerFromLead(lead: Lead): Customer {
  const { profile, confidence } = classifyLead(lead);
  const services = serviceHistory(lead.id, lead.lastServiceDate, lead.lastKm, lead.serviceCount);
  return {
    id: lead.id,
    ...contactFor(lead.id),
    dealerCode: lead.dealerCode,
    customerSince: services[services.length - 1]?.date || lead.lastServiceDate,
    vehicle: {
      vin: lead.id,
      vinMask: lead.vinMask,
      modelName: lead.modelName,
      modelYear: lead.modelYear,
      km: lead.lastKm,
      kmPerYear: lead.estimatedKmPerYear,
      warrantyEndDate: lead.warrantyEndDate
    },
    lastServiceDate: lead.lastServiceDate,
    daysSinceService: lead.daysSinceService,
    serviceCount: lead.serviceCount,
    profile,
    confidence,
    riskScore: lead.score,
    leadId: lead.id,
    services
  };
}

/**
 * Clientes fiéis de exemplo para cada concessionária com leads (modo demo).
 * Os leads da base só trazem veículos em risco; sem estes clientes a carteira
 * não teria o perfil "Fiel" para comparação.
 */
export function loyalCustomers(dealerCodes: string[], models: ModelMetric[], analysisDate: string, perDealer = 3): Customer[] {
  const modelNames = models.slice(0, 6).map((m) => m.modelName);
  const analysisYear = parseISODate(analysisDate).getFullYear();
  const out: Customer[] = [];
  dealerCodes.forEach((dealerCode) => {
    const rand = rng(hashString(`fiel-${dealerCode}`));
    for (let i = 0; i < perDealer; i += 1) {
      const id = `F${dealerCode}${String(i + 1).padStart(2, "0")}${Math.floor(rand() * 1e6).toString(16).toUpperCase().padStart(5, "0")}`;
      const modelYear = analysisYear - 1 - Math.floor(rand() * 5);
      const serviceCount = Math.max(3, analysisYear - modelYear + 1);
      const days = 25 + Math.floor(rand() * 250);
      const kmPerYear = 9000 + Math.floor(rand() * 16000);
      const lastKm = kmPerYear * (analysisYear - modelYear) + Math.floor(rand() * 5000);
      const lastServiceDate = addDays(analysisDate, -days);
      const services = serviceHistory(id, lastServiceDate, lastKm, serviceCount);
      out.push({
        id,
        ...contactFor(id),
        dealerCode,
        customerSince: services[services.length - 1].date,
        vehicle: {
          vin: id,
          vinMask: `${id.slice(0, 6)}...${id.slice(-4)}`,
          modelName: modelNames[Math.floor(rand() * modelNames.length)] || "RANGER",
          modelYear,
          km: lastKm,
          kmPerYear,
          warrantyEndDate: `${modelYear + 3}-06-30`
        },
        lastServiceDate,
        daysSinceService: days,
        serviceCount,
        profile: "fiel",
        confidence: 0.9 + Math.round(rand() * 8) / 100,
        riskScore: 8 + Math.floor(rand() * 25),
        leadId: null,
        services
      });
    }
  });
  return out;
}

export function buildCustomers(leads: Lead[], models: ModelMetric[], analysisDate: string): Customer[] {
  const dealers = [...new Set(leads.map((l) => l.dealerCode))];
  return [...leads.map(customerFromLead), ...loyalCustomers(dealers, models, analysisDate)];
}

/** Mensagem de WhatsApp adequada ao perfil do cliente */
export function profileMessage(customer: Customer): string {
  const first = customer.name.split(" ")[0];
  const model = titleCase(customer.vehicle.modelName);
  const texts: Record<Customer["profile"], string> = {
    fiel: `Olá, ${first}! Obrigado por cuidar do seu ${model} na rede Ford. A próxima revisão está chegando e reservamos um horário com benefício de fidelidade para você.`,
    abandono: `Olá, ${first}! Sentimos sua falta na concessionária Ford. Preparamos um check-up de retorno gratuito para o seu ${model}, com condição especial na primeira revisão.`,
    esquecido: `Olá, ${first}! Passando para lembrar que a revisão do seu ${model} está pendente. Temos horários nesta semana. Posso reservar um para você?`,
    economico: `Olá, ${first}! Montamos um pacote de revisão com preço fechado para o seu ${model}, com peças originais Motorcraft. Quer receber o orçamento?`
  };
  return texts[customer.profile];
}

export function matchesCustomer(c: Customer, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return [c.name, c.vehicle.modelName, c.vehicle.vinMask, c.dealerCode, c.phone].some((v) => normalize(v).includes(q));
}

export function sortByRisk(items: Customer[]): Customer[] {
  return [...items].sort((a, b) => b.riskScore - a.riskScore || b.daysSinceService - a.daysSinceService);
}

export function profileCounts(items: Customer[]): Record<CustomerProfile, number> {
  const counts: Record<CustomerProfile, number> = { fiel: 0, abandono: 0, esquecido: 0, economico: 0 };
  items.forEach((c) => {
    counts[c.profile] += 1;
  });
  return counts;
}

// ---------------------------------------------------------------------------
// Idade do veículo (o Service Share despenca a partir de ~4 anos de uso)
// ---------------------------------------------------------------------------

export const AGE_BUCKETS = [
  { key: "0-3", label: "até 3", min: 0, max: 3 },
  { key: "4", label: "4 anos", min: 4, max: 4 },
  { key: "5", label: "5 anos", min: 5, max: 5 },
  { key: "6", label: "6 anos", min: 6, max: 6 },
  { key: "7+", label: "7+", min: 7, max: 99 }
] as const;

export function vehicleAge(modelYear: number | null, analysisDate: string): number | null {
  return modelYear ? Math.max(0, parseISODate(analysisDate).getFullYear() - modelYear) : null;
}

export function riskByAge(leads: Pick<Lead, "modelYear">[], analysisDate: string): { key: string; label: string; value: number }[] {
  return AGE_BUCKETS.map((b) => ({
    key: b.key,
    label: b.label,
    value: leads.filter((l) => {
      const age = vehicleAge(l.modelYear, analysisDate);
      return age !== null && age >= b.min && age <= b.max;
    }).length
  }));
}
