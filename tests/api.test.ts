import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import WebSocket from "ws";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { server } = require("../api/server.js");

let base = "";
let vin = "";

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const snapshot = await (await fetch(`${base}/api/snapshot`)).json();
  vin = snapshot.leads[0].id;
});

after(() => {
  server.closeAllConnections?.();
  server.close();
});

describe("API REST", () => {
  it("GET /health responde 200", async () => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
  });

  it("GET /api/snapshot traz leads, concessionárias e indicadores", async () => {
    const data = await (await fetch(`${base}/api/snapshot`)).json();
    assert.ok(data.leads.length > 0);
    assert.ok(data.dealers.length > 0);
    assert.equal(typeof data.overview.serviceShare, "number");
  });

  it("filtra leads por prioridade", async () => {
    const page = await (await fetch(`${base}/api/leads?priority=Alta&limit=5`)).json();
    assert.ok(page.items.every((l: { priority: string }) => l.priority === "Alta"));
    assert.equal(page.limit, 5);
  });

  it("recurso inexistente → 404 com erro padronizado", async () => {
    const res = await fetch(`${base}/api/leads/NAOEXISTE`);
    assert.equal(res.status, 404);
    assert.deepEqual(Object.keys((await res.json()).error).sort(), ["code", "message"]);
  });

  it("telemetria HTTP devolve leitura do veículo", async () => {
    const frame = await (await fetch(`${base}/api/vehicles/${vin}/telemetry?scenario=oleo`)).json();
    assert.equal(frame.vin, vin);
    assert.equal(frame.oilLifePct, 13);
  });

  it("POST de falha valida o código DTC (400) e aceita válido (202)", async () => {
    const bad = await fetch(`${base}/api/vehicles/${vin}/faults`, { method: "POST", body: JSON.stringify({ code: "xx" }) });
    assert.equal(bad.status, 400);
    const ok = await fetch(`${base}/api/vehicles/${vin}/faults`, { method: "POST", body: JSON.stringify({ code: "P0301" }) });
    assert.equal(ok.status, 202);
    const frame = await (await fetch(`${base}/api/vehicles/${vin}/telemetry?scenario=oleo`)).json();
    assert.ok(frame.dtc.includes("P0301"));
  });
});

describe("API WebSocket", () => {
  it("envia leituras em stream e aceita comando de falha", async () => {
    const ws = new WebSocket(`${base.replace("http", "ws")}/ws/telemetry?vin=${vin}&scenario=pneu`);
    const frames: Array<{ dtc: string[] }> = [];
    await new Promise<void>((resolve, reject) => {
      ws.on("message", (raw) => {
        frames.push(JSON.parse(String(raw)));
        if (frames.length === 1) ws.send(JSON.stringify({ type: "fault", code: "P0420" }));
        if (frames.length === 3) resolve();
      });
      ws.on("error", reject);
    });
    ws.close();
    assert.ok(frames[2].dtc.includes("P0420"));
  });
});
