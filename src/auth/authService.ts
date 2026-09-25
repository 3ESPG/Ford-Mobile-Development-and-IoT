import axios from "axios";
import { http, isNetworkError, setApiBaseUrl } from "@/api/http";
import { decodeToken, demoAuthenticate, isTokenExpired, issueDemoToken, roleFromApi } from "@/domain/auth";
import type { Profile } from "@/domain/types";
import { sessionStorage } from "./session";

export type AuthMode = "api" | "demo";
export type Session = { user: Profile; token: string; mode: AuthMode };

export class AuthError extends Error {}

type ApiUser = {
  id?: string | number;
  nome?: string;
  name?: string;
  email: string;
  role?: string;
  perfil?: string;
  concessionariaId?: string | number | null;
  dealerCode?: string | null;
};
type LoginResponse = { token: string; user?: ApiUser; usuario?: ApiUser };

async function persist(session: Session): Promise<Session> {
  await sessionStorage.write(JSON.stringify(session));
  return session;
}

function userFromApi(u: ApiUser | undefined, token: string): Profile | null {
  if (u) {
    return {
      id: String(u.id ?? u.email),
      name: u.nome || u.name || u.email,
      email: u.email,
      role: roleFromApi(u.role || u.perfil || "CONSULTOR"),
      dealerCode: u.dealerCode ?? (u.concessionariaId != null ? String(u.concessionariaId) : null)
    };
  }
  const p = decodeToken(token);
  return p ? { id: p.sub, name: p.name || p.email, email: p.email, role: roleFromApi(String(p.role || "CONSULTOR")), dealerCode: p.dealerCode ?? null } : null;
}

function loginDemo(email: string, password: string): Promise<Session> {
  const user = demoAuthenticate(email, password);
  if (!user) throw new AuthError("E-mail ou senha incorretos");
  return persist({ user, token: issueDemoToken(user), mode: "demo" });
}

/**
 * Login: com a API configurada, chama POST /auth/login e recebe um JWT. Se o
 * servidor não responder, entra no modo demo e o app continua funcionando.
 */
export async function login(apiUrl: string, email: string, password: string): Promise<Session> {
  if (!apiUrl) return loginDemo(email, password);
  setApiBaseUrl(apiUrl);
  try {
    const { data } = await http.post<LoginResponse>("/auth/login", { email: email.trim().toLowerCase(), senha: password, password });
    const user = userFromApi(data.user || data.usuario, data.token);
    if (!data.token || !user) throw new AuthError("Resposta de login inválida");
    return persist({ user, token: data.token, mode: "api" });
  } catch (err) {
    if (err instanceof AuthError) throw err;
    if (isNetworkError(err)) return loginDemo(email, password);
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 400)) throw new AuthError("E-mail ou senha incorretos");
    throw new AuthError("Não foi possível entrar agora. Tente novamente.");
  }
}

/** Restaura a sessão salva ao abrir o app; descarta se o token expirou */
export async function restoreSession(): Promise<Session | null> {
  const raw = await sessionStorage.read();
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    const payload = decodeToken(session.token);
    if (!session.user || (payload && isTokenExpired(payload))) throw new Error("expired");
    return session;
  } catch {
    await sessionStorage.clear();
    return null;
  }
}

export async function logout() {
  await sessionStorage.clear();
}
