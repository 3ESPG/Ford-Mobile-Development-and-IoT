import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { AppText, colors } from "@/design-system";
import { useAuth } from "@/state/AuthProvider";

/** Avatar com as iniciais do usuário — abre o Perfil */
export function ProfileButton() {
  const { user } = useAuth();
  const initials = (user?.name || "?")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Pressable
      onPress={() => router.push("/perfil")}
      style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel="Abrir perfil"
    >
      <AppText variant="bodySmStrong" color={colors.textOnBrand}>
        {initials}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center"
  }
});
