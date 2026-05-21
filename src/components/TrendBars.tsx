import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme";
import type { MonthPoint } from "@/types";
import { compactNumber } from "@/utils";

type TrendBarsProps = {
  data: MonthPoint[];
};

export function TrendBars({ data }: TrendBarsProps) {
  const points = data.slice(-12);
  const max = Math.max(...points.map((item) => item.orders), 1);

  return (
    <View style={styles.card}>
      <View style={styles.axis}>
        {points.map((item) => {
          const height = Math.max(16, (item.orders / max) * 130);
          return (
            <View key={item.month} style={styles.barSlot}>
              <View style={styles.valueWrap}>
                <Text style={styles.value}>{compactNumber(item.orders)}</Text>
              </View>
              <View style={[styles.bar, { height }]} />
              <Text style={styles.month}>{item.month.slice(5)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md
  },
  axis: {
    minHeight: 190,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.xs
  },
  barSlot: {
    width: 24,
    minHeight: 172,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.xs
  },
  valueWrap: {
    height: 26,
    justifyContent: "flex-end"
  },
  value: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  },
  bar: {
    width: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.blue
  },
  month: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  }
});
