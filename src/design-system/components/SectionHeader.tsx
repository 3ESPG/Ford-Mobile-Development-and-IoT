import { Pressable, StyleSheet, View } from "react-native";
import { colors, spacing } from "../tokens";
import { AppText } from "./AppText";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <AppText variant="titleL">{title}</AppText>
        {subtitle ? (
          <AppText variant="bodySm" color={colors.textMuted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <AppText variant="bodySmStrong" color={colors.accent}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Agrupa um cabeçalho de seção e seu conteúdo com espaçamento padrão */
export function Section({ children, ...header }: SectionHeaderProps & { children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionHeader {...header} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.md },
  copy: { flex: 1, gap: 2 },
  section: { gap: spacing.md }
});
