import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, spacing } from "@/theme";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  selected: {
    borderColor: colors.fordBlue,
    backgroundColor: colors.fordBlue
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  selectedLabel: {
    color: "#FFFFFF"
  }
});
