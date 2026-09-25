import { Barlow_600SemiBold, Barlow_700Bold } from "@expo-google-fonts/barlow";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors, ToastProvider } from "@/design-system";
import { onReminderOpened } from "@/notifications/reminders";
import { AppProvider, useApp } from "@/state/AppProvider";
import { AuthProvider, useAuth } from "@/state/AuthProvider";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { ready } = useApp();
  const { status } = useAuth();
  const segments = useSegments();
  const [fontsLoaded, fontError] = useFonts({
    Barlow_600SemiBold,
    Barlow_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
  });
  const loaded = ready && status !== "loading" && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded]);

  // Guarda de rotas: sem sessão (logout ou 401) → volta para o login
  const onLogin = segments[0] === "login";
  useEffect(() => {
    if (!loaded) return;
    if (status === "signedOut" && !onLogin) router.replace("/login");
  }, [loaded, status, onLogin]);

  // Toque na notificação de lembrete → abre o cliente
  useEffect(() => {
    if (!loaded || status !== "signedIn") return;
    return onReminderOpened((url) => router.push(url as never));
  }, [loaded, status]);

  if (!loaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "slide_from_right" }}>
      <Stack.Screen name="index" options={{ animation: "none" }} />
      <Stack.Screen name="login" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen name="contact/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="schedule/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="reminder/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AuthProvider>
            <ToastProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </ToastProvider>
          </AuthProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
