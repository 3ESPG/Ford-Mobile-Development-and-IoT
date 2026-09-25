import { useMemo } from "react";
import { useApp } from "./AppProvider";

/** Leads do escopo do usuário: consultor → sua loja; gestor → rede inteira */
export function useScopedLeads(scope: "mine" | "all" = "mine") {
  const { leads, settings } = useApp();
  const dealer = settings.profile?.role === "consultor" ? settings.profile.dealerCode : null;
  return useMemo(() => {
    const items = scope === "mine" && dealer ? leads.filter((l) => l.dealerCode === dealer) : leads;
    return { items, dealer, label: scope === "mine" && dealer ? `Dealer ${dealer}` : "Rede Ford" };
  }, [leads, dealer, scope]);
}

export { conversionRate, funnelCounts } from "./selectors.logic";
