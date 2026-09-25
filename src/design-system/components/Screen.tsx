import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "../tokens";
import { Hero } from "./Hero";

type ScreenProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  heroRight?: ReactNode;
  heroContent?: ReactNode;
  back?: boolean;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
};

/** Estrutura padrão de tela: Hero azul Ford + conteúdo rolável que sobrepõe levemente o hero */
export function Screen({ title, eyebrow, subtitle, heroRight, heroContent, back, children, refreshing, onRefresh, footer }: ScreenProps) {
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}
      >
        <Hero title={title} eyebrow={eyebrow} subtitle={subtitle} right={heroRight} back={back}>
          {heroContent}
        </Hero>
        <View style={styles.body}>{children}</View>
      </ScrollView>
      {footer}
    </View>
  );
}

/** Conteúdo com padding padrão — útil em FlatList (ListHeaderComponent) */
export function ScreenBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 120 },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.xxl }
});
