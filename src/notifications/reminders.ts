import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { colors } from "@/design-system/tokens";

/**
 * Lembretes de serviço como notificações LOCAIS (expo-notifications).
 * Não dependem de servidor de push: o Android dispara no horário mesmo offline.
 */
const CHANNEL_ID = "lembretes-servico";

export const notificationsSupported = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false })
});

let channelReady = false;

async function ensureChannel() {
  if (Platform.OS !== "android" || channelReady) return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Lembretes de serviço",
    description: "Revisões e agendamentos de clientes",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 200, 250],
    lightColor: colors.accent
  });
  channelReady = true;
}

/** Pede a permissão (Android 13+ exige POST_NOTIFICATIONS em tempo de execução) */
export async function ensurePermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function scheduleReminder(input: { title: string; body: string; date: Date; url: string }): Promise<string | null> {
  if (!(await ensurePermission())) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title: input.title, body: input.body, data: { url: input.url }, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: input.date, channelId: CHANNEL_ID }
  });
}

export async function cancelReminder(notificationId: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // já disparada ou removida
  }
}

/** Ao tocar na notificação, abre a tela do cliente (inclusive com o app fechado) */
export function onReminderOpened(open: (url: string) => void): () => void {
  const handle = (response: Notifications.NotificationResponse | null) => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === "string") open(url);
  };
  Notifications.getLastNotificationResponseAsync().then(handle).catch(() => undefined);
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
