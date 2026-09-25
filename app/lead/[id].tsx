import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Share, StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Banner,
  Button,
  Card,
  colors,
  EmptyState,
  MetricRow,
  ProgressBar,
  RingGauge,
  Screen,
  Section,
  spacing,
  useToast
} from "@/design-system";
import { daysToMonths, km, longDate, number, relativeTime, shortDate } from "@/domain/format";
import { CHANNELS, contactMessage, LEAD_STATUS, leadTitle, OUTCOMES, priorityLabel, priorityTone, scoreFactors, suggestedService } from "@/domain/leads";
import { serviceLabel } from "@/domain/schedule";
import { useApp } from "@/state/AppProvider";
import { StickyFooter } from "@/ui/StickyFooter";

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leadById, snapshot, crm, acknowledgeAlert, setLeadStatus } = useApp();
  const toast = useToast();
  const lead = leadById(String(id));

  const factors = useMemo(() => (lead ? scoreFactors(lead, snapshot.meta.analysisDate) : []), [lead, snapshot.meta.analysisDate]);

  if (!lead) {
    return (
      <Screen title="Lead" back>
        <EmptyState title="Lead não encontrado" message="Ele pode ter saído da base após a última sincronização." actionLabel="Voltar" onAction={() => router.back()} />
      </Screen>
    );
  }

  const status = LEAD_STATUS[lead.status];
  const history = crm.interactions.filter((i) => i.leadId === lead.id);
  const appointments = crm.appointments.filter((a) => a.leadId === lead.id);
  const message = contactMessage(lead, lead.dealerCode, lead.iotAlert);
  const dealer = snapshot.dealers.find((d) => d.dealerCode === lead.dealerCode);

  const share = async () => {
    try {
      await Share.share({ message });
    } catch {
      toast.show({ title: "Não foi possível compartilhar", tone: "danger" });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen
        back
        eyebrow={`VIN ${lead.vinMask}`}
        title={leadTitle(lead)}
        heroContent={
          <View style={styles.heroRow}>
            <RingGauge value={lead.score} size={88} stroke={9} color={lead.priority === "Alta" ? "#FF6B5E" : "#FFB547"} track="rgba(255,255,255,0.16)">
              <AppText variant="metricS" color={colors.textOnBrand}>
                {lead.score}
              </AppText>
              <AppText variant="caption" color={colors.textOnBrandMuted}>
                score
              </AppText>
            </RingGauge>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <View style={styles.badges}>
                <Badge label={`Prioridade ${priorityLabel(lead.priority)}`} tone={priorityTone(lead.priority)} solid />
                <Badge label={status.label} tone={status.tone} />
              </View>
              <AppText variant="bodySmStrong" color={colors.textOnBrand}>
                {lead.recommendedAction}
              </AppText>
              <AppText variant="caption" color={colors.textOnBrandMuted}>
                Serviço sugerido: {suggestedService(lead)}
              </AppText>
            </View>
          </View>
        }
      >
        {lead.iotAlert ? (
          <Card>
            <Banner tone="iot" icon="hardware-chip" title={`Alerta do veículo: ${lead.iotAlert.title}`} message={`${lead.iotAlert.message} · ${relativeTime(lead.iotAlert.createdAt)}`} />
            <Button
              label="Marcar alerta como tratado"
              variant="secondary"
              size="sm"
              icon="checkmark-done-outline"
              onPress={async () => {
                await acknowledgeAlert(lead.iotAlert!);
                toast.show({ title: "Alerta tratado", tone: "success" });
              }}
            />
          </Card>
        ) : null}

        <Section title="Por que este cliente?" subtitle="Composição explicável do score de risco de evasão">
          <Card>
            {factors.map((f) => (
              <View key={f.key} style={styles.factor}>
                <View style={styles.rowBetween}>
                  <AppText variant="bodySmStrong">{f.label}</AppText>
                  <AppText variant="bodySmStrong" color={f.points ? colors.brand : colors.textMuted}>
                    +{f.points}
                    <AppText variant="caption" color={colors.textMuted}>
                      {" "}
                      / {f.max}
                    </AppText>
                  </AppText>
                </View>
                <ProgressBar value={(f.points / f.max) * 100} color={f.points ? colors.accent : colors.border} height={6} />
                <AppText variant="caption" color={colors.textMuted}>
                  {f.detail}
                </AppText>
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Visão 360° do veículo">
          <Card>
            <MetricRow label="Concessionária" value={`Dealer ${lead.dealerCode}${dealer ? ` · share ${dealer.serviceShare.toLocaleString("pt-BR")}%` : ""}`} />
            <MetricRow label="Último serviço" value={`${shortDate(lead.lastServiceDate)} (${daysToMonths(lead.daysSinceService)} meses)`} />
            <MetricRow label="Passagens na rede" value={number(lead.serviceCount)} />
            <MetricRow label="KM no último serviço" value={km(lead.lastKm)} />
            <MetricRow label="Rodagem estimada" value={lead.estimatedKmPerYear ? `${number(lead.estimatedKmPerYear)} km/ano` : "Não disponível"} />
            <MetricRow label="Próxima janela" value={shortDate(lead.nextDueDate)} />
            <MetricRow label="Fim da garantia" value={lead.warrantyEndDate ? shortDate(lead.warrantyEndDate) : "Não disponível"} last />
          </Card>
        </Section>

        <Section title="Mensagem personalizada" subtitle="Gerada a partir do motivo do lead">
          <Card tone="muted">
            <AppText variant="bodySm" color={colors.textSecondary}>
              {message}
            </AppText>
            <Button label="Compartilhar mensagem" icon="share-social-outline" variant="secondary" size="sm" onPress={share} />
          </Card>
        </Section>

        <Section title="Histórico de relacionamento">
          {history.length === 0 && appointments.length === 0 ? (
            <EmptyState title="Sem contatos registrados" message="Registre o primeiro contato para iniciar a jornada deste cliente." />
          ) : (
            <Card>
              {appointments.map((a) => (
                <TimelineItem
                  key={`a${a.id}`}
                  icon="calendar"
                  color={a.status === "cancelado" ? colors.danger : a.status === "concluido" ? colors.success : colors.info}
                  title={`${serviceLabel(a.serviceType)} · ${a.status === "confirmado" ? "agendado" : a.status}`}
                  subtitle={`${longDate(a.date)} às ${a.slot}`}
                />
              ))}
              {history.map((h) => (
                <TimelineItem
                  key={`i${h.id}`}
                  icon={CHANNELS[h.channel].icon as never}
                  color={h.outcome === "recusou" ? colors.danger : colors.accent}
                  title={`${CHANNELS[h.channel].label} · ${OUTCOMES[h.outcome].label}`}
                  subtitle={`${relativeTime(h.createdAt)}${h.note ? ` · ${h.note}` : ""}`}
                />
              ))}
            </Card>
          )}
          {lead.status === "perdido" ? (
            <Button label="Reabrir lead" variant="ghost" icon="refresh" onPress={() => setLeadStatus(lead.id, "novo")} />
          ) : lead.status !== "retido" ? (
            <Button
              label="Marcar como perdido"
              variant="danger"
              size="sm"
              icon="close-circle-outline"
              onPress={async () => {
                await setLeadStatus(lead.id, "perdido");
                toast.show({ title: "Lead marcado como perdido", tone: "warning" });
              }}
            />
          ) : null}
        </Section>
        <View style={{ height: 60 }} />
      </Screen>

      <StickyFooter>
        <Button label="Registrar contato" icon="chatbubbles-outline" variant="secondary" style={{ flex: 1 }} onPress={() => router.push(`/contact/${lead.id}`)} />
        <Button label="Agendar" icon="calendar-outline" style={{ flex: 1 }} onPress={() => router.push(`/schedule/${lead.id}`)} testID="lead-schedule" />
      </StickyFooter>
    </View>
  );
}

function TimelineItem({ icon, color, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; subtitle: string }) {
  return (
    <View style={styles.timeline}>
      <View style={[styles.timelineDot, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodySmStrong">{title}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  badges: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  factor: { gap: spacing.xs },
  timeline: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  timelineDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }
});
