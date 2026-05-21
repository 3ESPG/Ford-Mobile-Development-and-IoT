import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow, spacing } from "@/theme";

type MetricLineProps = {
  label: string;
  value: string;
};

export function MetricLine({ label, value }: MetricLineProps) {
  return (
    <View style={styles.metricLine}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

type BadgeProps = {
  label: string;
  tone?: "green" | "amber" | "red" | "blue";
};

export function Badge({ label, tone = "blue" }: BadgeProps) {
  const color = {
    green: colors.green,
    amber: colors.amber,
    red: colors.red,
    blue: colors.blue
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

type CardHeaderProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function CardHeader({ icon, title, subtitle, right }: CardHeaderProps) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.headerLeft}>
        <View style={styles.headerIcon}>
          <Ionicons name={icon} size={18} color={colors.fordBlue} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center"
  },
  headerText: {
    flex: 1,
    gap: 2
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 12
  },
  metricLine: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  metricLabel: {
    width: 108,
    color: colors.muted,
    fontSize: 13
  },
  metricValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 19
  },
  badge: {
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "900"
  }
});
