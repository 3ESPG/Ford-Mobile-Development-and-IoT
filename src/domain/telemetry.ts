/**
 * Telemetria de veículo conectado (simulação de um módulo OBD-II/TCU).
 * Funções puras: podem rodar no app (modo simulado) e são espelhadas na API (modos HTTP/WebSocket).
 */
import type { AlertSeverity, Lead } from "./types";

const br = (v: number, d = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

export type TirePressures = { fl: number; fr: number; rl: number; rr: number };

export type TelemetryFrame = {
  vin: string;
  ts: number;
  ignition: boolean;
  speedKmh: number;
  rpm: number;
  odometerKm: number;
  fuelPct: number;
  oilLifePct: number;
  batteryV: number;
  coolantC: number;
  tirePsi: TirePressures;
  dtc: string[];
  kmToService: number;
};

export type Scenario = "oleo" | "bateria" | "pneu" | "saudavel" | "superaquecimento";

export const SCENARIOS: Record<Scenario, string> = {
  oleo: "Óleo no fim da vida útil",
  bateria: "Alternador com baixa carga",
  pneu: "Perda lenta de pressão",
  saudavel: "Veículo saudável",
  superaquecimento: "Aquecimento do motor"
};

const SCENARIO_ORDER: Scenario[] = ["oleo", "pneu", "saudavel", "bateria", "superaquecimento"];

export type SimState = { frame: TelemetryFrame; scenario: Scenario; tick: number; targetSpeed: number; seed: number };

/** PRNG determinístico (mulberry32) para simulação reproduzível */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function scenarioFor(index: number): Scenario {
  return SCENARIO_ORDER[index % SCENARIO_ORDER.length];
}

export function createSimState(lead: Pick<Lead, "id" | "lastKm" | "estimatedKmPerYear" | "daysSinceService">, scenario: Scenario): SimState {
  const seed = hashString(lead.id);
  const baseKm = (lead.lastKm || 20000) + ((lead.estimatedKmPerYear || 12000) * Math.min(lead.daysSinceService, 900)) / 365;
  const oil = { oleo: 13, bateria: 58, pneu: 71, saudavel: 88, superaquecimento: 64 }[scenario];
  const odometerKm = Math.round(baseKm);
  const serviceInterval = 10000;
  return {
    scenario,
    tick: 0,
    seed,
    targetSpeed: 60,
    frame: {
      vin: lead.id,
      ts: Date.now(),
      ignition: true,
      speedKmh: 0,
      rpm: 850,
      odometerKm,
      fuelPct: 40 + (seed % 50),
      oilLifePct: oil,
      batteryV: scenario === "bateria" ? 12.9 : 14.1,
      coolantC: 72,
      tirePsi: { fl: scenario === "pneu" ? 29.5 : 34, fr: 34, rl: 33.5, rr: 33.5 },
      dtc: [],
      kmToService: Math.round(serviceInterval * (oil / 100))
    }
  };
}

/** Avança a simulação em 1 tick (1 s real ≈ 1 min de uso do veículo) */
export function stepSim(state: SimState): SimState {
  const r = rng(state.seed + state.tick * 7919);
  const f = state.frame;
  const tick = state.tick + 1;
  const targetSpeed = tick % 12 === 0 ? Math.round(20 + r() * 90) : state.targetSpeed;
  const speed = clamp(f.speedKmh + (targetSpeed - f.speedKmh) * 0.35 + (r() - 0.5) * 6, 0, 130);
  const kmDriven = speed / 60; // 1 minuto simulado
  const rpm = speed < 2 ? 820 + r() * 60 : 1300 + speed * 22 + (r() - 0.5) * 200;

  let coolant = f.coolantC + (90 - f.coolantC) * 0.12 + (r() - 0.5) * 0.8;
  if (state.scenario === "superaquecimento" && tick > 15) coolant = Math.min(116, f.coolantC + 1.1 + r() * 0.6);

  const leak = state.scenario === "pneu" ? 0.12 : 0.002;
  const tire = {
    fl: round(clamp(f.tirePsi.fl - leak * r() * 2 + (r() - 0.5) * 0.05, 18, 40)),
    fr: round(clamp(f.tirePsi.fr + (r() - 0.5) * 0.05, 18, 40)),
    rl: round(clamp(f.tirePsi.rl + (r() - 0.5) * 0.05, 18, 40)),
    rr: round(clamp(f.tirePsi.rr + (r() - 0.5) * 0.05, 18, 40))
  };

  const batteryBase = state.scenario === "bateria" ? 12.95 : 14.1;
  const dtc = [...f.dtc];
  if (state.scenario === "superaquecimento" && coolant >= 108 && !dtc.includes("P0217")) dtc.push("P0217");

  const oilLife = clamp(f.oilLifePct - kmDriven / 100, 0, 100);
  return {
    ...state,
    tick,
    targetSpeed,
    frame: {
      ...f,
      ts: Date.now(),
      speedKmh: round(speed, 0),
      rpm: Math.round(rpm),
      odometerKm: round(f.odometerKm + kmDriven, 1),
      fuelPct: round(clamp(f.fuelPct - kmDriven * 0.012, 3, 100)),
      oilLifePct: round(oilLife),
      batteryV: round(batteryBase + (r() - 0.5) * 0.12, 2),
      coolantC: round(coolant),
      tirePsi: tire,
      dtc,
      kmToService: Math.max(0, Math.round(10000 * (oilLife / 100)))
    }
  };
}

/** Injeta uma falha (usado no botão "Simular falha" da demonstração) */
export function injectFault(state: SimState, code = "P0301"): SimState {
  if (state.frame.dtc.includes(code)) return state;
  return { ...state, frame: { ...state.frame, dtc: [...state.frame.dtc, code] } };
}

// ---------------------------------------------------------------------------
// Motor de regras: telemetria → alertas → leads preditivos
// ---------------------------------------------------------------------------

export type RuleHit = { code: string; severity: AlertSeverity; title: string; message: string };

const TIRE_NAMES: Record<keyof TirePressures, string> = { fl: "dianteiro esquerdo", fr: "dianteiro direito", rl: "traseiro esquerdo", rr: "traseiro direito" };

export const DTC_DESCRIPTIONS: Record<string, string> = {
  P0301: "Falha de ignição no cilindro 1",
  P0217: "Superaquecimento do motor",
  P0420: "Eficiência do catalisador abaixo do limite",
  P0562: "Tensão do sistema baixa"
};

export function evaluateRules(frame: TelemetryFrame): RuleHit[] {
  const hits: RuleHit[] = [];
  if (frame.oilLifePct <= 5) {
    hits.push({ code: "OIL_CRITICAL", severity: "critical", title: "Óleo no limite", message: `Vida útil do óleo em ${br(frame.oilLifePct)}%. Troca imediata recomendada.` });
  } else if (frame.oilLifePct <= 15) {
    hits.push({ code: "OIL_LOW", severity: "warning", title: "Troca de óleo próxima", message: `Vida útil do óleo em ${br(frame.oilLifePct)}% (~${frame.kmToService.toLocaleString("pt-BR")} km restantes).` });
  }

  if (frame.ignition && frame.speedKmh > 0 && frame.batteryV < 13.2) {
    hits.push({ code: "BATTERY_CHARGE", severity: "warning", title: "Baixa carga do alternador", message: `Tensão de ${br(frame.batteryV, 2)} V com motor em funcionamento (esperado ≥ 13,5 V).` });
  } else if (frame.batteryV < 11.9) {
    hits.push({ code: "BATTERY_LOW", severity: "critical", title: "Bateria descarregada", message: `Tensão de ${br(frame.batteryV, 2)} V.` });
  }

  (Object.keys(frame.tirePsi) as Array<keyof TirePressures>).forEach((pos) => {
    const psi = frame.tirePsi[pos];
    if (psi < 26) {
      hits.push({ code: `TIRE_${pos.toUpperCase()}`, severity: "critical", title: "Pneu muito vazio", message: `Pneu ${TIRE_NAMES[pos]} com ${br(psi)} psi.` });
    } else if (psi < 30) {
      hits.push({ code: `TIRE_${pos.toUpperCase()}`, severity: "warning", title: "Pressão de pneu baixa", message: `Pneu ${TIRE_NAMES[pos]} com ${br(psi)} psi (ideal 32–35).` });
    }
  });

  if (frame.coolantC >= 108) {
    hits.push({ code: "COOLANT_HIGH", severity: "critical", title: "Motor superaquecendo", message: `Temperatura do líquido de arrefecimento em ${br(frame.coolantC)} °C.` });
  }

  frame.dtc.forEach((code) => {
    hits.push({ code: `DTC_${code}`, severity: "critical", title: `Código de falha ${code}`, message: DTC_DESCRIPTIONS[code] || "Código de diagnóstico registrado pela ECU." });
  });

  if (frame.kmToService <= 1000 && frame.oilLifePct > 15) {
    hits.push({ code: "SERVICE_DUE", severity: "info", title: "Revisão programada próxima", message: `Faltam ${frame.kmToService.toLocaleString("pt-BR")} km para a próxima revisão.` });
  }
  return hits;
}

const PENALTY: Record<AlertSeverity, number> = { critical: 35, warning: 15, info: 5 };

export function healthScore(hits: RuleHit[]): number {
  return Math.max(0, 100 - hits.reduce((sum, h) => sum + PENALTY[h.severity], 0));
}

export function severityRank(s: AlertSeverity): number {
  return s === "critical" ? 3 : s === "warning" ? 2 : 1;
}
