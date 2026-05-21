import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Section } from "@/components/Section";
import { KpiCard } from "@/components/KpiCard";
import { ErrorState, LoadingState } from "@/components/StateView";
import { TrendBars } from "@/components/TrendBars";
import { Badge, Card, CardHeader, MetricLine } from "@/components/ListCards";
import { getOverview } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import type { OverviewResponse } from "@/types";
import { compactNumber, number, percent, shortDate } from "@/utils";

export default function DashboardScreen() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    try {
      setError(undefined);
      const response = await getOverview();
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
      <Screen title="Service Pulse" subtitle="Desafio 2 • Pós-venda Ford">
        <LoadingState />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen title="Service Pulse" subtitle="Desafio 2 • Pós-venda Ford">
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const { overview, meta } = data;

  return (
    <Screen
      title="Service Pulse"
      subtitle={`Dados ate ${shortDate(meta.analysisDate)} • ${meta.methodology}`}
      refreshing={loading}
      onRefresh={load}
    >
      <View style={styles.kpiGrid}>
        <KpiCard
          icon="analytics-outline"
          label="Service Share"
          value={percent(overview.serviceShare)}
          detail={`${number(overview.activeLast12Vins)} VINs ativos em 12 meses`}
          tone="blue"
        />
        <KpiCard
          icon="car-sport-outline"
          label="Base elegível"
          value={compactNumber(overview.eligibleVins)}
          detail={`${compactNumber(overview.serviceOrders)} ordens de serviço`}
          tone="cyan"
        />
        <KpiCard
          icon="calendar-outline"
          label="Agenda digital"
          value={percent(overview.agendaRate)}
          detail={`${overview.avgServicesPerVin} serviços por VIN`}
          tone="green"
        />
        <KpiCard
          icon="warning-outline"
          label="Leads críticos"
          value={compactNumber(overview.highPriorityLeads)}
          detail={`${compactNumber(overview.leadCount)} oportunidades qualificadas`}
          tone="amber"
        />
      </View>

      <Section title="Fluxo mensal">
        <TrendBars data={data.monthly} />
      </Section>

      <Section title="Leituras rápidas">
        <View style={styles.insightGrid}>
          {data.insights.map((item) => (
            <Card key={item.title}>
              <CardHeader icon="sparkles-outline" title={item.title} right={<Badge label={item.value} />} />
              <Text style={styles.description}>{item.description}</Text>
            </Card>
          ))}
        </View>
      </Section>

      <Section title="Modelos em foco">
        {data.models.slice(0, 5).map((item) => (
          <Card key={item.modelName}>
            <CardHeader
              icon="car-outline"
              title={item.modelName}
              subtitle={`${number(item.uniqueVins)} VINs • ${number(item.orders)} serviços`}
              right={<Badge label={percent(item.serviceShare)} tone={item.serviceShare >= 50 ? "green" : "amber"} />}
            />
            <MetricLine label="Leads de risco" value={number(item.riskLeads)} />
            <MetricLine label="KM médio" value={number(item.avgKm)} />
          </Card>
        ))}
      </Section>

      <Section title="Top concessionárias">
        {data.dealers.slice(0, 5).map((item) => (
          <Card key={item.dealerCode}>
            <CardHeader
              icon="business-outline"
              title={`Dealer ${item.dealerCode}`}
              subtitle={`${item.topModel} lidera ${percent(item.topModelShare)} do volume`}
              right={<Badge label={`${item.openLeads} leads`} tone={item.openLeads > 1500 ? "red" : "blue"} />}
            />
            <MetricLine label="Service Share" value={percent(item.serviceShare)} />
            <MetricLine label="Agenda digital" value={percent(item.agendaRate)} />
          </Card>
        ))}
      </Section>

      <View style={styles.sourceBox}>
        <Text style={styles.sourceTitle}>Base</Text>
        <Text style={styles.sourceText}>{meta.source}</Text>
        <Text style={styles.sourceText}>
          Período {shortDate(meta.dateRange.start)} a {shortDate(meta.dateRange.end)}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md
  },
  insightGrid: {
    gap: spacing.md
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  sourceBox: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.xs
  },
  sourceTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  sourceText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  }
});
