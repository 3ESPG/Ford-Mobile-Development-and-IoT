import * as SecureStore from "expo-secure-store";

/**
 * Sessão (token JWT + usuário) guardada com expo-secure-store
 * (Android Keystore / iOS Keychain), fora do SQLite, que não é criptografado.
 */
const KEY = "fsp.session";

export const sessionStorage = {
  read: () => SecureStore.getItemAsync(KEY),
  write: (value: string) => SecureStore.setItemAsync(KEY, value),
  clear: () => SecureStore.deleteItemAsync(KEY)
};
