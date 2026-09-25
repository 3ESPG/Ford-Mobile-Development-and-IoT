import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { colors, radii, spacing } from "../tokens";
import { AppText } from "./AppText";
import type { IconName } from "./Icon";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  count?: number;
};

export function Chip({ label, selected, onPress, icon, count }: ChipProps) {
  const fg = selected ? colors.textOnBrand : colors.textSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && !selected && styles.pressed]}
    >
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <AppText variant="bodySmStrong" color={fg}>
        {label}
      </AppText>
      {count !== undefined ? (
        <AppText variant="caption" color={selected ? colors.textOnBrandMuted : colors.textMuted}>
          {count}
        </AppText>
      ) : null}
    </Pressable>
  );
}

/** Linha horizontal rolável de chips */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  selected: { backgroundColor: colors.brand, borderColor: colors.brand },
  pressed: { backgroundColor: colors.accentSubtle },
  row: { gap: spacing.sm, paddingRight: spacing.lg }
});
