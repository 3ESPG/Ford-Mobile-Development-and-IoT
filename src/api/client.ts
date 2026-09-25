import Constants from "expo-constants";
import type { Snapshot } from "@/domain/types";
import type { TelemetryFrame } from "@/domain/telemetry";

/**
 * URL padrão da API (opcional). O app funciona 100% offline com a base embarcada;
 * a API é usada para sincronizar dados e para os modos IoT HTTP/WebSocket.
 * Pode ser definida em build (EXPO_PUBLIC_API_URL) ou em Ajustes, no próprio app.
 */
export const DEFAULT_API_URL: string =
  process.env.EXPO_PUBLIC_API_URL || (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl || "";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

const clean = (base: string) => base.trim().replace(/\/+$/, "");

async function request<T>(base: string, path: string, timeoutMs = 4000): Promise<T> {
  if (!base) throw new ApiError("API não configurada");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${clean(base)}${path}`, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new ApiError(`API respondeu ${response.status}`, response.status);
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === "AbortError") throw new ApiError("Tempo de resposta esgotado");
    throw new ApiError("Servidor inacessível");
  } finally {
    clearTimeout(timer);
  }
}

export function getHealth(base: string) {
  return request<{ ok: boolean; generatedAt: string }>(base, "/health", 3000);
}

export function getSnapshot(base: string) {
  return request<Snapshot>(base, "/api/snapshot", 6000);
}

export function getTelemetry(base: string, vin: string, scenario: string) {
  return request<TelemetryFrame>(base, `/api/vehicles/${encodeURIComponent(vin)}/telemetry?scenario=${scenario}`, 2500);
}

export function telemetrySocketUrl(base: string, vin: string, scenario: string) {
  return `${clean(base).replace(/^http/, "ws")}/ws/telemetry?vin=${encodeURIComponent(vin)}&scenario=${scenario}`;
}

export async function postFault(base: string, vin: string, code: string) {
  const response = await fetch(`${clean(base)}/api/vehicles/${encodeURIComponent(vin)}/faults`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  if (!response.ok) throw new ApiError(`API respondeu ${response.status}`, response.status);
}
