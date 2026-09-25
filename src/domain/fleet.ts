import { scenarioFor, type Scenario } from "./telemetry";
import type { Lead } from "./types";

export type ConnectedVehicle = { lead: Lead; scenario: Scenario };

/**
 * "Frota conectada" da demonstração: um veículo por modelo entre os leads
 * (ou os primeiros veículos da loja, com uniqueModels = false), cada um com
 * um cenário de telemetria diferente.
 */
export function connectedFleet(leads: Lead[], size = 5, uniqueModels = true): ConnectedVehicle[] {
  const seen = new Set<string>();
  const picked: Lead[] = [];
  for (const lead of leads) {
    if (!uniqueModels || !seen.has(lead.modelName)) {
      seen.add(lead.modelName);
      picked.push(lead);
    }
    if (picked.length >= size) break;
  }
  return picked.map((lead, index) => ({ lead, scenario: scenarioFor(index) }));
}
