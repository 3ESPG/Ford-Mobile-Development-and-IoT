import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { drivingScore, initialDriving, reduceDriving } from "../src/domain/driving";
import { connectedFleet } from "../src/domain/fleet";
import { contactMessage, scoreFactors, sortQueue, type LeadWithState } from "../src/domain/leads";
import { nextWorkshopDays, serviceForAlert } from "../src/domain/schedule";
import { createSimState, evaluateRules, healthScore, injectFault, stepSim, type TelemetryFrame } from "../src/domain/telemetry";
import type { Lead } from "../src/domain/types";
import { conversionRate } from "../src/state/selectors.logic";

const baseLead: Lead = {
  id: "TESTVIN00001",
  vinMask: "TESTVI...0001",
  dealerCode: "4146",
  modelName: "RANGER",
  modelYear: 2023,
  lastServiceDate: "2023-03-14",
  daysSinceService: 1147,
  serviceCount: 1,
  lastKm: 11541,
  estimatedKmPerYear: 40504,
  nextDueDate: "2024-03-13",
  warrantyEndDate: "2025-11-29",
  priority: "Alta",
  score: 93,
  reason: "1147 dias sem serviço, baixo histórico na rede, sem agendamento digital",
  recommendedAction: "Acionamento prioritário da concessionária"
};

const healthyFrame: TelemetryFrame = {
  vin: "X",
  ts: 0,
  ignition: true,
  speedKmh: 60,
  rpm: 2000,
  odometerKm: 50000,
  fuelPct: 50,
  oilLifePct: 80,
  batteryV: 14.1,
  coolantC: 90,
  tirePsi: { fl: 34, fr: 34, rl: 34, rr: 34 },
  dtc: [],
  kmToService: 8000
};

describe("score explicável do lead", () => {
  it("reconstrói exatamente o score do pipeline de dados", () => {
    const factors = scoreFactors(baseLead, "2026-05-04");
    const total = factors.reduce((s, f) => s + f.points, 0);
    assert.equal(Math.min(100, total), baseLead.score);
  });

  it("marca dados ausentes como não disponíveis", () => {
    const factors = scoreFactors({ ...baseLead, estimatedKmPerYear: null, warrantyEndDate: null }, "2026-05-04");
    assert.match(factors.find((f) => f.key === "usage")!.detail, /não disponível/);
    assert.match(factors.find((f) => f.key === "warranty")!.detail, /não disponível/);
  });
});

describe("jornada do cliente", () => {
  it("personaliza a mensagem para cliente há muito tempo fora da rede", () => {
    const msg = contactMessage(baseLead, "4146");
    assert.match(msg, /Ranger/);
    assert.match(msg, /meses sem passar pela rede Ford/);
  });

  it("prioriza leads com alerta IoT aberto no topo da fila", () => {
    const a: LeadWithState = { ...baseLead, id: "A", score: 95, status: "novo", iotAlert: null };
    const b: LeadWithState = {
      ...baseLead,
      id: "B",
      score: 60,
      status: "novo",
      iotAlert: { id: 1, vin: "B", leadId: "B", code: "OIL_LOW", severity: "warning", title: "t", message: "m", createdAt: "", acknowledged: false }
    };
    assert.deepEqual(sortQueue([a, b]).map((l) => l.id), ["B", "A"]);
  });

  it("calcula a conversão do funil", () => {
    assert.equal(conversionRate({ novo: 5, contatado: 2, agendado: 1, retido: 1, perdido: 0 }), 50);
    assert.equal(conversionRate({ novo: 5, contatado: 0, agendado: 0, retido: 0, perdido: 0 }), 0);
  });
});

describe("agenda", () => {
  it("não oferece domingos", () => {
    const days = nextWorkshopDays(new Date(2026, 8, 25), 8); // sexta-feira
    days.forEach((d) => assert.notEqual(new Date(`${d}T12:00:00`).getDay(), 0));
    assert.equal(days.length, 8);
    assert.equal(days[0], "2026-09-26");
  });

  it("sugere o serviço pelo código do alerta", () => {
    assert.equal(serviceForAlert("OIL_LOW"), "oleo");
    assert.equal(serviceForAlert("TIRE_FL"), "freios");
    assert.equal(serviceForAlert("DTC_P0301"), "diagnostico");
    assert.equal(serviceForAlert(undefined), "revisao");
  });
});

describe("regras de telemetria IoT", () => {
  it("veículo saudável não gera alertas", () => {
    assert.deepEqual(evaluateRules(healthyFrame), []);
    assert.equal(healthScore([]), 100);
  });

  it("detecta óleo baixo, pneu vazio, superaquecimento e DTC", () => {
    const hits = evaluateRules({ ...healthyFrame, oilLifePct: 12, kmToService: 1200, tirePsi: { ...healthyFrame.tirePsi, fl: 25 }, coolantC: 110, dtc: ["P0301"] });
    const codes = hits.map((h) => h.code);
    assert.ok(codes.includes("OIL_LOW"));
    assert.ok(codes.includes("TIRE_FL"));
    assert.ok(codes.includes("COOLANT_HIGH"));
    assert.ok(codes.includes("DTC_P0301"));
    assert.ok(healthScore(hits) < 20);
  });

  it("simulação é determinística e o cenário 'oleo' dispara alerta", () => {
    let a = createSimState(baseLead, "oleo");
    let b = createSimState(baseLead, "oleo");
    for (let i = 0; i < 10; i += 1) {
      a = stepSim(a);
      b = stepSim(b);
    }
    assert.equal(a.frame.odometerKm, b.frame.odometerKm);
    assert.ok(evaluateRules(a.frame).some((h) => h.code === "OIL_LOW"));
  });

  it("injeção de falha adiciona o DTC uma única vez", () => {
    let s = createSimState(baseLead, "saudavel");
    s = injectFault(injectFault(s, "P0301"), "P0301");
    assert.deepEqual(s.frame.dtc, ["P0301"]);
  });

  it("monta a frota conectada com um veículo por modelo", () => {
    const fleet = connectedFleet([baseLead, { ...baseLead, id: "2" }, { ...baseLead, id: "3", modelName: "KA" }]);
    assert.equal(fleet.length, 2);
    assert.notEqual(fleet[0].scenario, fleet[1].scenario);
  });
});

describe("sensor de condução (acelerômetro)", () => {
  const rest = (t: number) => ({ x: 0, y: 0, z: 1, t });
  const brake = (t: number) => ({ x: 0.9, y: 0, z: 1, t }); // 0,9 g longitudinal

  it("em repouso a aceleração linear é ~0 g", () => {
    let s = initialDriving;
    for (let t = 0; t < 2000; t += 200) s = reduceDriving(s, rest(t));
    assert.ok(s.currentG < 0.01);
    assert.equal(s.harshEvents, 0);
  });

  it("conta frenagens bruscas com debounce", () => {
    let s = initialDriving;
    for (let t = 0; t < 1000; t += 200) s = reduceDriving(s, rest(t));
    s = reduceDriving(s, brake(1000));
    s = reduceDriving(s, brake(1200)); // mesmo evento (debounce)
    for (let t = 1400; t < 4000; t += 200) s = reduceDriving(s, rest(t));
    s = reduceDriving(s, brake(4000));
    assert.equal(s.harshEvents, 2);
    assert.equal(drivingScore(s), 84);
  });
});

describe("formatação pt-BR", () => {
  it("formata números compactos e busca sem acento", async () => {
    const { compactNumber, normalize } = await import("../src/domain/format");
    assert.equal(compactNumber(175554), "175,6 mil");
    assert.equal(compactNumber(1234567), "1,2 mi");
    assert.equal(compactNumber(null), "—");
    assert.equal(normalize("Revisão Periódica"), "revisao periodica");
  });
});
