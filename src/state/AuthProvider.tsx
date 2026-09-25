import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setUnauthorizedHandler } from "@/api/http";
import * as auth from "@/auth/authService";
import { can, type Permission } from "@/domain/auth";
import type { Profile } from "@/domain/types";
import { useApp } from "./AppProvider";

type AuthStatus = "loading" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: AuthStatus;
  user: Profile | null;
  mode: auth.AuthMode | null;
  /** motivo do último logout forçado (ex.: sessão expirada), exibido no login */
  notice: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { settings } = useApp();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<auth.Session | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    auth
      .restoreSession()
      .then((restored) => {
        setSession(restored);
        setStatus(restored ? "signedIn" : "signedOut");
      })
      .catch(() => setStatus("signedOut"));
  }, []);

  // 401 em qualquer chamada autenticada → logout automático
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null);
      setStatus("signedOut");
      setNotice("Sua sessão expirou. Entre novamente.");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const next = await auth.login(settings.apiUrl, email, password);
      setNotice(null);
      setSession(next);
      setStatus("signedIn");
    },
    [settings.apiUrl]
  );

  const signOut = useCallback(async () => {
    await auth.logout();
    setSession(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      mode: session?.mode ?? null,
      notice,
      signIn,
      signOut,
      can: (permission) => can(session?.user.role, permission)
    }),
    [status, session, notice, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
