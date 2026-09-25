import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radii, spacing, toneColors, type Tone } from "../tokens";
import { AppText } from "./AppText";
import { Button } from "./Button";
import type { IconName } from "./Icon";

/** Bloco "esqueleto" pulsante para estado de carregamento */
export function Skeleton({ height = 16, width = "100%", radius = radii.xs, style }: { height?: number; width?: ViewStyle["width"]; radius?: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ height, width, borderRadius: radius, backgroundColor: colors.border, opacity }, style]} />;
}

/** Estado de carregamento: lista de cartões-esqueleto */
export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <View style={styles.stack} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonHead}>
            <Skeleton height={40} width={40} radius={radii.sm} />
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Skeleton height={14} width="60%" />
              <Skeleton height={12} width="40%" />
            </View>
          </View>
          <Skeleton height={12} />
          <Skeleton height={12} width="80%" />
        </View>
      ))}
    </View>
  );
}

type FeedbackProps = {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: Tone;
};

function FeedbackState({ icon = "information-circle-outline", title, message, actionLabel, onAction, tone = "neutral" }: FeedbackProps) {
  const { fg, bg } = toneColors[tone];
  return (
    <View style={styles.feedback}>
      <View style={[styles.feedbackIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={28} color={fg} />
      </View>
      <AppText variant="titleM" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="bodySm" color={colors.textMuted} align="center">
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" /> : null}
    </View>
  );
}

export function EmptyState(props: Omit<FeedbackProps, "tone">) {
  return <FeedbackState icon="file-tray-outline" {...props} tone="neutral" />;
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <FeedbackState
      icon="cloud-offline-outline"
      title="Não foi possível carregar"
      message={message || "Verifique a conexão e tente novamente."}
      actionLabel={onRetry ? "Tentar de novo" : undefined}
      onAction={onRetry}
      tone="danger"
    />
  );
}

/** Faixa informativa inline (sucesso, alerta, info) */
export function Banner({ tone = "info", icon, title, message }: { tone?: Tone; icon?: IconName; title: string; message?: string }) {
  const { fg, bg } = toneColors[tone];
  return (
    <View style={[styles.banner, { backgroundColor: bg }]} accessibilityRole="alert">
      <Ionicons name={icon || "information-circle"} size={20} color={fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodySmStrong" color={fg}>
          {title}
        </AppText>
        {message ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {message}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md
  },
  skeletonHead: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  feedback: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm
  },
  feedbackIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  banner: { flexDirection: "row", gap: spacing.md, padding: spacing.md, borderRadius: radii.sm, alignItems: "flex-start" }
});
