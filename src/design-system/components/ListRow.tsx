import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, spacing, type Tone } from "../tokens";
import { AppText } from "./AppText";
import { IconTile, type IconName } from "./Icon";

type ListRowProps = {
  icon?: IconName;
  tone?: Tone;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
};

export function ListRow({ icon, tone = "brand", title, subtitle, right, onPress, last }: ListRowProps) {
  const content = (
    <View style={[styles.row, !last && styles.divider]}>
      {icon ? <IconTile name={icon} tone={tone} size="sm" /> : null}
      <View style={styles.copy}>
        <AppText variant="titleS" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { backgroundColor: colors.surfaceMuted }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
  copy: { flex: 1, gap: 2 }
});
