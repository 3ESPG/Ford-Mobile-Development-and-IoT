import { StyleSheet, View } from "react-native";
import { colors, spacing, type Tone } from "../tokens";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { IconTile, type IconName } from "./Icon";

type KpiTileProps = {
  icon: IconName;
  label: string;
  value: string;
  detail?: string;
  tone?: Tone;
  onPress?: () => void;
};

export function KpiTile({ icon, label, value, detail, tone = "accent", onPress }: KpiTileProps) {
  return (
    <Card onPress={onPress} style={styles.tile} accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.top}>
        <IconTile name={icon} tone={tone} size="sm" />
        <AppText variant="caption" color={colors.textMuted} style={styles.label} numberOfLines={2}>
          {label}
        </AppText>
      </View>
      <AppText variant="metric" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      {detail ? (
        <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
          {detail}
        </AppText>
      ) : null}
    </Card>
  );
}

/** Grid de 2 colunas para KPIs */
export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  tile: { flexBasis: "47%", flexGrow: 1, gap: spacing.sm },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { flex: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }
});
