/**
 * Pré-visualização web: sem notificações locais. Os lembretes continuam
 * registrados no app; no APK Android eles viram notificações (reminders.ts).
 */
export const notificationsSupported = false;

export async function ensurePermission(): Promise<boolean> {
  return false;
}

export async function scheduleReminder(_input: { title: string; body: string; date: Date; url: string }): Promise<string | null> {
  return null;
}

export async function cancelReminder(_notificationId: string | null) {}

export function onReminderOpened(_open: (url: string) => void): () => void {
  return () => undefined;
}
