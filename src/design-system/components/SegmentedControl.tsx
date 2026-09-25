import { Pressable, StyleSheet, View } from "react-native";
import { colors, elevation, radii, spacing } from "../tokens";
import { AppText } from "./AppText";

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  inverse?: boolean;
};

export function SegmentedControl<T extends string>({ options, value, onChange, inverse }: SegmentedControlProps<T>) {
  return (
    <View style={[styles.track, inverse && styles.trackInverse]} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.active, active && elevation.sm]}
          >
            <AppText
              variant="bodySmStrong"
              color={active ? colors.brand : inverse ? colors.textOnBrandMuted : colors.textMuted}
              numberOfLines={1}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: spacing.xs,
    gap: spacing.xs
  },
  trackInverse: { backgroundColor: "rgba(255,255,255,0.12)" },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  active: { backgroundColor: colors.surface }
});
