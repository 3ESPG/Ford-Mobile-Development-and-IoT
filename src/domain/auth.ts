import type { Profile, UserRole } from "./types";

// ---------------------------------------------------------------------------
// Perfis de acesso (espelham os papéis da API: ADMIN, GESTOR_CONCESSIONARIA, CONSULTOR)
// ---------------------------------------------------------------------------

export type Permission =
  | "dashboard.full" // painel completo com KPIs e gráficos
  | "network.view" // aba Rede Ford (comparativo entre concessionárias)
  | "network.allLeads" // enxerga leads e clientes de todas as lojas
  | "data.manage"; // fonte de dados, sincronização e reset local

const PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ["dashboard.full", "network.view", "network.allLeads", "data.manage"],
  gestor: ["dashboard.full", "network.view"],
  consultor: []
};

export const ROLE_INFO: Record<UserRole, { label: string; apiRole: string; description: string }> = {
  admin: { label: "Administrador Ford", apiRole: "ADMIN", description: "Visão de toda a rede e gestão dos dados" },
  gestor: { label: "Gestor da concessionária", apiRole: "GESTOR_CONCESSIONARIA", description: "Painel completo da sua loja e comparativo com a rede" },
  consultor: { label: "Consultor de serviço", apiRole: "CONSULTOR", description: "Leads e clientes da sua loja" }
};

export function can(role: UserRole | undefined, permission: Permission): boolean {
  return role ? PERMISSIONS[role].includes(permission) : false;
}

/** Converte o papel devolvido pela API Java (ADMIN, GESTOR_CONCESSIONARIA, CONSULTOR) */
export function roleFromApi(value: string): UserRole {
  const v = value.toUpperCase();
  if (v.includes("ADMIN")) return "admin";
  if (v.includes("GESTOR")) return "gestor";
  return "consultor";
}

// ---------------------------------------------------------------------------
// Usuários de teste do modo demo (um por perfil)
// ---------------------------------------------------------------------------

export const DEMO_PASSWORD = "ford@2026";

export const DEMO_USERS: Profile[] = [
  { id: "u-admin", name: "Ana Ribeiro", email: "admin@ford.com", role: "admin", dealerCode: null },
  { id: "u-gestor", name: "Carlos Mendes", email: "gestor@ford.com", role: "gestor", dealerCode: "4192" },
  { id: "u-consultor", name: "Juliana Costa", email: "consultor@ford.com", role: "consultor", dealerCode: "4146" }
];

// ---------------------------------------------------------------------------
// Validação do formulário de login
// ---------------------------------------------------------------------------

export type LoginErrors = { email?: string; password?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  if (!email.trim()) errors.email = "Informe o e-mail corporativo";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "E-mail inválido";
  if (!password) errors.password = "Informe a senha";
  else if (password.length < 6) errors.password = "A senha tem pelo menos 6 caracteres";
  return errors;
}

// ---------------------------------------------------------------------------
// Token (formato JWT). No modo demo o token é emitido localmente e não tem
// assinatura válida; com a API, o app só lê o payload (exp, papel) e o envia
// no header Authorization: Bearer.
// ---------------------------------------------------------------------------

export type TokenPayload = { sub: string; name: string; email: string; role: UserRole; dealerCode: string | null; exp: number };

export const SESSION_HOURS = 8;

// btoa/atob trabalham com bytes: converte UTF-8 ↔ "binary string" para aceitar acentos
const toBinary = (value: string) => encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
const fromBinary = (value: string) =>
  decodeURIComponent(
    value
      .split("")
      .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("")
  );

const b64url = (value: string) => btoa(toBinary(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function fromB64url(value: string): string {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return fromBinary(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
}

export function issueDemoToken(user: Profile, now = Date.now()): string {
  const payload: TokenPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    dealerCode: user.dealerCode,
    exp: Math.floor(now / 1000) + SESSION_HOURS * 3600
  };
  return `${b64url(JSON.stringify({ alg: "none", typ: "JWT" }))}.${b64url(JSON.stringify(payload))}.demo`;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const [, payload] = token.split(".");
    const data = JSON.parse(fromB64url(payload)) as Partial<TokenPayload>;
    if (!data.sub || typeof data.exp !== "number") return null;
    return data as TokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: Pick<TokenPayload, "exp">, now = Date.now()): boolean {
  return payload.exp * 1000 <= now;
}

/** Autenticação local do modo demo */
export function demoAuthenticate(email: string, password: string): Profile | null {
  const user = DEMO_USERS.find((u) => u.email === email.trim().toLowerCase());
  return user && password === DEMO_PASSWORD ? user : null;
}
