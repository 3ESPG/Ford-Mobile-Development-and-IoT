import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Banner,
  BarChart,
  Button,
  Card,
  colors,
  EmptyState,
  IconTile,
  KpiGrid,
  KpiTile,
  ListRow,
  ProgressBar,
  RingGauge,
  Screen,
  Section,
  spacing,
  useLayout
} from "@/design-system";
import { riskByAge } from "@/domain/customers";
import { compactNumber, longDate, monthLabel, number, percent, shortDate, titleCase } from "@/domain/format";
import { LEAD_STATUS, sortQueue, STATUS_ORDER } from "@/domain/leads";
import { serviceLabel } from "@/domain/schedule";
import { ROLE_INFO } from "@/domain/auth";
import { useApp } from "@/state/AppProvider";
import { useAuth } from "@/state/AuthProvider";
import { conversionRate, funnelCounts, useScopedLeads } from "@/state/selectors";
import { LeadCard } from "@/ui/LeadCard";
import { ProfileButton } from "@/ui/ProfileButton";

export default function PainelScreen() {
  const { snapshot, source, syncing, sync, crm } = useApp();
  const { user, can } = useAuth();
  const { isCompact } = useLayout();
  const { items, label, dealer: dealerCode } = useScopedLeads();
  const { overview, meta } = snapshot;
  const firstName = user?.name.split(" ")[0] || "";
  const full = can("dashboard.full");
  const dealer = dealerCode ? snapshot.dealers.find((d) => d.dealerCode === dealerCode) : undefined;

  const counts = useMemo(() => funnelCounts(items), [items]);
  const conversion = conversionRate(counts);
  const openLeads = counts.novo + counts.contatado;
  const openAlerts = crm.alerts.filter((a) => !a.acknowledged && (!dealerCode || items.some((l) => l.id === a.leadId)));
  const today = new Date().toISOString().slice(0, 10);
  const nextAppointments = crm.appointments.filter((a) => a.status === "confirmado" && a.date >= today && (!dealerCode || a.dealerCode === dealerCode)).slice(0, 2);
  const nextLeads = useMemo(() => sortQueue(items.filter((l) => l.status === "novo" || l.status === "contatado")).slice(0, 3), [items]);

  // Service Share: da loja (gestor/consultor) ou da rede (admin)
  const share = dealer ? dealer.serviceShare : overview.serviceShare;
  const shareText = dealer
    ? `${number(dealer.activeLast12)} de ${number(dealer.uniqueVins)} VINs da loja voltaram à rede oficial.`
    : `${number(overview.activeLast12Vins)} de ${number(overview.eligibleVins)} VINs voltaram à rede oficial.`;
  const shareDelta = dealer ? dealer.serviceShare - overview.serviceShare : null;
  const atRisk = dealer ? dealer.openLeads : overview.leadCount;
  const ageBars = riskByAge(items, meta.analysisDate).map((b) => ({ ...b, highlight: b.key !== "0-3" && b.value > 0, muted: b.key === "0-3" }));

  // Últimos 12 meses completos (o mês corrente da base é parcial e fica de fora)
  const lastMonth = meta.analysisDate.slice(0, 7);
  const months = snapshot.monthly.filter((m) => m.month < lastMonth).slice(-12);
  const bars = months.map((m, i) => ({ key: m.month, label: monthLabel(m.month), value: m.orders, highlight: i === months.length - 1 }));
  const topModels = [...snapshot.models].sort((a, b) => b.uniqueVins - a.uniqueVins).slice(0, 5);

  return (
    <Screen
      eyebrow={`Olá, ${firstName} · ${user ? ROLE_INFO[user.role].label : ""}`}
      title={full ? "Painel de retenção" : "Meu dia"}
      heroRight={<ProfileButton />}
      refreshing={syncing}
      onRefresh={sync}
      heroContent={
        <View style={styles.heroCard}>
          <RingGauge value={share} size={isCompact ? 84 : 112} stroke={isCompact ? 9 : 11} color={colors.textOnBrand} track="rgba(255,255,255,0.16)">
            <AppText variant="metric" color={colors.textOnBrand}>
              {percent(share, 0)}
            </AppText>
          </RingGauge>
          <View style={styles.heroCopy}>
            <AppText variant="overline" color={colors.textOnBrandMuted}>
              Service Share · {label} · 12 meses
            </AppText>
            <AppText variant="bodySm" color={colors.textOnBrand}>
              {shareText}
            </AppText>
            <View style={styles.heroBadges}>
              {shareDelta !== null ? (
                <Badge
                  label={`${shareDelta >= 0 ? "+" : ""}${shareDelta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p. vs rede`}
                  tone={shareDelta >= 0 ? "success" : "danger"}
                  solid
                  icon={shareDelta >= 0 ? "trending-up" : "trending-down"}
                />
              ) : (
                <Badge label={`${percent(overview.quarterOrderDelta)} OS no trimestre`} tone="danger" solid icon="trending-down" />
              )}
              <Badge label={source === "api" ? "API ao vivo" : "Base embarcada"} tone={source === "api" ? "success" : "neutral"} icon={source === "api" ? "cloud-done-outline" : "phone-portrait-outline"} />
            </View>
          </View>
        </View>
      }
    >
      {openAlerts.length ? (
        <Card onPress={() => router.push("/conectado")} tone="default" style={styles.alertCard}>
          <Banner
            tone="iot"
            icon="hardware-chip"
            title={`${openAlerts.length} alerta(s) de veículo conectado`}
            message={`${openAlerts[0].title} · toque para ver a telemetria e acionar o cliente`}
          />
        </Card>
      ) : null}

      <Section title="Indicadores-chave" subtitle={full ? `${label} · risco, leads e conversão` : "Sua fila de hoje"}>
        <KpiGrid>
          {full ? (
            <KpiTile icon="warning-outline" label="Clientes em risco" value={compactNumber(atRisk)} detail="VINs com risco de evasão na base" tone="danger" onPress={() => router.push("/clientes")} />
          ) : (
            <KpiTile icon="shield-checkmark-outline" label="Retidos" value={String(counts.retido)} detail="voltaram para a rede" tone="success" />
          )}
          <KpiTile icon="flash-outline" label="Leads abertos" value={String(openLeads)} detail={`de ${items.length} na carteira`} tone="warning" onPress={() => router.push("/leads")} />
          <KpiTile icon="calendar-outline" label="Agendados" value={String(counts.agendado)} detail="serviços marcados" tone="info" onPress={() => router.push("/agenda")} />
          <KpiTile icon="trending-up-outline" label="Taxa de conversão" value={`${conversion}%`} detail="contatos que viraram agendamento" tone="success" />
        </KpiGrid>
      </Section>

      <Section title="Sua carteira" subtitle={`${label} · ${items.length} leads qualificados`} actionLabel="Ver fila" onAction={() => router.push("/leads")}>
        <Card>
          <View style={styles.funnel}>
            {STATUS_ORDER.filter((s) => s !== "perdido").map((s) => (
              <View key={s} style={styles.funnelItem}>
                <AppText variant="metricS" color={colors.textPrimary}>
                  {counts[s]}
                </AppText>
                <Badge label={LEAD_STATUS[s].label} tone={LEAD_STATUS[s].tone} />
              </View>
            ))}
          </View>
          <View style={{ gap: spacing.xs }}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={colors.textMuted}>
                Conversão de contatos em agendamento
              </AppText>
              <AppText variant="bodySmStrong">{conversion}%</AppText>
            </View>
            <ProgressBar value={conversion} color={colors.success} />
          </View>
          <Button label="Trabalhar próximos leads" icon="flash-outline" onPress={() => router.push("/leads")} fullWidth />
        </Card>
      </Section>

      {!full ? (
        <Section title="Próximos leads" subtitle="Maior risco primeiro" actionLabel="Ver todos" onAction={() => router.push("/leads")}>
          {nextLeads.length ? (
            nextLeads.map((l) => <LeadCard key={l.id} lead={l} />)
          ) : (
            <EmptyState icon="checkmark-done-outline" title="Fila zerada" message="Todos os leads da sua loja já foram trabalhados." />
          )}
        </Section>
      ) : (
        <Section title="Clientes em risco por idade do veículo" subtitle="O Service Share cai a partir de 4 anos de uso: foco nas barras destacadas">
          <Card>
            {items.length ? <BarChart data={ageBars} /> : <EmptyState title="Sem leads na carteira" />}
            <AppText variant="caption" color={colors.textMuted}>
              Idade = ano da análise − ano-modelo · {items.length} leads de {label}
            </AppText>
          </Card>
        </Section>
      )}

      {nextAppointments.length ? (
        <Section title="Próximos agendamentos" actionLabel="Agenda" onAction={() => router.push("/agenda")}>
          <Card padded={false}>
            {nextAppointments.map((a, i) => (
              <ListRow
                key={a.id}
                icon="calendar"
                tone="info"
                title={`${titleCase(a.modelName)} · ${serviceLabel(a.serviceType)}`}
                subtitle={`${longDate(a.date)} às ${a.slot} · Dealer ${a.dealerCode}`}
                onPress={() => router.push(`/lead/${a.leadId}`)}
                last={i === nextAppointments.length - 1}
              />
            ))}
          </Card>
        </Section>
      ) : null}

      {full ? (
        <>
      <Section title="Indicadores da rede" subtitle={`Base até ${shortDate(meta.analysisDate)}`}>
        <KpiGrid>
          <KpiTile icon="car-sport-outline" label="Base elegível" value={compactNumber(overview.eligibleVins)} detail="VINs únicos observados" tone="accent" />
          <KpiTile icon="construct-outline" label="Ordens de serviço" value={compactNumber(overview.serviceOrders)} detail={`${overview.avgServicesPerVin.toLocaleString("pt-BR")} por VIN`} tone="info" />
          <KpiTile icon="calendar-outline" label="Agenda digital" value={percent(overview.agendaRate)} detail="das OS com agendamento" tone="success" />
          <KpiTile
            icon="warning-outline"
            label="Leads críticos"
            value={compactNumber(overview.highPriorityLeads)}
            detail={`de ${compactNumber(overview.leadCount)} qualificados`}
            tone="danger"
            onPress={() => router.push("/leads")}
          />
        </KpiGrid>
      </Section>

      <Section title="Fluxo de oficina" subtitle="Ordens de serviço por mês (últimos 12 meses completos)">
        <Card>
          <BarChart data={bars} formatValue={compactNumber} />
        </Card>
      </Section>

      <Section title="Service Share por modelo" subtitle="Os 5 modelos com maior base">
        <Card>
          {topModels.map((m) => (
            <View key={m.modelName} style={styles.modelRow}>
              <View style={styles.rowBetween}>
                <AppText variant="bodySmStrong">{titleCase(m.modelName)}</AppText>
                <AppText variant="bodySmStrong" color={m.serviceShare >= 50 ? colors.success : colors.warning}>
                  {percent(m.serviceShare)}
                </AppText>
              </View>
              <ProgressBar value={m.serviceShare} color={m.serviceShare >= 50 ? colors.accent : colors.warning} />
              <AppText variant="caption" color={colors.textMuted}>
                {compactNumber(m.uniqueVins)} VINs · {compactNumber(m.riskLeads)} leads de risco
              </AppText>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Leituras rápidas">
        {snapshot.insights.map((insight, i) => (
          <Card key={insight.title} style={styles.insight}>
            <IconTile name={["pie-chart-outline", "trending-down-outline", "business-outline"][i % 3] as never} tone={i === 1 ? "danger" : "accent"} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.rowBetween}>
                <AppText variant="titleS" style={{ flex: 1 }}>
                  {insight.title}
                </AppText>
                <AppText variant="metricS" color={colors.brand}>
                  {insight.value.replace(".", ",")}
                </AppText>
              </View>
              <AppText variant="bodySm" color={colors.textMuted}>
                {insight.description}
              </AppText>
            </View>
          </Card>
        ))}
      </Section>

        </>
      ) : null}

      <AppText variant="caption" color={colors.textMuted} align="center">
        Fonte: {meta.source} · {shortDate(meta.dateRange.start)} a {shortDate(meta.dateRange.end)}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  heroCopy: { flex: 1, gap: spacing.xs },
  heroBadges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  alertCard: { padding: 0, borderColor: colors.iotSoft },
  funnel: { flexDirection: "row", justifyContent: "space-between", gap: spacing.xs },
  funnelItem: { alignItems: "center", gap: spacing.xs, flex: 1 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  modelRow: { gap: spacing.xs },
  insight: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }
});
