import axios, { AxiosError } from "axios";
import { sessionStorage } from "@/auth/session";
import { readToken } from "@/auth/token";

/**
 * Cliente HTTP autenticado (axios).
 *  - request: injeta "Authorization: Bearer <token>" lido do SecureStore
 *  - response: em 401 limpa a sessão e avisa o AuthProvider (logout automático)
 */
export const http = axios.create({ timeout: 6000, headers: { Accept: "application/json" } });

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function setApiBaseUrl(url: string) {
  http.defaults.baseURL = url.trim().replace(/\/+$/, "") || undefined;
}

http.interceptors.request.use(async (config) => {
  const token = await readToken();
  // o token do modo demo não tem assinatura válida: só tokens emitidos pela API vão no header
  if (token && !token.endsWith(".demo")) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const isLogin = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLogin) {
      await sessionStorage.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** true quando o servidor não respondeu (offline, timeout, URL errada) */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}
