const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = Number(process.env.PORT || 3333);
const DATA_PATH = path.join(__dirname, "data", "vin-share-summary.json");

function loadData() {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  return JSON.parse(raw);
}

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  });
  res.end(JSON.stringify(body));
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function filterByQuery(items, query, keys) {
  const term = normalize(query.q);
  if (!term) {
    return items;
  }
  return items.filter((item) => keys.some((key) => normalize(item[key]).includes(term)));
}

function paginate(items, query) {
  const limit = Math.min(Number(query.limit || 40), 120);
  const offset = Math.max(Number(query.offset || 0), 0);
  return {
    total: items.length,
    limit,
    offset,
    items: items.slice(offset, offset + limit)
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    return send(res, 204, {});
  }

  const parsed = url.parse(req.url, true);
  const data = loadData();

  if (parsed.pathname === "/health") {
    return send(res, 200, {
      ok: true,
      source: data.meta.source,
      generatedAt: data.meta.generatedAt
    });
  }

  if (parsed.pathname === "/api/overview") {
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

  if (parsed.pathname === "/api/dealers") {
    let items = filterByQuery(data.dealers, parsed.query, ["dealerCode", "topModel"]);
    if (parsed.query.sort === "share") {
      items = [...items].sort((a, b) => b.serviceShare - a.serviceShare);
    }
    if (parsed.query.sort === "leads") {
      items = [...items].sort((a, b) => b.openLeads - a.openLeads);
    }
    return send(res, 200, paginate(items, parsed.query));
  }

  if (parsed.pathname === "/api/leads") {
    let items = filterByQuery(data.leads, parsed.query, ["dealerCode", "modelName", "priority", "reason"]);
    if (parsed.query.priority) {
      items = items.filter((item) => normalize(item.priority) === normalize(parsed.query.priority));
    }
    const page = paginate(items, parsed.query);
    if (!parsed.query.q) {
      if (parsed.query.priority) {
        const bucket = data.breakdowns.leadFunnel.find(
          (item) => normalize(item.label) === normalize(parsed.query.priority)
        );
        page.total = bucket ? bucket.count : page.total;
      } else {
        page.total = data.overview.leadCount;
      }
    }
    return send(res, 200, page);
  }

  if (parsed.pathname === "/api/models") {
    const items = filterByQuery(data.models, parsed.query, ["modelName"]);
    return send(res, 200, paginate(items, parsed.query));
  }

  if (parsed.pathname === "/api/strategy") {
    return send(res, 200, {
      meta: data.meta,
      opportunities: data.opportunities,
      segments: data.breakdowns.segments,
      leadFunnel: data.breakdowns.leadFunnel,
      riskModels: data.breakdowns.riskModels
    });
  }

  return send(res, 404, { error: "Endpoint nao encontrado" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Ford Service Pulse API on http://localhost:${PORT}`);
});
