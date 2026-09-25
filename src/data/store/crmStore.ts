import * as SQLite from "expo-sqlite";
import type { Appointment, IotAlert, LeadStatus, Reminder } from "@/domain/types";
import type { CrmSnapshot, CrmStore } from "./types";

const DB_NAME = "ford-service-pulse.db";
const SCHEMA_VERSION = 2;

/** Migrações versionadas via PRAGMA user_version */
const MIGRATIONS: Record<number, string> = {
  1: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lead_status (
      lead_id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('novo','contatado','agendado','retido','perdido')),
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      outcome TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_interactions_lead ON interactions(lead_id);
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL,
      dealer_code TEXT NOT NULL,
      model_name TEXT NOT NULL,
      vin_mask TEXT NOT NULL,
      service_type TEXT NOT NULL,
      date TEXT NOT NULL,
      slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmado',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
    CREATE TABLE IF NOT EXISTS iot_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vin TEXT NOT NULL,
      lead_id TEXT,
      code TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      acknowledged INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_alerts_vin ON iot_alerts(vin, code);
  `,
  // Sprint 3 (versão final): observação no agendamento + lembretes de serviço
  2: `
    ALTER TABLE appointments ADD COLUMN note TEXT NOT NULL DEFAULT '';
    ALTER TABLE appointments ADD COLUMN reminder_id TEXT;
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('revisao','agendamento')),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      fire_at TEXT NOT NULL,
      notification_id TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reminders_customer ON reminders(customer_id);
  `
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
}

const now = () => new Date().toISOString();

type AppointmentRow = {
  id: number; lead_id: string; dealer_code: string; model_name: string; vin_mask: string;
  service_type: string; date: string; slot: string; status: Appointment["status"]; note: string;
  reminder_id: string | null; created_at: string;
};
type ReminderRow = {
  id: number; customer_id: string; kind: Reminder["kind"]; title: string; body: string;
  fire_at: string; notification_id: string | null; created_at: string;
};
type AlertRow = {
  id: number; vin: string; lead_id: string | null; code: string; severity: IotAlert["severity"];
  title: string; message: string; created_at: string; acknowledged: number;
};

export const crmStore: CrmStore = {
  async init() {
    const conn = await db();
    await conn.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    const row = await conn.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    let version = row?.user_version ?? 0;
    while (version < SCHEMA_VERSION) {
      version += 1;
      await conn.withTransactionAsync(async () => {
        await conn.execAsync(MIGRATIONS[version]);
        await conn.execAsync(`PRAGMA user_version = ${version}`);
      });
    }
  },

  async getSetting(key) {
    const conn = await db();
    const row = await conn.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
    return row?.value ?? null;
  },

  async setSetting(key, value) {
    const conn = await db();
    await conn.runAsync("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value);
  },

  async load(): Promise<CrmSnapshot> {
    const conn = await db();
    const [statusRows, interactionRows, appointmentRows, alertRows, reminderRows] = await Promise.all([
      conn.getAllAsync<{ lead_id: string; status: LeadStatus }>("SELECT lead_id, status FROM lead_status"),
      conn.getAllAsync<{ id: number; lead_id: string; channel: string; outcome: string; note: string; created_at: string }>(
        "SELECT * FROM interactions ORDER BY created_at DESC"
      ),
      conn.getAllAsync<AppointmentRow>("SELECT * FROM appointments ORDER BY date ASC, slot ASC"),
      conn.getAllAsync<AlertRow>("SELECT * FROM iot_alerts ORDER BY created_at DESC LIMIT 200"),
      conn.getAllAsync<ReminderRow>("SELECT * FROM reminders ORDER BY fire_at ASC")
    ]);
    return {
      statuses: Object.fromEntries(statusRows.map((r) => [r.lead_id, r.status])),
      interactions: interactionRows.map((r) => ({
        id: r.id,
        leadId: r.lead_id,
        channel: r.channel as never,
        outcome: r.outcome as never,
        note: r.note,
        createdAt: r.created_at
      })),
      appointments: appointmentRows.map((r) => ({
        id: r.id,
        leadId: r.lead_id,
        dealerCode: r.dealer_code,
        modelName: r.model_name,
        vinMask: r.vin_mask,
        serviceType: r.service_type,
        date: r.date,
        slot: r.slot,
        status: r.status,
        note: r.note,
        reminderId: r.reminder_id,
        createdAt: r.created_at
      })),
      alerts: alertRows.map((r) => ({
        id: r.id,
        vin: r.vin,
        leadId: r.lead_id,
        code: r.code,
        severity: r.severity,
        title: r.title,
        message: r.message,
        createdAt: r.created_at,
        acknowledged: r.acknowledged === 1
      })),
      reminders: reminderRows.map((r) => ({
        id: r.id,
        customerId: r.customer_id,
        kind: r.kind,
        title: r.title,
        body: r.body,
        fireAt: r.fire_at,
        notificationId: r.notification_id,
        createdAt: r.created_at
      }))
    };
  },

  async setLeadStatus(leadId, status) {
    const conn = await db();
    await conn.runAsync(
      "INSERT INTO lead_status (lead_id, status, updated_at) VALUES (?, ?, ?) ON CONFLICT(lead_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at",
      leadId,
      status,
      now()
    );
  },

  async addInteraction(input) {
    const conn = await db();
    const result = await conn.runAsync(
      "INSERT INTO interactions (lead_id, channel, outcome, note, created_at) VALUES (?, ?, ?, ?, ?)",
      input.leadId,
      input.channel,
      input.outcome,
      input.note,
      now()
    );
    return result.lastInsertRowId;
  },

  async addAppointment(input) {
    const conn = await db();
    const result = await conn.runAsync(
      "INSERT INTO appointments (lead_id, dealer_code, model_name, vin_mask, service_type, date, slot, status, note, reminder_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmado', ?, ?, ?)",
      input.leadId,
      input.dealerCode,
      input.modelName,
      input.vinMask,
      input.serviceType,
      input.date,
      input.slot,
      input.note,
      input.reminderId,
      now()
    );
    return result.lastInsertRowId;
  },

  async addReminder(input) {
    const conn = await db();
    const result = await conn.runAsync(
      "INSERT INTO reminders (customer_id, kind, title, body, fire_at, notification_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      input.customerId,
      input.kind,
      input.title,
      input.body,
      input.fireAt,
      input.notificationId,
      now()
    );
    return result.lastInsertRowId;
  },

  async deleteReminder(id) {
    const conn = await db();
    await conn.runAsync("DELETE FROM reminders WHERE id = ?", id);
  },

  async updateAppointmentStatus(id, status) {
    const conn = await db();
    await conn.runAsync("UPDATE appointments SET status = ? WHERE id = ?", status, id);
  },

  async upsertAlert(input) {
    const conn = await db();
    const existing = await conn.getFirstAsync<{ id: number }>(
      "SELECT id FROM iot_alerts WHERE vin = ? AND code = ? AND acknowledged = 0",
      input.vin,
      input.code
    );
    if (existing) return { id: existing.id, created: false };
    const result = await conn.runAsync(
      "INSERT INTO iot_alerts (vin, lead_id, code, severity, title, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      input.vin,
      input.leadId,
      input.code,
      input.severity,
      input.title,
      input.message,
      now()
    );
    return { id: result.lastInsertRowId, created: true };
  },

  async acknowledgeAlert(id) {
    const conn = await db();
    await conn.runAsync("UPDATE iot_alerts SET acknowledged = 1 WHERE id = ?", id);
  },

  async reset() {
    const conn = await db();
    await conn.execAsync("DELETE FROM lead_status; DELETE FROM interactions; DELETE FROM appointments; DELETE FROM iot_alerts; DELETE FROM reminders; DELETE FROM settings;");
  }
};
