import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, elevation, radii, spacing } from "../tokens";

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  tone?: "default" | "muted" | "brand";
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
};

const toneStyles = {
  default: { backgroundColor: colors.surface, borderColor: colors.border },
  muted: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted },
  brand: { backgroundColor: colors.brand, borderColor: colors.brand }
};

/** Superfície base. Quando recebe onPress vira um elemento tocável com feedback. */
export function Card({ children, onPress, padded = true, tone = "default", style, accessibilityLabel }: CardProps) {
  const base = [styles.card, toneStyles[tone], padded && styles.padded, tone === "default" && elevation.sm, style];
  if (!onPress) {
    return <View style={base}>{children}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.md, borderWidth: 1, overflow: "hidden" },
  padded: { padding: spacing.lg, gap: spacing.md },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.94 }
});
