/**
 * Implementação web (pré-visualização no navegador) do mesmo contrato do SQLite.
 * Persistência em localStorage — no APK Android é usado o SQLite (crmStore.ts).
 */
import type { Appointment, Interaction, IotAlert, LeadStatus, Reminder } from "@/domain/types";
import type { CrmSnapshot, CrmStore } from "./types";

const KEY = "ford-service-pulse:v1";

type State = CrmSnapshot & { settings: Record<string, string>; seq: number };

const empty = (): State => ({ statuses: {}, interactions: [], appointments: [], alerts: [], reminders: [], settings: {}, seq: 1 });

let state: State = empty();

function read(): State {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return raw ? { ...empty(), ...(JSON.parse(raw) as State) } : empty();
  } catch {
    return empty();
  }
}

function write() {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
  } catch {
    // armazenamento indisponível (modo privado): segue em memória
  }
}

const now = () => new Date().toISOString();
const nextId = () => state.seq++;

export const crmStore: CrmStore = {
  async init() {
    state = read();
  },
  async getSetting(key) {
    return state.settings[key] ?? null;
  },
  async setSetting(key, value) {
    state.settings[key] = value;
    write();
  },
  async load() {
    return {
      statuses: { ...state.statuses },
      interactions: [...state.interactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      appointments: [...state.appointments].sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot)),
      alerts: [...state.alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      reminders: [...state.reminders].sort((a, b) => a.fireAt.localeCompare(b.fireAt))
    };
  },
  async setLeadStatus(leadId: string, status: LeadStatus) {
    state.statuses[leadId] = status;
    write();
  },
  async addInteraction(input) {
    const item: Interaction = { ...input, id: nextId(), createdAt: now() };
    state.interactions.push(item);
    write();
    return item.id;
  },
  async addAppointment(input) {
    const item: Appointment = { ...input, id: nextId(), status: "confirmado", createdAt: now() };
    state.appointments.push(item);
    write();
    return item.id;
  },
  async addReminder(input) {
    const item: Reminder = { ...input, id: nextId(), createdAt: now() };
    state.reminders.push(item);
    write();
    return item.id;
  },
  async deleteReminder(id) {
    state.reminders = state.reminders.filter((r) => r.id !== id);
    write();
  },
  async updateAppointmentStatus(id, status) {
    state.appointments = state.appointments.map((a) => (a.id === id ? { ...a, status } : a));
    write();
  },
  async upsertAlert(input) {
    const existing = state.alerts.find((a) => a.vin === input.vin && a.code === input.code && !a.acknowledged);
    if (existing) return { id: existing.id, created: false };
    const item: IotAlert = { ...input, id: nextId(), createdAt: now(), acknowledged: false };
    state.alerts.push(item);
    write();
    return { id: item.id, created: true };
  },
  async acknowledgeAlert(id) {
    state.alerts = state.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
    write();
  },
  async reset() {
    state = empty();
    write();
  }
};
