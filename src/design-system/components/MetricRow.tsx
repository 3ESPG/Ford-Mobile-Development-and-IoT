import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../tokens";
import { AppText } from "./AppText";

type MetricRowProps = {
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
};

/** Linha rótulo/valor para fichas técnicas e detalhes */
export function MetricRow({ label, value, valueColor = colors.textPrimary, last }: MetricRowProps) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <AppText variant="bodySm" color={colors.textMuted} style={styles.label}>
        {label}
      </AppText>
      <AppText variant="bodySmStrong" color={valueColor} style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.lg, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
  label: { flexShrink: 0, maxWidth: "50%" },
  value: { flex: 1, textAlign: "right" }
});
