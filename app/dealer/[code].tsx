import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText, Badge, Card, colors, EmptyState, KpiGrid, KpiTile, MetricRow, ProgressBar, RingGauge, Screen, Section, spacing } from "@/design-system";
import { compactNumber, km, number, percent, shortDate, titleCase } from "@/domain/format";
import { sortQueue } from "@/domain/leads";
import { useApp } from "@/state/AppProvider";
import { LeadCard } from "@/ui/LeadCard";

export default function DealerScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { snapshot, leads } = useApp();
  const dealer = snapshot.dealers.find((d) => d.dealerCode === String(code));

  if (!dealer) {
    return (
      <Screen title={`Dealer ${code}`} back>
        <EmptyState title="Concessionária não encontrada" actionLabel="Voltar" onAction={() => router.back()} />
      </Screen>
    );
  }

  const network = snapshot.overview.serviceShare;
  const gap = Math.round((dealer.serviceShare - network) * 10) / 10;
  const dealerLeads = sortQueue(leads.filter((l) => l.dealerCode === dealer.dealerCode));
  const playbook = snapshot.opportunities.playbook.filter((p) =>
    gap < 0 ? p.segment.startsWith("Risco") || p.segment.startsWith("Primeira") : dealer.agendaRate < 95 ? p.segment.startsWith("Oportunidade") : p.segment.startsWith("Rodagem")
  );

  return (
    <Screen
      back
      eyebrow="Concessionária"
      title={`Dealer ${dealer.dealerCode}`}
      heroContent={
        <View style={styles.hero}>
          <RingGauge value={dealer.serviceShare} size={96} stroke={10} color={colors.textOnBrand} track="rgba(255,255,255,0.16)">
            <AppText variant="metricS" color={colors.textOnBrand}>
              {percent(dealer.serviceShare, 0)}
            </AppText>
          </RingGauge>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText variant="overline" color={colors.textOnBrandMuted}>
              Service Share da loja
            </AppText>
            <AppText variant="bodySm" color={colors.textOnBrand}>
              {gap >= 0 ? `${percent(gap)} acima` : `${percent(-gap)} abaixo`} da média da rede ({percent(network)}).
            </AppText>
            <Badge label={gap >= 0 ? "Acima da rede" : "Plano de ação recomendado"} tone={gap >= 0 ? "success" : "warning"} solid />
          </View>
        </View>
      }
    >
      <KpiGrid>
        <KpiTile icon="construct-outline" label="Ordens de serviço" value={compactNumber(dealer.orders)} tone="info" />
        <KpiTile icon="car-sport-outline" label="VINs ativos 12m" value={compactNumber(dealer.activeLast12)} detail={`de ${compactNumber(dealer.uniqueVins)} observados`} tone="accent" />
        <KpiTile icon="calendar-outline" label="Agenda digital" value={percent(dealer.agendaRate)} tone="success" />
        <KpiTile icon="people-outline" label="Leads abertos" value={compactNumber(dealer.openLeads)} tone="danger" />
      </KpiGrid>

      <Section title="Comparativo com a rede">
        <Card>
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" color={colors.textMuted}>
              Dealer {dealer.dealerCode}
            </AppText>
            <ProgressBar value={dealer.serviceShare} color={gap >= 0 ? colors.accent : colors.warning} height={10} />
          </View>
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" color={colors.textMuted}>
              Média da rede
            </AppText>
            <ProgressBar value={network} color={colors.borderStrong} height={10} />
          </View>
          <MetricRow label="Modelo dominante" value={`${titleCase(dealer.topModel)} (${percent(dealer.topModelShare, 0)})`} />
          <MetricRow label="KM médio na oficina" value={km(dealer.avgKm)} />
          <MetricRow label="Último serviço na base" value={shortDate(dealer.latestServiceDate)} last />
        </Card>
      </Section>

      {playbook.length ? (
        <Section title="Ação sugerida para a loja">
          {playbook.map((p) => (
            <Card key={p.segment} tone="muted">
              <AppText variant="titleS">{p.segment}</AppText>
              <AppText variant="bodySm" color={colors.textSecondary}>
                {p.action}
              </AppText>
              <Badge label={p.metric} tone="success" icon="stats-chart-outline" />
            </Card>
          ))}
        </Section>
      ) : null}

      <Section title="Leads priorizados desta loja" subtitle={`${number(dealerLeads.length)} na amostra do app`}>
        {dealerLeads.length ? (
          dealerLeads.map((l) => <LeadCard key={l.id} lead={l} />)
        ) : (
          <EmptyState title="Sem leads na amostra" message="A amostra do app traz os 160 leads de maior score da rede." />
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: spacing.lg }
});
