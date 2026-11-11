import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { feedbackReminderDate, planReminders, type ReminderSettings } from './reminders';

const TAG = 'decideai-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Reagenda os lembretes recorrentes do zero (cancelar e criar evita duplicados). */
export async function applyReminders(settings: ReminderSettings): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => (n.content.data as { tag?: string } | undefined)?.tag === TAG && (n.content.data as { kind?: string }).kind !== 'feedback')
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  const plans = planReminders(settings);
  for (const p of plans) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: { title: p.title, body: p.body, data: { tag: TAG, kind: p.kind, url: p.kind === 'monthly' ? '/retrospectiva' : p.kind === 'weeklyMenu' ? '/cardapio' : '/comer' } },
      trigger:
        p.trigger.type === 'weekly'
          ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: p.trigger.weekday, hour: p.trigger.hour, minute: p.trigger.minute }
          : { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: p.trigger.day, hour: p.trigger.hour, minute: p.trigger.minute },
    });
  }
  return plans.length;
}

/** "Deu certo?" no dia seguinte a uma decisão (substitui o anterior). */
export async function scheduleFeedbackReminder(title: string, decidedAt: Date): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync('feedback').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'feedback',
    content: { title: 'Deu certo?', body: `Como foi ${title}? Sua resposta melhora as sugestões.`, data: { tag: TAG, kind: 'feedback', url: '/' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: feedbackReminderDate(decidedAt) },
  });
}
