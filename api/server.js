/**
 * Ford Service Pulse — API local (Node.js puro + ws)
 *
 * REST:
 *   GET  /health
 *   GET  /api/snapshot                      → base completa consumida pelo app (sincronização)
 *   GET  /api/overview | /api/dealers | /api/leads | /api/models | /api/strategy
 *   GET  /api/vehicles/:vin/telemetry       → leitura IoT (modo HTTP polling)
 *   POST /api/vehicles/:vin/faults          → injeta código de falha (atuação remota)
 * WebSocket:
 *   ws://HOST:3333/ws/telemetry?vin=...&scenario=...  → stream IoT (1 leitura/s)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { WebSocketServer } = require("ws");
const { createSimState, stepSim, injectFault } = require("./telemetry-sim");

const PORT = Number(process.env.PORT || 3333);
const DATA_PATH = path.join(__dirname, "data", "vin-share-summary.json");

let cache = null;
function loadData() {
  if (!cache) cache = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  return cache;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...CORS });
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

function sendError(res, status, code, message) {
  send(res, status, { error: { code, message } });
}

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function filterByQuery(items, q, keys) {
  const term = normalize(q);
  if (!term) return items;
  return items.filter((item) => keys.some((key) => normalize(item[key]).includes(term)));
}

function paginate(items, params) {
  const limit = Math.min(Math.max(Number(params.get("limit") || 40), 1), 200);
  const offset = Math.max(Number(params.get("offset") || 0), 0);
  return { total: items.length, limit, offset, items: items.slice(offset, offset + limit) };
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve(null);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Estado de telemetria por VIN
// ---------------------------------------------------------------------------
const vehicles = new Map();

function vehicleState(vin, scenario) {
  const key = `${vin}:${scenario}`;
  if (!vehicles.has(key)) {
    const lead = loadData().leads.find((l) => l.id === vin);
    if (!lead) return null;
    vehicles.set(key, { state: createSimState(lead, scenario), lastStep: Date.now() });
  }
  return { key, entry: vehicles.get(key) };
}

function advance(entry) {
  const now = Date.now();
  const steps = Math.min(5, Math.floor((now - entry.lastStep) / 1000));
  for (let i = 0; i < steps; i += 1) entry.state = stepSim(entry.state);
  if (steps > 0) entry.lastStep = now;
  return entry.state.frame;
}

// ---------------------------------------------------------------------------
// Rotas REST
// ---------------------------------------------------------------------------
async function route(req, res) {
  if (req.method === "OPTIONS") return send(res, 204);
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const params = url.searchParams;
  const data = loadData();
  const p = url.pathname;

  if (req.method === "GET" && p === "/health") {
    return send(res, 200, { ok: true, source: data.meta.source, generatedAt: data.meta.generatedAt, vehiclesOnline: vehicles.size });
  }

  if (req.method === "GET" && p === "/api/snapshot") {
    return send(res, 200, data);
  }

  if (req.method === "GET" && p === "/api/overview") {
    return send(res, 200, {
      meta: data.meta,
      overview: data.overview,
      breakdowns: data.breakdowns,
      monthly: data.monthly,
      insights: data.insights,
      models: data.models.slice(0, 10),
      dealers: data.dealers.slice(0, 10)
    });
  }

  if (req.method === "GET" && p === "/api/dealers") {
    let items = filterByQuery(data.dealers, params.get("q"), ["dealerCode", "topModel"]);
    const sort = params.get("sort");
    if (sort === "share") items = [...items].sort((a, b) => b.serviceShare - a.serviceShare);
    if (sort === "leads") items = [...items].sort((a, b) => b.openLeads - a.openLeads);
    return send(res, 200, paginate(items, params));
  }

  const dealerMatch = p.match(/^\/api\/dealers\/([^/]+)$/);
  if (req.method === "GET" && dealerMatch) {
    const dealer = data.dealers.find((d) => d.dealerCode === decodeURIComponent(dealerMatch[1]));
    return dealer ? send(res, 200, dealer) : sendError(res, 404, "DEALER_NOT_FOUND", "Concessionária não encontrada");
  }

  if (req.method === "GET" && p === "/api/leads") {
    let items = filterByQuery(data.leads, params.get("q"), ["dealerCode", "modelName", "priority", "reason"]);
    const priority = params.get("priority");
    if (priority) items = items.filter((item) => normalize(item.priority) === normalize(priority));
    const dealer = params.get("dealer");
    if (dealer) items = items.filter((item) => item.dealerCode === dealer);
    return send(res, 200, paginate(items, params));
  }

  const leadMatch = p.match(/^\/api\/leads\/([^/]+)$/);
  if (req.method === "GET" && leadMatch) {
    const lead = data.leads.find((l) => l.id === decodeURIComponent(leadMatch[1]));
    return lead ? send(res, 200, lead) : sendError(res, 404, "LEAD_NOT_FOUND", "Lead não encontrado");
  }

  if (req.method === "GET" && p === "/api/models") {
    return send(res, 200, paginate(filterByQuery(data.models, params.get("q"), ["modelName"]), params));
  }

  if (req.method === "GET" && p === "/api/strategy") {
    return send(res, 200, {
      meta: data.meta,
      opportunities: data.opportunities,
      segments: data.breakdowns.segments,
      leadFunnel: data.breakdowns.leadFunnel,
      riskModels: data.breakdowns.riskModels
    });
  }

  const telemetryMatch = p.match(/^\/api\/vehicles\/([^/]+)\/telemetry$/);
  if (req.method === "GET" && telemetryMatch) {
    const found = vehicleState(decodeURIComponent(telemetryMatch[1]), params.get("scenario") || "saudavel");
    if (!found) return sendError(res, 404, "VEHICLE_NOT_FOUND", "Veículo não encontrado");
    return send(res, 200, advance(found.entry));
  }

  const faultMatch = p.match(/^\/api\/vehicles\/([^/]+)\/faults$/);
  if (req.method === "POST" && faultMatch) {
    const body = await readBody(req);
    if (!body || !/^[PBCU][0-9A-F]{4}$/.test(String(body.code || ""))) {
      return sendError(res, 400, "INVALID_DTC", "Informe um código DTC válido (ex.: P0301)");
    }
    const vin = decodeURIComponent(faultMatch[1]);
    let touched = 0;
    vehicles.forEach((entry, key) => {
      if (key.startsWith(`${vin}:`)) {
        entry.state = injectFault(entry.state, body.code);
        touched += 1;
      }
    });
    if (!touched) return sendError(res, 404, "VEHICLE_OFFLINE", "Veículo sem sessão de telemetria ativa");
    return send(res, 202, { accepted: true, vin, code: body.code });
  }

  return sendError(res, 404, "NOT_FOUND", "Endpoint não encontrado");
}

const server = http.createServer((req, res) => {
  route(req, res).catch((err) => {
    console.error(err);
    sendError(res, 500, "INTERNAL_ERROR", "Erro interno");
  });
});

// ---------------------------------------------------------------------------
// WebSocket de telemetria
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname !== "/ws/telemetry") return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, url));
});

wss.on("connection", (ws, url) => {
  const vin = url.searchParams.get("vin") || "";
  const scenario = url.searchParams.get("scenario") || "saudavel";
  const found = vehicleState(vin, scenario);
  if (!found) {
    ws.close(4404, "VEHICLE_NOT_FOUND");
    return;
  }
  const tick = () => {
    if (ws.readyState !== ws.OPEN) return;
    found.entry.state = stepSim(found.entry.state);
    found.entry.lastStep = Date.now();
    ws.send(JSON.stringify(found.entry.state.frame));
  };
  ws.send(JSON.stringify(found.entry.state.frame));
  const timer = setInterval(tick, 1000);
  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      if (msg.type === "fault" && /^[PBCU][0-9A-F]{4}$/.test(String(msg.code))) {
        found.entry.state = injectFault(found.entry.state, msg.code);
      }
    } catch {
      // ignora mensagens inválidas
    }
  });
  ws.on("close", () => clearInterval(timer));
});

if (require.main === module) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Ford Service Pulse API em http://localhost:${PORT}`);
    console.log(`WebSocket de telemetria em ws://localhost:${PORT}/ws/telemetry`);
  });
}

module.exports = { server };
