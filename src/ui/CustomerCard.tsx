import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText, Card, colors, IconTile, ProgressBar, spacing, toneColors } from "@/design-system";
import { CUSTOMER_PROFILES, type Customer } from "@/domain/customers";
import { daysToMonths, titleCase } from "@/domain/format";
import { ProfileBadge } from "./ProfileBadge";

export function riskColor(score: number) {
  if (score >= 70) return colors.danger;
  if (score >= 45) return colors.warning;
  return colors.success;
}

/** Cartão de cliente usado na lista de clientes */
export function CustomerCard({ customer }: { customer: Customer }) {
  const info = CUSTOMER_PROFILES[customer.profile];
  const color = riskColor(customer.riskScore);
  return (
    <Card onPress={() => router.push(`/cliente/${customer.id}`)} accessibilityLabel={`Cliente ${customer.name}, perfil ${info.label}, risco ${customer.riskScore}`}>
      <View style={styles.head}>
        <IconTile name={info.icon as never} tone={info.tone} />
        <View style={styles.title}>
          <AppText variant="titleM" numberOfLines={1}>
            {customer.name}
          </AppText>
          <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
            {titleCase(customer.vehicle.modelName)} {customer.vehicle.modelYear ?? ""} · VIN {customer.vehicle.vinMask}
          </AppText>
        </View>
        <View style={styles.score}>
          <AppText variant="metricS" color={color}>
            {customer.riskScore}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            risco
          </AppText>
        </View>
      </View>
      <ProgressBar value={customer.riskScore} color={color} height={6} />
      <View style={styles.foot}>
        <ProfileBadge profile={customer.profile} />
        <AppText variant="caption" color={toneColors[info.tone].fg} style={styles.meta} numberOfLines={1}>
          {customer.daysSinceService < 60 ? "Serviço recente" : `${daysToMonths(customer.daysSinceService)} meses sem serviço`} · Dealer {customer.dealerCode}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { flex: 1, gap: 2 },
  score: { alignItems: "flex-end" },
  foot: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  meta: { flex: 1, textAlign: "right" }
});
