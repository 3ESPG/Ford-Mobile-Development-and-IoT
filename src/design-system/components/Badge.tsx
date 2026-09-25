import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { radii, spacing, toneColors, type Tone } from "../tokens";
import { AppText } from "./AppText";
import type { IconName } from "./Icon";

type BadgeProps = {
  label: string;
  tone?: Tone;
  icon?: IconName;
  solid?: boolean;
};

export function Badge({ label, tone = "accent", icon, solid }: BadgeProps) {
  const { fg, bg } = toneColors[tone];
  const color = solid ? "#FFFFFF" : fg;
  return (
    <View style={[styles.badge, { backgroundColor: solid ? fg : bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={color} /> : null}
      <AppText variant="caption" color={color} numberOfLines={1} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

/** Ponto de status (ex.: conexão IoT) */
export function StatusDot({ tone = "success" }: { tone?: Tone }) {
  return <View style={[styles.dot, { backgroundColor: toneColors[tone].fg }]} />;
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start"
  },
  text: { fontFamily: "Inter_600SemiBold" },
  dot: { width: 8, height: 8, borderRadius: 4 }
});
