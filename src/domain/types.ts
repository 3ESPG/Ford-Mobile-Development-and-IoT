export type KpiOverview = {
  serviceShare: number;
  activeLast12Vins: number;
  eligibleVins: number;
  serviceOrders: number;
  agendaRate: number;
  avgServicesPerVin: number;
  avgCycleDays: number;
  medianCycleDays: number;
  quarterOrderDelta: number;
  leadCount: number;
  highPriorityLeads: number;
};

export type Meta = {
  source: string;
  generatedAt: string;
  analysisDate: string;
  dateRange: { start: string; end: string };
  methodology: string;
};

export type BreakdownItem = {
  label: string;
  count: number;
  share: number;
};

export type MonthPoint = {
  month: string;
  orders: number;
  uniqueVins: number;
};

export type Dealer = {
  dealerCode: string;
  orders: number;
  uniqueVins: number;
  activeLast12: number;
  serviceShare: number;
  agendaRate: number;
  avgKm: number | null;
  topModel: string;
  topModelShare: number;
  latestServiceDate: string;
  openLeads: number;
};

export type ModelMetric = {
  modelName: string;
  orders: number;
  uniqueVins: number;
  activeLast12: number;
  serviceShare: number;
  avgKm: number | null;
  dealerCount: number;
  latestServiceDate: string;
  riskLeads: number;
};

export type Lead = {
  id: string;
  vinMask: string;
  dealerCode: string;
  modelName: string;
  modelYear: number | null;
  lastServiceDate: string;
  daysSinceService: number;
  serviceCount: number;
  lastKm: number | null;
  estimatedKmPerYear: number | null;
  nextDueDate: string;
  warrantyEndDate: string | null;
  priority: "Alta" | "Media" | "Baixa";
  score: number;
  reason: string;
  recommendedAction: string;
};

export type Insight = {
  title: string;
  value: string;
  description: string;
};

export type OverviewResponse = {
  meta: Meta;
  overview: KpiOverview;
  breakdowns: {
    countries: BreakdownItem[];
    serviceSources: BreakdownItem[];
    maintenanceNumbers: BreakdownItem[];
    statuses: BreakdownItem[];
    segments: BreakdownItem[];
    leadFunnel: BreakdownItem[];
    riskModels: BreakdownItem[];
  };
  monthly: MonthPoint[];
  insights: Insight[];
  models: ModelMetric[];
  dealers: Dealer[];
};

export type Paginated<T> = {
  total: number;
  limit: number;
  offset: number;
  items: T[];
};

export type StrategyResponse = {
  meta: Meta;
  opportunities: {
    lowShareDealers: Dealer[];
    playbook: Array<{
      segment: string;
      trigger: string;
      action: string;
      metric: string;
    }>;
  };
  segments: BreakdownItem[];
  leadFunnel: BreakdownItem[];
  riskModels: BreakdownItem[];
};

// ---------------------------------------------------------------------------
// Sprint 3 — CRM local (SQLite), perfil e IoT
// ---------------------------------------------------------------------------

export type Snapshot = {
  meta: Meta;
  overview: KpiOverview;
  breakdowns: OverviewResponse["breakdowns"];
  monthly: MonthPoint[];
  insights: Insight[];
  models: ModelMetric[];
  dealers: Dealer[];
  leads: Lead[];
  opportunities: StrategyResponse["opportunities"];
};

export type DataSource = "embedded" | "api";

export type LeadStatus = "novo" | "contatado" | "agendado" | "retido" | "perdido";

export type ContactChannel = "whatsapp" | "ligacao" | "email" | "sms";
export type ContactOutcome = "interessado" | "sem_resposta" | "retornar" | "recusou";

export type Interaction = {
  id: number;
  leadId: string;
  channel: ContactChannel;
  outcome: ContactOutcome;
  note: string;
  createdAt: string;
};

export type AppointmentStatus = "confirmado" | "concluido" | "cancelado";

export type Appointment = {
  id: number;
  leadId: string;
  dealerCode: string;
  modelName: string;
  vinMask: string;
  serviceType: string;
  date: string; // YYYY-MM-DD
  slot: string; // HH:mm
  status: AppointmentStatus;
  createdAt: string;
};

export type AlertSeverity = "info" | "warning" | "critical";

export type IotAlert = {
  id: number;
  vin: string;
  leadId: string | null;
  code: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
};

export type UserRole = "consultor" | "gestor";

export type Profile = {
  name: string;
  role: UserRole;
  dealerCode: string | null;
};

export type TelemetryMode = "simulado" | "http" | "websocket";

export type AppSettings = {
  profile: Profile | null;
  apiUrl: string;
  telemetryMode: TelemetryMode;
};
