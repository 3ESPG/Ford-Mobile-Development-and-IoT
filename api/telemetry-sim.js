/**
 * Simulador de telemetria do lado do servidor (espelho de src/domain/telemetry.ts).
 * Mantém um estado por VIN para que os modos HTTP e WebSocket do app
 * recebam uma série contínua e coerente de leituras.
 */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const SCENARIOS = ["oleo", "bateria", "pneu", "saudavel", "superaquecimento"];

function createSimState(lead, scenario) {
  const safeScenario = SCENARIOS.includes(scenario) ? scenario : "saudavel";
  const seed = hashString(lead.id);
  const baseKm = (lead.lastKm || 20000) + ((lead.estimatedKmPerYear || 12000) * Math.min(lead.daysSinceService || 0, 900)) / 365;
  const oil = { oleo: 13, bateria: 58, pneu: 71, saudavel: 88, superaquecimento: 64 }[safeScenario];
  return {
    scenario: safeScenario,
    tick: 0,
    seed,
    targetSpeed: 60,
    frame: {
      vin: lead.id,
      ts: Date.now(),
      ignition: true,
      speedKmh: 0,
      rpm: 850,
      odometerKm: Math.round(baseKm),
      fuelPct: 40 + (seed % 50),
      oilLifePct: oil,
      batteryV: safeScenario === "bateria" ? 12.9 : 14.1,
      coolantC: 72,
      tirePsi: { fl: safeScenario === "pneu" ? 29.5 : 34, fr: 34, rl: 33.5, rr: 33.5 },
      dtc: [],
      kmToService: Math.round(10000 * (oil / 100))
    }
  };
}

function stepSim(state) {
  const r = rng(state.seed + state.tick * 7919);
  const f = state.frame;
  const tick = state.tick + 1;
  const targetSpeed = tick % 12 === 0 ? Math.round(20 + r() * 90) : state.targetSpeed;
  const speed = clamp(f.speedKmh + (targetSpeed - f.speedKmh) * 0.35 + (r() - 0.5) * 6, 0, 130);
  const kmDriven = speed / 60;
  const rpm = speed < 2 ? 820 + r() * 60 : 1300 + speed * 22 + (r() - 0.5) * 200;
  let coolant = f.coolantC + (90 - f.coolantC) * 0.12 + (r() - 0.5) * 0.8;
  if (state.scenario === "superaquecimento" && tick > 15) coolant = Math.min(116, f.coolantC + 1.1 + r() * 0.6);
  const leak = state.scenario === "pneu" ? 0.12 : 0.002;
  const dtc = [...f.dtc];
  if (state.scenario === "superaquecimento" && coolant >= 108 && !dtc.includes("P0217")) dtc.push("P0217");
  const oilLife = clamp(f.oilLifePct - kmDriven / 100, 0, 100);
  const batteryBase = state.scenario === "bateria" ? 12.95 : 14.1;
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
      tirePsi: {
        fl: round(clamp(f.tirePsi.fl - leak * r() * 2 + (r() - 0.5) * 0.05, 18, 40)),
        fr: round(clamp(f.tirePsi.fr + (r() - 0.5) * 0.05, 18, 40)),
        rl: round(clamp(f.tirePsi.rl + (r() - 0.5) * 0.05, 18, 40)),
        rr: round(clamp(f.tirePsi.rr + (r() - 0.5) * 0.05, 18, 40))
      },
      dtc,
      kmToService: Math.max(0, Math.round(10000 * (oilLife / 100)))
    }
  };
}

function injectFault(state, code) {
  if (state.frame.dtc.includes(code)) return state;
  return { ...state, frame: { ...state.frame, dtc: [...state.frame.dtc, code] } };
}

module.exports = { createSimState, stepSim, injectFault, SCENARIOS };
