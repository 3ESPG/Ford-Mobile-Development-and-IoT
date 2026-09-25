import { useMemo } from "react";
import { useApp } from "./AppProvider";
import { useAuth } from "./AuthProvider";

/**
 * Escopo de dados do usuário logado:
 *  - admin → rede inteira
 *  - gestor / consultor → apenas a própria concessionária
 */
export function useDealerScope() {
  const { user, can } = useAuth();
  const dealer = can("network.allLeads") ? null : user?.dealerCode ?? null;
  return { dealer, label: dealer ? `Dealer ${dealer}` : "Rede Ford" };
}

export function useScopedLeads() {
  const { leads } = useApp();
  const { dealer, label } = useDealerScope();
  return useMemo(() => ({ items: dealer ? leads.filter((l) => l.dealerCode === dealer) : leads, dealer, label }), [leads, dealer, label]);
}

export function useScopedCustomers() {
  const { customers } = useApp();
  const { dealer, label } = useDealerScope();
  return useMemo(() => ({ items: dealer ? customers.filter((c) => c.dealerCode === dealer) : customers, dealer, label }), [customers, dealer, label]);
}

export { conversionRate, funnelCounts } from "./selectors.logic";
