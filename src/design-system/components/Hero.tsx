import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { contentMaxWidth, useLayout } from "../layout";
import { colors, gradients, radii, spacing } from "../tokens";
import { AppText } from "./AppText";

type HeroProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  right?: ReactNode;
  back?: boolean;
  children?: ReactNode;
  /** espaço extra no rodapé para o conteúdo "subir" sobre o hero */
  overlap?: number;
};

/** Grafismo de fundo (ondas de sinal) — elemento visual próprio do app */
function SignalArt() {
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220" style={styles.art} pointerEvents="none">
      <Circle cx={180} cy={40} r={60} stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} fill="none" />
      <Circle cx={180} cy={40} r={100} stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} fill="none" />
      <Circle cx={180} cy={40} r={140} stroke="rgba(255,255,255,0.05)" strokeWidth={1.5} fill="none" />
      <Path d="M10 150 L70 150 L85 120 L100 180 L115 135 L125 150 L210 150" stroke="rgba(6,111,239,0.55)" strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

/** Cabeçalho com gradiente azul Ford usado em todas as telas (consistência visual) */
export function Hero({ title, eyebrow, subtitle, right, back, children, overlap = 0 }: HeroProps) {
  const insets = useSafeAreaInsets();
  const { isCompact, gutter } = useLayout();
  const titleVariant = back || isCompact ? "displayM" : "displayL";
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxl + overlap, paddingHorizontal: gutter }]}
    >
      <SignalArt />
      {/* mesma largura útil do corpo da tela (Container) para os conteúdos ficarem alinhados */}
      <View style={[styles.inner, { maxWidth: contentMaxWidth - 2 * gutter }]}>
      <View style={styles.topRow}>
        {back ? (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textOnBrand} />
          </Pressable>
        ) : null}
        <View style={styles.titleBlock}>
          {eyebrow ? (
            <AppText variant="overline" color={colors.textOnBrandMuted}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant={titleVariant} color={colors.textOnBrand} numberOfLines={2}>
            {title}
          </AppText>
        </View>
        {right}
      </View>
      {subtitle ? (
        <AppText variant="bodySm" color={colors.textOnBrandMuted} style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
      {children ? <View style={styles.content}>{children}</View> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: "hidden"
  },
  art: { position: "absolute", right: -20, top: 0 },
  inner: { width: "100%", alignSelf: "center" },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center"
  },
  titleBlock: { flex: 1, gap: 2 },
  subtitle: { marginTop: spacing.sm },
  content: { marginTop: spacing.xl, gap: spacing.md }
});
