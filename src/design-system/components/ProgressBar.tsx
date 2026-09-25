import { StyleSheet, View } from "react-native";
import { colors, radii } from "../tokens";

type ProgressBarProps = {
  value: number; // 0..100
  color?: string;
  track?: string;
  height?: number;
};

export function ProgressBar({ value, color = colors.accent, track = colors.surfaceMuted, height = 8 }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[styles.track, { backgroundColor: track, height, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", overflow: "hidden", borderRadius: radii.pill },
  fill: { height: "100%" }
});
