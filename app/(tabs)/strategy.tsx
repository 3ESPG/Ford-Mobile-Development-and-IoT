import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Section } from "@/components/Section";
import { ErrorState, LoadingState } from "@/components/StateView";
import { Badge, Card, CardHeader, MetricLine } from "@/components/ListCards";
import { getStrategy } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import type { StrategyResponse } from "@/types";
import { number, percent } from "@/utils";

export default function StrategyScreen() {
  const [data, setData] = useState<StrategyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    try {
      setError(undefined);
      const response = await getStrategy();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Screen title="Ações" subtitle="Segmentos e playbook para retenção">
        <LoadingState />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen title="Ações" subtitle="Segmentos e playbook para retenção">
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  return (
    <Screen title="Ações" subtitle="Segmentos e playbook para retenção">
      <Section title="Carteira">
        <View style={styles.segmentList}>
          {data.segments.map((item) => (
            <View key={item.label} style={styles.segmentRow}>
              <View style={styles.segmentCopy}>
                <Text style={styles.segmentTitle}>{item.label}</Text>
                <Text style={styles.segmentText}>{number(item.count)} VINs</Text>
              </View>
              <Badge label={percent(item.share)} />
            </View>
          ))}
        </View>
      </Section>

      <Section title="Funil de leads">
        {data.leadFunnel.map((item) => (
          <Card key={item.label}>
            <CardHeader
              icon={item.label === "Alta" ? "alert-circle-outline" : "flag-outline"}
              title={item.label}
              subtitle={`${number(item.count)} VINs na categoria`}
              right={<Badge label={percent(item.share)} tone={item.label === "Alta" ? "red" : "amber"} />}
            />
          </Card>
        ))}
      </Section>

      <Section title="Modelos com risco">
        {data.riskModels.slice(0, 5).map((item) => (
          <Card key={item.label}>
            <CardHeader
              icon="car-outline"
              title={item.label}
              subtitle={`${number(item.count)} leads qualificados`}
              right={<Badge label={percent(item.share)} tone="amber" />}
            />
          </Card>
        ))}
      </Section>

      <Section title="Playbook">
        {data.opportunities.playbook.map((item) => (
          <Card key={item.segment}>
            <CardHeader icon="navigate-outline" title={item.segment} subtitle={item.trigger} />
            <MetricLine label="Ação" value={item.action} />
            <MetricLine label="Métrica" value={item.metric} />
          </Card>
        ))}
      </Section>

      <Section title="Lojas para plano de ação">
        {data.opportunities.lowShareDealers.slice(0, 5).map((item) => (
          <Card key={item.dealerCode}>
            <CardHeader
              icon="business-outline"
              title={`Dealer ${item.dealerCode}`}
              subtitle={`${number(item.uniqueVins)} VINs observados`}
              right={<Badge label={percent(item.serviceShare)} tone="red" />}
            />
            <MetricLine label="Modelo dominante" value={item.topModel} />
            <MetricLine label="Leads abertos" value={number(item.openLeads)} />
          </Card>
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentList: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden"
  },
  segmentRow: {
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  segmentCopy: {
    flex: 1,
    gap: 2
  },
  segmentTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  segmentText: {
    color: colors.muted,
    fontSize: 12
  }
});
