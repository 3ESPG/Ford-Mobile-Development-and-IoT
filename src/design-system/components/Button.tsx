import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radii, spacing, touchTarget } from "../tokens";
import { AppText } from "./AppText";
import type { IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "onBrand";
type Size = "md" | "sm";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
};

const variants: Record<Variant, { bg: string; bgPressed: string; fg: string; border: string }> = {
  primary: { bg: colors.accent, bgPressed: colors.accentPressed, fg: colors.textOnBrand, border: colors.accent },
  secondary: { bg: colors.surface, bgPressed: colors.accentSubtle, fg: colors.brand, border: colors.borderStrong },
  ghost: { bg: "transparent", bgPressed: colors.accentSubtle, fg: colors.accent, border: "transparent" },
  danger: { bg: colors.surface, bgPressed: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  onBrand: { bg: "rgba(255,255,255,0.14)", bgPressed: "rgba(255,255,255,0.24)", fg: colors.textOnBrand, border: "rgba(255,255,255,0.22)" }
};

/** Botão do Design System com estados: default, pressed, loading e disabled */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth,
  style,
  testID
}: ButtonProps) {
  const v = variants[variant];
  const isDisabled = disabled || loading;
  const height = size === "md" ? Math.max(48, touchTarget) : 36;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal: size === "md" ? spacing.xl : spacing.md,
          backgroundColor: pressed ? v.bgPressed : v.bg,
          borderColor: v.border,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "auto"
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={size === "md" ? 18 : 16} color={v.fg} /> : null}
          <AppText variant={size === "md" ? "button" : "bodySmStrong"} color={v.fg} numberOfLines={1}>
            {label}
          </AppText>
          {iconRight ? <Ionicons name={iconRight} size={size === "md" ? 18 : 16} color={v.fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm }
});
