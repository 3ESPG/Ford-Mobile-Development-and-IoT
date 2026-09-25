import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { AppText, colors } from "@/design-system";
import { useApp } from "@/state/AppProvider";

/** Avatar com as iniciais do usuário — abre Ajustes */
export function ProfileButton() {
  const { settings } = useApp();
  const initials = (settings.profile?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Pressable
      onPress={() => router.push("/settings")}
      style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel="Abrir ajustes e perfil"
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
