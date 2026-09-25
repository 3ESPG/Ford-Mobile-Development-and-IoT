import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText, Badge, Card, colors, IconTile, spacing } from "@/design-system";
import { daysToMonths, km } from "@/domain/format";
import { LEAD_STATUS, leadTitle, priorityLabel, priorityTone, type LeadWithState } from "@/domain/leads";

/** Cartão de lead usado na fila, no painel e no detalhe da concessionária */
export function LeadCard({ lead }: { lead: LeadWithState }) {
  const status = LEAD_STATUS[lead.status];
  return (
    <Card onPress={() => router.push(`/lead/${lead.id}`)} accessibilityLabel={`Lead ${leadTitle(lead)}, prioridade ${priorityLabel(lead.priority)}`}>
      <View style={styles.head}>
        <IconTile name={lead.iotAlert ? "hardware-chip" : "car-sport-outline"} tone={lead.iotAlert ? "iot" : "brand"} />
        <View style={styles.title}>
          <AppText variant="titleM" numberOfLines={1}>
            {leadTitle(lead)}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            VIN {lead.vinMask} · Dealer {lead.dealerCode}
          </AppText>
        </View>
        <View style={styles.score}>
          <AppText variant="metricS" color={priorityTone(lead.priority) === "danger" ? colors.danger : colors.warning}>
            {lead.score}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            score
          </AppText>
        </View>
      </View>

      {lead.iotAlert ? (
        <View style={styles.iot}>
          <AppText variant="caption" color={colors.iot} numberOfLines={1}>
            ⚡ {lead.iotAlert.title} — lead preditivo IoT
          </AppText>
        </View>
      ) : null}

      <View style={styles.stats}>
        <Stat label="Sem serviço" value={`${daysToMonths(lead.daysSinceService)} meses`} />
        <Stat label="Odômetro" value={km(lead.lastKm)} />
        <Stat label="Passagens" value={String(lead.serviceCount)} />
      </View>

      <View style={styles.badges}>
        <Badge label={`Prioridade ${priorityLabel(lead.priority)}`} tone={priorityTone(lead.priority)} />
        <Badge label={status.label} tone={status.tone} />
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="bodySmStrong" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { flex: 1, gap: 2 },
  score: { alignItems: "flex-end" },
  iot: { backgroundColor: colors.iotSoft, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  stats: { flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: spacing.md },
  stat: { flex: 1, gap: 2 },
  badges: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }
});
