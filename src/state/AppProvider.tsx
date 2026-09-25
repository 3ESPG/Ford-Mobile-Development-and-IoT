import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import seed from "../../api/data/vin-share-summary.json";
import { DEFAULT_API_URL, getSnapshot } from "@/api/client";
import { crmStore } from "@/data/store/crmStore";
import type { CrmSnapshot } from "@/data/store/types";
import { connectedFleet, type ConnectedVehicle } from "@/domain/fleet";
import type { LeadWithState } from "@/domain/leads";
import type { RuleHit } from "@/domain/telemetry";
import type {
  AppSettings,
  Appointment,
  ContactChannel,
  ContactOutcome,
  DataSource,
  IotAlert,
  Lead,
  LeadStatus,
  Profile,
  Snapshot
} from "@/domain/types";
import { OUTCOMES } from "@/domain/leads";

const embedded = seed as unknown as Snapshot;

const DEFAULT_SETTINGS: AppSettings = { profile: null, apiUrl: DEFAULT_API_URL, telemetryMode: "simulado" };

type AppContextValue = {
  ready: boolean;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  signIn: (profile: Profile) => Promise<void>;
  signOut: () => Promise<void>;

  snapshot: Snapshot;
  source: DataSource;
  syncing: boolean;
  syncError: string | null;
  sync: () => Promise<void>;

  crm: CrmSnapshot;
  leads: LeadWithState[];
  leadById: (id: string) => LeadWithState | undefined;
  fleet: ConnectedVehicle[];

  logContact: (lead: Lead, channel: ContactChannel, outcome: ContactOutcome, note: string) => Promise<void>;
  scheduleService: (lead: Lead, input: { serviceType: string; date: string; slot: string; dealerCode: string }) => Promise<void>;
  setAppointmentStatus: (appointment: Appointment, status: Appointment["status"]) => Promise<void>;
  setLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  raiseAlert: (vin: string, leadId: string | null, hit: RuleHit) => Promise<boolean>;
  acknowledgeAlert: (alert: IotAlert) => Promise<void>;
  resetLocalData: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_CRM: CrmSnapshot = { statuses: {}, interactions: [], appointments: [], alerts: [] };

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [snapshot, setSnapshot] = useState<Snapshot>(embedded);
  const [source, setSource] = useState<DataSource>("embedded");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [crm, setCrm] = useState<CrmSnapshot>(EMPTY_CRM);

  const reloadCrm = useCallback(async () => setCrm(await crmStore.load()), []);

  const syncFrom = useCallback(async (apiUrl: string) => {
    if (!apiUrl) {
      setSnapshot(embedded);
      setSource("embedded");
      setSyncError(null);
      return;
    }
    setSyncing(true);
    try {
      const remote = await getSnapshot(apiUrl);
      setSnapshot(remote);
      setSource("api");
      setSyncError(null);
    } catch (err) {
      // Offline-first: mantém a base embarcada e informa o motivo
      setSource("embedded");
      setSyncError(err instanceof Error ? err.message : "Falha na sincronização");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await crmStore.init();
        const raw = await crmStore.getSetting("app_settings");
        const stored = raw ? ({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as AppSettings) : DEFAULT_SETTINGS;
        setSettings(stored);
        await reloadCrm();
        syncFrom(stored.apiUrl);
      } finally {
        setReady(true);
      }
    })();
  }, [reloadCrm, syncFrom]);

  const persistSettings = useCallback(async (next: AppSettings) => {
    setSettings(next);
    await crmStore.setSetting("app_settings", JSON.stringify(next));
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch };
      await persistSettings(next);
      if (patch.apiUrl !== undefined && patch.apiUrl !== settings.apiUrl) await syncFrom(next.apiUrl);
    },
    [settings, persistSettings, syncFrom]
  );

  const signIn = useCallback((profile: Profile) => persistSettings({ ...settings, profile }), [settings, persistSettings]);
  const signOut = useCallback(() => persistSettings({ ...settings, profile: null }), [settings, persistSettings]);

  const leads = useMemo<LeadWithState[]>(() => {
    const openAlerts = new Map<string, IotAlert>();
    crm.alerts.forEach((a) => {
      if (a.leadId && !a.acknowledged) {
        const current = openAlerts.get(a.leadId);
        if (!current || (a.severity === "critical" && current.severity !== "critical")) openAlerts.set(a.leadId, a);
      }
    });
    return snapshot.leads.map((lead) => ({ ...lead, status: crm.statuses[lead.id] || "novo", iotAlert: openAlerts.get(lead.id) || null }));
  }, [snapshot.leads, crm]);

  const leadIndex = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const leadById = useCallback((id: string) => leadIndex.get(id), [leadIndex]);
  const fleet = useMemo(() => connectedFleet(snapshot.leads), [snapshot.leads]);

  const setLeadStatus = useCallback(
    async (leadId: string, status: LeadStatus) => {
      await crmStore.setLeadStatus(leadId, status);
      await reloadCrm();
    },
    [reloadCrm]
  );

  const logContact = useCallback(
    async (lead: Lead, channel: ContactChannel, outcome: ContactOutcome, note: string) => {
      await crmStore.addInteraction({ leadId: lead.id, channel, outcome, note });
      const current = crm.statuses[lead.id];
      // não rebaixa um lead já agendado/retido
      if (current !== "agendado" && current !== "retido") await crmStore.setLeadStatus(lead.id, OUTCOMES[outcome].next);
      await reloadCrm();
    },
    [crm.statuses, reloadCrm]
  );

  const scheduleService = useCallback(
    async (lead: Lead, input: { serviceType: string; date: string; slot: string; dealerCode: string }) => {
      await crmStore.addAppointment({ leadId: lead.id, dealerCode: input.dealerCode, modelName: lead.modelName, vinMask: lead.vinMask, serviceType: input.serviceType, date: input.date, slot: input.slot });
      await crmStore.setLeadStatus(lead.id, "agendado");
      await reloadCrm();
    },
    [reloadCrm]
  );

  const setAppointmentStatus = useCallback(
    async (appointment: Appointment, status: Appointment["status"]) => {
      await crmStore.updateAppointmentStatus(appointment.id, status);
      if (status === "concluido") await crmStore.setLeadStatus(appointment.leadId, "retido");
      if (status === "cancelado") await crmStore.setLeadStatus(appointment.leadId, "contatado");
      await reloadCrm();
    },
    [reloadCrm]
  );

  const raiseAlert = useCallback(
    async (vin: string, leadId: string | null, hit: RuleHit) => {
      const { created } = await crmStore.upsertAlert({ vin, leadId, code: hit.code, severity: hit.severity, title: hit.title, message: hit.message });
      if (created) await reloadCrm();
      return created;
    },
    [reloadCrm]
  );

  const acknowledgeAlert = useCallback(
    async (alert: IotAlert) => {
      await crmStore.acknowledgeAlert(alert.id);
      await reloadCrm();
    },
    [reloadCrm]
  );

  const resetLocalData = useCallback(async () => {
    const keep = settings;
    await crmStore.reset();
    await crmStore.setSetting("app_settings", JSON.stringify(keep));
    await reloadCrm();
  }, [settings, reloadCrm]);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      settings,
      updateSettings,
      signIn,
      signOut,
      snapshot,
      source,
      syncing,
      syncError,
      sync: () => syncFrom(settings.apiUrl),
      crm,
      leads,
      leadById,
      fleet,
      logContact,
      scheduleService,
      setAppointmentStatus,
      setLeadStatus,
      raiseAlert,
      acknowledgeAlert,
      resetLocalData
    }),
    [ready, settings, updateSettings, signIn, signOut, snapshot, source, syncing, syncError, syncFrom, crm, leads, leadById, fleet, logContact, scheduleService, setAppointmentStatus, setLeadStatus, raiseAlert, acknowledgeAlert, resetLocalData]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
