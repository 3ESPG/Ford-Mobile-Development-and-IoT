import assert from "node:assert/strict";
import { describe, it } from "node:test";
import seed from "../api/data/vin-share-summary.json";
import { can, decodeToken, DEMO_PASSWORD, demoAuthenticate, isTokenExpired, issueDemoToken, roleFromApi, validateLogin } from "../src/domain/auth";
import { buildCustomers, classifyLead, profileCounts, profileMessage, riskByAge } from "../src/domain/customers";
import { appointmentReminderDate, revisionReminderDate } from "../src/domain/reminders";
import type { Snapshot } from "../src/domain/types";

const snapshot = seed as unknown as Snapshot;

describe("Login e controle de acesso", () => {
  it("valida e-mail e senha antes de chamar a API", () => {
    assert.deepEqual(validateLogin("", ""), { email: "Informe o e-mail corporativo", password: "Informe a senha" });
    assert.equal(validateLogin("gestor@ford", "123456").email, "E-mail inválido");
    assert.equal(validateLogin("gestor@ford.com", "123").password, "A senha tem pelo menos 6 caracteres");
    assert.deepEqual(validateLogin("gestor@ford.com", DEMO_PASSWORD), {});
  });

  it("autentica os usuários de teste e recusa senha errada", () => {
    assert.equal(demoAuthenticate("CONSULTOR@ford.com ", DEMO_PASSWORD)?.role, "consultor");
    assert.equal(demoAuthenticate("consultor@ford.com", "errada"), null);
    assert.equal(demoAuthenticate("ninguem@ford.com", DEMO_PASSWORD), null);
  });

  it("emite token JWT legível (com acentos) e detecta expiração", () => {
    const user = { id: "u1", name: "Débora Conceição", email: "d@ford.com", role: "gestor" as const, dealerCode: "4192" };
    const now = Date.UTC(2026, 0, 1);
    const payload = decodeToken(issueDemoToken(user, now));
    assert.equal(payload?.name, "Débora Conceição");
    assert.equal(payload?.dealerCode, "4192");
    assert.equal(isTokenExpired(payload!, now + 60_000), false);
    assert.equal(isTokenExpired(payload!, now + 9 * 3600_000), true);
    assert.equal(decodeToken("lixo"), null);
  });

  it("aplica as permissões por perfil (ADMIN, GESTOR_CONCESSIONARIA, CONSULTOR)", () => {
    assert.equal(can("admin", "data.manage"), true);
    assert.equal(can("gestor", "network.view"), true);
    assert.equal(can("gestor", "network.allLeads"), false);
    assert.equal(can("consultor", "dashboard.full"), false);
    assert.equal(can(undefined, "dashboard.full"), false);
    assert.equal(roleFromApi("GESTOR_CONCESSIONARIA"), "gestor");
    assert.equal(roleFromApi("ROLE_ADMIN"), "admin");
  });
});

describe("Perfis de cliente e visão 360°", () => {
  it("classifica pelos sinais de recência, frequência e rodagem", () => {
    assert.equal(classifyLead({ daysSinceService: 120, serviceCount: 4, estimatedKmPerYear: 15000 }).profile, "fiel");
    assert.equal(classifyLead({ daysSinceService: 2100, serviceCount: 1, estimatedKmPerYear: 55000 }).profile, "economico");
    assert.equal(classifyLead({ daysSinceService: 2100, serviceCount: 2, estimatedKmPerYear: 20000 }).profile, "esquecido");
    assert.equal(classifyLead({ daysSinceService: 2100, serviceCount: 1, estimatedKmPerYear: 20000 }).profile, "abandono");
  });

  it("monta a carteira com os 4 perfis, ids únicos e de forma determinística", () => {
    const a = buildCustomers(snapshot.leads, snapshot.models, snapshot.meta.analysisDate);
    const b = buildCustomers(snapshot.leads, snapshot.models, snapshot.meta.analysisDate);
    const counts = profileCounts(a);
    assert.ok(counts.fiel > 0 && counts.abandono > 0 && counts.esquecido > 0 && counts.economico > 0);
    assert.equal(new Set(a.map((c) => c.id)).size, a.length);
    assert.deepEqual(a.map((c) => c.name), b.map((c) => c.name));
    const lead = a.find((c) => c.leadId);
    assert.equal(lead?.services.length, lead?.serviceCount);
    assert.equal(lead?.services[0].date, lead?.lastServiceDate);
  });

  it("gera mensagem de WhatsApp adequada ao perfil", () => {
    const customers = buildCustomers(snapshot.leads, snapshot.models, snapshot.meta.analysisDate);
    const econ = customers.find((c) => c.profile === "economico")!;
    assert.match(profileMessage(econ), /preço fechado/);
    const abandono = customers.find((c) => c.profile === "abandono")!;
    assert.match(profileMessage(abandono), /check-up de retorno/);
  });

  it("agrupa os leads por idade do veículo sem perder nenhum", () => {
    const buckets = riskByAge(snapshot.leads, snapshot.meta.analysisDate);
    const total = buckets.reduce((sum, b) => sum + b.value, 0);
    assert.equal(total, snapshot.leads.filter((l) => l.modelYear).length);
  });
});

describe("Lembretes de serviço (notificações locais)", () => {
  it("avisa na véspera às 9h", () => {
    const at = appointmentReminderDate("2026-10-10", "13:30", new Date(2026, 9, 1, 10));
    assert.equal(at?.getDate(), 9);
    assert.equal(at?.getHours(), 9);
  });

  it("se a véspera já passou, avisa 2h antes; se tudo passou, não agenda", () => {
    const at = appointmentReminderDate("2026-10-10", "13:30", new Date(2026, 9, 10, 8));
    assert.equal(at?.getHours(), 11);
    assert.equal(at?.getMinutes(), 30);
    assert.equal(appointmentReminderDate("2026-10-10", "13:30", new Date(2026, 9, 10, 12)), null);
  });

  it("lembrete de revisão: demo em 1 minuto e amanhã às 9h", () => {
    const now = new Date(2026, 9, 1, 15, 0, 0);
    assert.equal(revisionReminderDate("demo", now).getTime() - now.getTime(), 60_000);
    const tomorrow = revisionReminderDate("amanha", now);
    assert.equal(tomorrow.getDate(), 2);
    assert.equal(tomorrow.getHours(), 9);
  });
});
