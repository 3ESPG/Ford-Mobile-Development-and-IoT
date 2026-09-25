/**
 * Pré-visualização web: o SecureStore não existe no navegador, então a sessão
 * fica no localStorage. O APK Android usa session.ts (armazenamento criptografado).
 */
const KEY = "fsp.session";

export const sessionStorage = {
  async read() {
    try {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  },
  async write(value: string) {
    try {
      globalThis.localStorage?.setItem(KEY, value);
    } catch {
      // armazenamento indisponível: sessão só em memória
    }
  },
  async clear() {
    try {
      globalThis.localStorage?.removeItem(KEY);
    } catch {
      // ignore
    }
  }
};
