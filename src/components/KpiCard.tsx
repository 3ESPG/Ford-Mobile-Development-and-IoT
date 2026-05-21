import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow, spacing } from "@/theme";

type KpiCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "green" | "amber" | "red" | "cyan";
};

const toneMap = {
  blue: colors.blue,
  green: colors.green,
  amber: colors.amber,
  red: colors.red,
  cyan: colors.cyan
};

export function KpiCard({ icon, label, value, detail, tone = "blue" }: KpiCardProps) {
  const color = toneMap[tone];

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 148,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.sm,
    ...shadow
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  value: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  detail: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16
  }
});
