import { Redirect } from "expo-router";
import { useApp } from "@/state/AppProvider";

/** Porta de entrada: sem perfil → onboarding; com perfil → abas */
export default function Index() {
  const { settings } = useApp();
  return <Redirect href={settings.profile ? "/painel" : "/welcome"} />;
}
