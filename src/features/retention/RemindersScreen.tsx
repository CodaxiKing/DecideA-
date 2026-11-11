import { Stack } from 'expo-router';
import { useState } from 'react';
import { Platform, Switch, View } from 'react-native';

import { AppCard, AppText, FilterChip, Screen } from '../../components/ui';
import { useRemindersStore } from '../../stores/remindersStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { applyReminders, ensurePermission } from './notifications';
import { WEEKDAY_LABELS, type ReminderSettings } from './reminders';

const hours = [12, 18, 19, 20, 21];

export function RemindersScreen() {
  const { colors } = useTheme();
  const settings = useRemindersStore((s) => s.settings);
  const update = useRemindersStore((s) => s.update);
  const [denied, setDenied] = useState(false);

  /** Liga um lembrete só depois do consentimento; desligar sempre funciona. */
  const save = async (patch: Partial<ReminderSettings>, turningOn: boolean) => {
    if (turningOn && !(await ensurePermission())) {
      setDenied(true);
      return;
    }
    setDenied(false);
    update(patch);
    applyReminders({ ...useRemindersStore.getState().settings }).catch(() => {});
  };

  const toggleRow = (title: string, text: string, value: boolean, onChange: (v: boolean) => void) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="small" color="textMuted">
          {text}
        </AppText>
      </View>
      <Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.surfaceStrong }} thumbColor="#FFFFFF" />
    </View>
  );

  const d = settings.dinner;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Lembretes' }} />
      {Platform.OS === 'web' ? (
        <AppText color="textMuted">Lembretes funcionam no app do celular.</AppText>
      ) : null}
      {denied ? (
        <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
          Sem permissão de notificação. Ative nas configurações do celular para receber lembretes.
        </AppText>
      ) : null}
      <AppCard style={{ gap: spacing.md }}>
        {toggleRow('O que vai ser hoje?', `Sortear o jantar às ${String(d.hour).padStart(2, '0')}:${String(d.minute).padStart(2, '0')}`, d.enabled, (v) =>
          save({ dinner: { ...d, enabled: v } }, v),
        )}
        {d.enabled ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {[2, 3, 4, 5, 6, 7, 1].map((w) => (
                <FilterChip
                  key={w}
                  multi
                  label={WEEKDAY_LABELS[w]}
                  selected={d.weekdays.includes(w)}
                  onPress={() => save({ dinner: { ...d, weekdays: d.weekdays.includes(w) ? d.weekdays.filter((x) => x !== w) : [...d.weekdays, w] } }, false)}
                />
              ))}
            </View>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {hours.map((h) => (
                <FilterChip key={h} label={`${h}:00`} selected={d.hour === h} onPress={() => save({ dinner: { ...d, hour: h, minute: 0 } }, false)} />
              ))}
            </View>
          </>
        ) : null}
      </AppCard>
      <AppCard style={{ gap: spacing.md }}>
        {toggleRow('Cardápio da semana', 'Domingo, 11:30', settings.weeklyMenu.enabled, (v) => save({ weeklyMenu: { enabled: v } }, v))}
        {toggleRow('Deu certo?', 'No dia seguinte a uma decisão', settings.feedback.enabled, (v) => save({ feedback: { enabled: v } }, v))}
        {toggleRow('Retrospectiva do mês', 'No primeiro dia do mês', settings.monthly.enabled, (v) => save({ monthly: { enabled: v } }, v))}
      </AppCard>
    </Screen>
  );
}
