import { sessionStorage } from "./session";

/** Lê o token da sessão salva (usado pelo interceptor do axios) */
export async function readToken(): Promise<string | null> {
  const raw = await sessionStorage.read();
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { token?: string }).token ?? null;
  } catch {
    return null;
  }
}
