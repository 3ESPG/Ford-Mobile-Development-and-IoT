import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, Container, elevation, spacing } from "@/design-system";

/** Barra de ações fixa no rodapé das telas de detalhe */
export function StickyFooter({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, elevation.md, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <Container style={styles.row}>{children}</Container>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md
  },
  row: { flexDirection: "row", gap: spacing.sm }
});
