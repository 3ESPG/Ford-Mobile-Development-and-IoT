import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Section } from "@/components/Section";
import { SearchBox } from "@/components/SearchBox";
import { Chip } from "@/components/Chip";
import { ErrorState, LoadingState } from "@/components/StateView";
import { Badge, Card, CardHeader, MetricLine } from "@/components/ListCards";
import { getDealers } from "@/api/client";
import { spacing } from "@/theme";
import type { Dealer, Paginated } from "@/types";
import { number, percent, shortDate } from "@/utils";

type SortMode = "volume" | "share" | "leads";

export default function DealersScreen() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("volume");
  const [data, setData] = useState<Paginated<Dealer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    try {
      setError(undefined);
      const response = await getDealers({ q: query, sort: sort === "volume" ? undefined : sort });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }, [query, sort]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <Screen title="Concessionárias" subtitle="Granularidade por loja, modelo dominante, agenda e leads">
      <SearchBox value={query} onChangeText={setQuery} placeholder="Buscar dealer ou modelo" />
      <View style={styles.filters}>
        <Chip label="Volume" selected={sort === "volume"} onPress={() => setSort("volume")} />
        <Chip label="Share" selected={sort === "share"} onPress={() => setSort("share")} />
        <Chip label="Leads" selected={sort === "leads"} onPress={() => setSort("leads")} />
      </View>

      {loading && !data ? <LoadingState /> : null}
      {!loading && !data ? <ErrorState message={error} onRetry={load} /> : null}

      {data ? (
        <Section title={`${number(data.total)} lojas`}>
          {data.items.map((item) => (
            <Card key={item.dealerCode}>
              <CardHeader
                icon="business-outline"
                title={`Dealer ${item.dealerCode}`}
                subtitle={`Último serviço ${shortDate(item.latestServiceDate)}`}
                right={<Badge label={percent(item.serviceShare)} tone={item.serviceShare >= 55 ? "green" : "amber"} />}
              />
              <MetricLine label="VINs ativos em 12 meses" value={`${number(item.activeLast12)} / ${number(item.uniqueVins)}`} />
              <MetricLine label="Ordens de serviço" value={number(item.orders)} />
              <MetricLine label="Agenda digital" value={percent(item.agendaRate)} />
              <MetricLine label="Modelo dominante" value={`${item.topModel} (${percent(item.topModelShare)})`} />
              <MetricLine label="Leads abertos" value={number(item.openLeads)} />
            </Card>
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: "row",
    gap: spacing.sm
  }
});
