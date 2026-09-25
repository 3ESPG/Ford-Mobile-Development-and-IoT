import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import type { AlertSeverity } from "@/domain/types";

/**
 * Atuador: motor de vibração do celular (expo-haptics).
 * Crítico → padrão de erro; alerta → aviso; info → toque leve.
 */
export async function notifyAlert(severity: AlertSeverity) {
  if (Platform.OS === "web") return;
  try {
    if (severity === "critical") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (severity === "warning") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // dispositivo sem motor de vibração
  }
}

export async function tapFeedback() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // ignore
  }
}

export async function successFeedback() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}
