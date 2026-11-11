import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useHistoryStore } from '../../stores/historyStore';
import { useRemindersStore } from '../../stores/remindersStore';
import { scheduleFeedbackReminder } from './notifications';

/**
 * Lembretes em segundo plano: agenda o "Deu certo?" depois de cada decisão
 * (se ligado) e abre a tela certa ao tocar numa notificação.
 */
export function RetentionManager() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const unsub = useHistoryStore.subscribe((s, prev) => {
      if (!useRemindersStore.getState().settings.feedback.enabled) return;
      const latest = s.entries[0];
      if (!latest || latest === prev.entries[0] || !latest.refId || latest.kind === 'wheel') return;
      scheduleFeedbackReminder(latest.title, new Date(latest.createdAt)).catch(() => {});
    });
    const tap = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = (r.notification.request.content.data as { url?: string } | undefined)?.url;
      if (url) router.push(url as never);
    });
    return () => {
      unsub();
      tap.remove();
    };
  }, []);
  return null;
}
