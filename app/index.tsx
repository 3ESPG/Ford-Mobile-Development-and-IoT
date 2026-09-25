import { Redirect } from "expo-router";
import { useAuth } from "@/state/AuthProvider";

/** Porta de entrada: sessão válida no SecureStore → abas; senão → login */
export default function Index() {
  const { status } = useAuth();
  return <Redirect href={status === "signedIn" ? "/painel" : "/login"} />;
}
