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
