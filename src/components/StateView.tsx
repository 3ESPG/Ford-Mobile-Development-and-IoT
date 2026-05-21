import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme";

export function LoadingState() {
  return (
    <View style={styles.box}>
      <ActivityIndicator color={colors.fordBlue} />
      <Text style={styles.text}>Carregando dados</Text>
    </View>
  );
}

type ErrorStateProps = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.box}>
      <Ionicons name="cloud-offline-outline" size={26} color={colors.red} />
      <Text style={styles.title}>API indisponível</Text>
      <Text style={styles.text}>{message || "Inicie a API local e tente novamente."}</Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.buttonText}>Tentar de novo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 220,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  text: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20
  },
  button: {
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    backgroundColor: colors.fordBlue,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800"
  }
});
