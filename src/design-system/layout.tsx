import type { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from "react-native";
import { spacing } from "./tokens";

/**
 * Breakpoints do layout responsivo:
 *  - compact  (< 360 px): celulares pequenos → margens e títulos menores
 *  - regular  (360–767 px): celulares
 *  - wide     (≥ 768 px): tablets e web → conteúdo centralizado e mais colunas
 */
export const breakpoints = { compact: 360, wide: 768 } as const;

/** Largura máxima do conteúdo: evita linhas longas demais em tablets e no navegador */
export const contentMaxWidth = 760;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isCompact = width < breakpoints.compact;
  const isWide = width >= breakpoints.wide;
  return {
    width,
    height,
    isCompact,
    isWide,
    /** margem lateral padrão das telas */
    gutter: isCompact ? spacing.md : isWide ? spacing.xxl : spacing.lg,
    /** colunas da grade de KPIs / cartões */
    columns: isWide ? 4 : 2
  };
}

/** Centraliza o conteúdo e limita a largura em telas grandes */
export function Container({ children, style, padded = true }: { children: ReactNode; style?: ViewStyle | ViewStyle[]; padded?: boolean }) {
  const { gutter } = useLayout();
  return <View style={[styles.container, padded && { paddingHorizontal: gutter }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }
});
