import { useCallback, useEffect, useRef, useState } from "react";
import { getTelemetry, postFault, telemetrySocketUrl } from "@/api/client";
import type { ConnectedVehicle } from "@/domain/fleet";
import { createSimState, injectFault, stepSim, type SimState, type TelemetryFrame } from "@/domain/telemetry";
import type { TelemetryMode } from "@/domain/types";

export type LinkStatus = "connecting" | "online" | "error";

type TelemetryState = {
  frame: TelemetryFrame | null;
  status: LinkStatus;
  error: string | null;
  latencyMs: number | null;
  speedHistory: number[];
  messages: number;
};

const HISTORY = 30;

/**
 * Fonte de telemetria com 3 modos de conexão (Aula MDI 20):
 *  - simulado  : gerador local no próprio app (funciona offline / no APK sem servidor)
 *  - http      : polling REST a cada 2 s em /api/vehicles/:vin/telemetry
 *  - websocket : stream push em tempo real via ws://.../ws/telemetry
 */
export function useTelemetry(vehicle: ConnectedVehicle | undefined, mode: TelemetryMode, apiUrl: string) {
  const [state, setState] = useState<TelemetryState>({ frame: null, status: "connecting", error: null, latencyMs: null, speedHistory: [], messages: 0 });
  const simRef = useRef<SimState | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const push = useCallback((frame: TelemetryFrame, latencyMs: number | null) => {
    setState((prev) => ({
      frame,
      status: "online",
      error: null,
      latencyMs,
      speedHistory: [...prev.speedHistory, frame.speedKmh].slice(-HISTORY),
      messages: prev.messages + 1
    }));
  }, []);

  const fail = useCallback((message: string) => {
    setState((prev) => ({ ...prev, status: "error", error: message }));
  }, []);

  useEffect(() => {
    if (!vehicle) return;
    setState({ frame: null, status: "connecting", error: null, latencyMs: null, speedHistory: [], messages: 0 });
    const vin = vehicle.lead.id;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    if (mode === "simulado") {
      simRef.current = createSimState(vehicle.lead, vehicle.scenario);
      push(simRef.current.frame, 0);
      timer = setInterval(() => {
        if (!simRef.current) return;
        simRef.current = stepSim(simRef.current);
        push(simRef.current.frame, 0);
      }, 1000);
    } else if (!apiUrl) {
      fail("Configure a URL da API em Ajustes para usar este modo.");
    } else if (mode === "http") {
      const poll = async () => {
        const started = Date.now();
        try {
          const frame = await getTelemetry(apiUrl, vin, vehicle.scenario);
          if (!cancelled) push(frame, Date.now() - started);
        } catch (err) {
          if (!cancelled) fail(err instanceof Error ? err.message : "Falha no polling HTTP");
        }
      };
      poll();
      timer = setInterval(poll, 2000);
    } else {
      try {
        const ws = new WebSocket(telemetrySocketUrl(apiUrl, vin, vehicle.scenario));
        wsRef.current = ws;
        ws.onmessage = (event) => {
          try {
            const frame = JSON.parse(String(event.data)) as TelemetryFrame;
            if (!cancelled) push(frame, Math.max(0, Date.now() - frame.ts));
          } catch {
            // mensagem inválida: ignora
          }
        };
        ws.onerror = () => !cancelled && fail("Não foi possível abrir o WebSocket");
        ws.onclose = () => !cancelled && fail("Conexão WebSocket encerrada");
      } catch {
        fail("URL de WebSocket inválida");
      }
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [vehicle, mode, apiUrl, push, fail]);

  /** Envia um comando de falha para o "veículo" (demonstração de atuação remota) */
  const simulateFault = useCallback(
    async (code = "P0301") => {
      if (!vehicle) return;
      if (mode === "simulado" && simRef.current) {
        simRef.current = injectFault(simRef.current, code);
        push(simRef.current.frame, 0);
      } else if (mode === "websocket" && wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: "fault", code }));
      } else if (mode === "http" && apiUrl) {
        await postFault(apiUrl, vehicle.lead.id, code).catch(() => undefined);
      }
    },
    [vehicle, mode, apiUrl, push]
  );

  return { ...state, simulateFault };
}
