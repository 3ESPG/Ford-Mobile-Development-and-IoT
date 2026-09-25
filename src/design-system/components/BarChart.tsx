import { StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "../tokens";
import { AppText } from "./AppText";

export type BarDatum = { key: string; label: string; value: number; highlight?: boolean; muted?: boolean };

type BarChartProps = {
  data: BarDatum[];
  height?: number;
  formatValue?: (value: number) => string;
};

/** Gráfico de barras vertical leve (sem dependências), com rótulo no topo da barra destacada */
export function BarChart({ data, height = 140, formatValue = String }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={styles.wrap}>
      <View style={[styles.plot, { height }]}>
        {[0.25, 0.5, 0.75].map((g) => (
          <View key={g} style={[styles.grid, { bottom: height * g }]} />
        ))}
        {data.map((d) => {
          const h = Math.max(4, (d.value / max) * (height - 22));
          return (
            <View key={d.key} style={styles.slot} accessibilityLabel={`${d.label}: ${formatValue(d.value)}`}>
              {d.highlight ? (
                <AppText variant="caption" color={colors.brand} style={styles.valueLabel}>
                  {formatValue(d.value)}
                </AppText>
              ) : null}
              <View
                style={[
                  styles.bar,
                  { height: h, backgroundColor: d.highlight ? colors.accent : d.muted ? colors.borderStrong : colors.skySoft }
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d) => (
          <AppText key={d.key} variant="caption" color={d.highlight ? colors.brand : colors.textMuted} style={styles.label} numberOfLines={1}>
            {d.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  plot: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  grid: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: colors.border },
  slot: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  valueLabel: { marginBottom: 4, fontSize: 10, width: 48, textAlign: "center" },
  bar: { width: "100%", maxWidth: 22, borderTopLeftRadius: radii.xs, borderTopRightRadius: radii.xs, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  labels: { flexDirection: "row", gap: 6 },
  label: { flex: 1, textAlign: "center", fontSize: 10 }
});
