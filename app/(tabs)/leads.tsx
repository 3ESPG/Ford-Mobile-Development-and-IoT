import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Section } from "@/components/Section";
import { SearchBox } from "@/components/SearchBox";
import { Chip } from "@/components/Chip";
import { ErrorState, LoadingState } from "@/components/StateView";
import { Badge, Card, CardHeader, MetricLine } from "@/components/ListCards";
import { getLeads } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import type { Lead, Paginated } from "@/types";
import { number, shortDate } from "@/utils";

type PriorityFilter = "" | "Alta" | "Media";

function badgeTone(priority: Lead["priority"]) {
  if (priority === "Alta") {
    return "red" as const;
  }
  if (priority === "Media") {
    return "amber" as const;
  }
  return "blue" as const;
}

export default function LeadsScreen() {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("");
  const [data, setData] = useState<Paginated<Lead> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    try {
      setError(undefined);
      const response = await getLeads({ q: query, priority });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }, [query, priority]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <Screen title="Leads de serviço" subtitle="Priorização por recência, KM, garantia, agenda e histórico">
      <SearchBox value={query} onChangeText={setQuery} placeholder="Buscar modelo, dealer ou motivo" />
      <View style={styles.filters}>
        <Chip label="Todos" selected={priority === ""} onPress={() => setPriority("")} />
        <Chip label="Alta" selected={priority === "Alta"} onPress={() => setPriority("Alta")} />
        <Chip label="Média" selected={priority === "Media"} onPress={() => setPriority("Media")} />
      </View>

      {loading && !data ? <LoadingState /> : null}
      {!loading && !data ? <ErrorState message={error} onRetry={load} /> : null}

      {data ? (
        <Section title={`${number(data.total)} leads`}>
          {data.items.map((item) => (
            <Card key={item.id}>
              <CardHeader
                icon="radio-outline"
                title={`${item.modelName} ${item.modelYear || ""}`.trim()}
                subtitle={`VIN ${item.vinMask} • Dealer ${item.dealerCode}`}
                right={<Badge label={`${item.priority} ${item.score}`} tone={badgeTone(item.priority)} />}
              />
              <View style={styles.signalBox}>
                <Text style={styles.signalTitle}>Sinal conectado</Text>
                <View style={styles.signalGrid}>
                  <View style={styles.signalItem}>
                    <Text style={styles.signalValue}>{number(item.lastKm)}</Text>
                    <Text style={styles.signalLabel}>KM atual</Text>
                  </View>
                  <View style={styles.signalItem}>
                    <Text style={styles.signalValue}>{number(item.estimatedKmPerYear)}</Text>
                    <Text style={styles.signalLabel}>KM/ano</Text>
                  </View>
                  <View style={styles.signalItem}>
                    <Text style={styles.signalValue}>{item.daysSinceService}</Text>
                    <Text style={styles.signalLabel}>dias sem OS</Text>
                  </View>
                </View>
              </View>
              <MetricLine label="Último serviço" value={shortDate(item.lastServiceDate)} />
              <MetricLine label="Próxima janela" value={shortDate(item.nextDueDate)} />
              <MetricLine label="Histórico" value={`${item.serviceCount} serviços`} />
              <MetricLine label="Motivo" value={item.reason} />
              <View style={styles.action}>
                <Text style={styles.actionLabel}>Ação recomendada</Text>
                <Text style={styles.actionText}>{item.recommendedAction}</Text>
              </View>
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
  },
  signalBox: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm
  },
  signalTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  signalGrid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  signalItem: {
    flex: 1,
    minHeight: 64,
    justifyContent: "center"
  },
  signalValue: {
    color: colors.fordBlue,
    fontSize: 18,
    fontWeight: "900"
  },
  signalLabel: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15
  },
  action: {
    gap: spacing.xs
  },
  actionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  actionText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  }
});
