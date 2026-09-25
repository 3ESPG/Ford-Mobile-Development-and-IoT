import type { Appointment, AppointmentStatus, Interaction, IotAlert, LeadStatus } from "@/domain/types";

export type CrmSnapshot = {
  statuses: Record<string, LeadStatus>;
  interactions: Interaction[];
  appointments: Appointment[];
  alerts: IotAlert[];
};

/**
 * Contrato do repositório local. Implementações:
 *  - crmStore.ts      → SQLite (expo-sqlite) em Android/iOS
 *  - crmStore.web.ts  → localStorage (apenas para a pré-visualização web)
 * O Metro escolhe o arquivo pela extensão de plataforma.
 */
export interface CrmStore {
  init(): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  load(): Promise<CrmSnapshot>;
  setLeadStatus(leadId: string, status: LeadStatus): Promise<void>;
  addInteraction(input: Omit<Interaction, "id" | "createdAt">): Promise<number>;
  addAppointment(input: Omit<Appointment, "id" | "createdAt" | "status">): Promise<number>;
  updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<void>;
  upsertAlert(input: Omit<IotAlert, "id" | "createdAt" | "acknowledged">): Promise<{ id: number; created: boolean }>;
  acknowledgeAlert(id: number): Promise<void>;
  reset(): Promise<void>;
}
