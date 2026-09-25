import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Card,
  Chip,
  ChipRow,
  colors,
  EmptyState,
  IconTile,
  ListRow,
  ProgressBar,
  Screen,
  SearchField,
  Section,
  SegmentedControl,
  spacing
} from "@/design-system";
import { compactNumber, normalize, number, percent, titleCase } from "@/domain/format";
import { priorityLabel } from "@/domain/leads";
import type { Dealer } from "@/domain/types";
import { useApp } from "@/state/AppProvider";
import { useAuth } from "@/state/AuthProvider";
import { AccessDenied } from "@/ui/AccessDenied";
import { ProfileButton } from "@/ui/ProfileButton";

type Sort = "volume" | "share" | "leads";

const PLAYBOOK_ICONS = ["alert-circle-outline", "repeat-outline", "phone-portrait-outline", "speedometer-outline"];

export default function RedeScreen() {
  const { snapshot } = useApp();
  const { user, can } = useAuth();
  const [tab, setTab] = useState<"lojas" | "playbook">("lojas");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("volume");
  const myDealer = user?.dealerCode;

  const dealers = useMemo(() => {
    const q = normalize(query);
    const items = snapshot.dealers.filter((d) => !q || normalize(`${d.dealerCode} ${d.topModel}`).includes(q));
    const by: Record<Sort, (a: Dealer, b: Dealer) => number> = {
      volume: (a, b) => b.orders - a.orders,
      share: (a, b) => a.serviceShare - b.serviceShare,
      leads: (a, b) => b.openLeads - a.openLeads
    };
    return [...items].sort(by[sort]);
  }, [snapshot.dealers, query, sort]);

  const networkShare = snapshot.overview.serviceShare;

  if (!can("network.view")) return <AccessDenied title="Rede Ford" />;

  return (
    <Screen
      eyebrow={`${snapshot.dealers.length} concessionárias na base`}
      title="Rede Ford"
      subtitle={`Service Share médio da rede: ${percent(networkShare)}`}
      heroRight={<ProfileButton />}
      heroContent={
        <SegmentedControl
          inverse
          value={tab}
          onChange={setTab}
          options={[
            { value: "lojas", label: "Concessionárias" },
            { value: "playbook", label: "Playbook" }
          ]}
        />
      }
    >
      {tab === "lojas" ? (
        <View style={{ gap: spacing.md }}>
          <SearchField value={query} onChangeText={setQuery} placeholder="Buscar código do dealer ou modelo" />
          <ChipRow>
            <Chip label="Maior volume" icon="bar-chart-outline" selected={sort === "volume"} onPress={() => setSort("volume")} />
            <Chip label="Menor share" icon="trending-down-outline" selected={sort === "share"} onPress={() => setSort("share")} />
            <Chip label="Mais leads" icon="people-outline" selected={sort === "leads"} onPress={() => setSort("leads")} />
          </ChipRow>
          {dealers.length === 0 ? (
            <EmptyState title="Nenhuma concessionária encontrada" message="Tente outro código ou modelo." />
          ) : (
            dealers.map((d) => {
              const good = d.serviceShare >= networkShare;
              return (
                <Card key={d.dealerCode} onPress={() => router.push(`/dealer/${d.dealerCode}`)}>
                  <View style={styles.row}>
                    <IconTile name="business" tone={good ? "accent" : "warning"} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <AppText variant="titleM">Dealer {d.dealerCode}</AppText>
                        {d.dealerCode === myDealer ? <Badge label="Sua loja" tone="brand" /> : null}
                      </View>
                      <AppText variant="caption" color={colors.textMuted}>
                        {titleCase(d.topModel)} lidera {percent(d.topModelShare, 0)} · {compactNumber(d.uniqueVins)} VINs
                      </AppText>
                    </View>
                    <AppText variant="metricS" color={good ? colors.success : colors.warning}>
                      {percent(d.serviceShare, 0)}
                    </AppText>
                  </View>
                  <ProgressBar value={d.serviceShare} color={good ? colors.accent : colors.warning} />
                  <View style={styles.stats}>
                    <AppText variant="caption" color={colors.textMuted}>
                      {compactNumber(d.orders)} OS
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      Agenda {percent(d.agendaRate, 0)}
                    </AppText>
                    <AppText variant="caption" color={colors.danger}>
                      {number(d.openLeads)} leads abertos
                    </AppText>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      ) : (
        <>
          <Section title="Carteira por segmento" subtitle="Como os VINs da base se distribuem">
            <Card>
              {snapshot.breakdowns.segments.map((s) => (
                <View key={s.label} style={{ gap: spacing.xs }}>
                  <View style={styles.between}>
                    <AppText variant="bodySmStrong">{s.label}</AppText>
                    <AppText variant="bodySmStrong" color={colors.brand}>
                      {percent(s.share)}
                    </AppText>
                  </View>
                  <ProgressBar value={s.share} color={s.label.startsWith("Risco") ? colors.danger : colors.accent} />
                  <AppText variant="caption" color={colors.textMuted}>
                    {number(s.count)} VINs
                  </AppText>
                </View>
              ))}
            </Card>
          </Section>

          <Section title="Funil de risco" subtitle="Prioridade calculada para toda a base">
            <View style={styles.funnel}>
              {snapshot.breakdowns.leadFunnel.map((f) => (
                <Card key={f.label} style={styles.funnelCard}>
                  <AppText variant="caption" color={colors.textMuted}>
                    {priorityLabel(f.label as never)}
                  </AppText>
                  <AppText variant="metricS" color={f.label === "Alta" ? colors.danger : f.label === "Media" ? colors.warning : colors.textPrimary}>
                    {compactNumber(f.count)}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {percent(f.share)}
                  </AppText>
                </Card>
              ))}
            </View>
          </Section>

          <Section title="Playbook de retenção" subtitle="Gatilho → ação → métrica de sucesso">
            {snapshot.opportunities.playbook.map((p, i) => (
              <Card key={p.segment}>
                <View style={styles.row}>
                  <IconTile name={PLAYBOOK_ICONS[i % PLAYBOOK_ICONS.length] as never} tone="accent" />
                  <View style={{ flex: 1 }}>
                    <AppText variant="titleM">{p.segment}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      Gatilho: {p.trigger}
                    </AppText>
                  </View>
                </View>
                <AppText variant="bodySm" color={colors.textSecondary}>
                  {p.action}
                </AppText>
                <Badge label={p.metric} tone="success" icon="stats-chart-outline" />
              </Card>
            ))}
          </Section>

          <Section title="Lojas prioritárias" subtitle="Base relevante e retorno abaixo da média">
            <Card padded={false}>
              {snapshot.opportunities.lowShareDealers.map((d, i, arr) => (
                <ListRow
                  key={d.dealerCode}
                  icon="business-outline"
                  tone="warning"
                  title={`Dealer ${d.dealerCode}`}
                  subtitle={`${compactNumber(d.uniqueVins)} VINs · ${number(d.openLeads)} leads · ${titleCase(d.topModel)}`}
                  right={<Badge label={percent(d.serviceShare, 0)} tone="danger" />}
                  onPress={() => router.push(`/dealer/${d.dealerCode}`)}
                  last={i === arr.length - 1}
                />
              ))}
            </Card>
          </Section>

          <Section title="Modelos com mais risco">
            <Card padded={false}>
              {snapshot.breakdowns.riskModels.slice(0, 6).map((m, i, arr) => (
                <ListRow
                  key={m.label}
                  icon="car-outline"
                  title={titleCase(m.label)}
                  subtitle={`${number(m.count)} leads qualificados`}
                  right={<Badge label={percent(m.share)} tone="warning" />}
                  last={i === arr.length - 1}
                />
              ))}
            </Card>
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stats: { flexDirection: "row", justifyContent: "space-between" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  funnel: { flexDirection: "row", gap: spacing.sm },
  funnelCard: { flex: 1, gap: 2, alignItems: "center" }
});
