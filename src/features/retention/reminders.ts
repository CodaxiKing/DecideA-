/**
 * Lembretes (Fase 18): só com consentimento, em horários escolhidos e com
 * desligamento por tipo (seção 12 do plano). Aqui fica a regra pura; o
 * agendamento real usa expo-notifications.
 */
export interface ReminderSettings {
  dinner: { enabled: boolean; weekdays: number[]; hour: number; minute: number };
  weeklyMenu: { enabled: boolean };
  feedback: { enabled: boolean };
  monthly: { enabled: boolean };
}

export const defaultReminders: ReminderSettings = {
  dinner: { enabled: false, weekdays: [2, 3, 4, 5, 6], hour: 19, minute: 0 },
  weeklyMenu: { enabled: false },
  feedback: { enabled: false },
  monthly: { enabled: false },
};

/** Dias no formato do Expo: 1 = domingo … 7 = sábado. */
export const WEEKDAY_LABELS: Record<number, string> = { 2: 'Seg', 3: 'Ter', 4: 'Qua', 5: 'Qui', 6: 'Sex', 7: 'Sáb', 1: 'Dom' };

export type ReminderPlan =
  | { id: string; kind: 'dinner'; title: string; body: string; trigger: { type: 'weekly'; weekday: number; hour: number; minute: number } }
  | { id: string; kind: 'weeklyMenu'; title: string; body: string; trigger: { type: 'weekly'; weekday: number; hour: number; minute: number } }
  | { id: string; kind: 'monthly'; title: string; body: string; trigger: { type: 'monthly'; day: number; hour: number; minute: number } };

/** Lembretes recorrentes a agendar para as configurações. Desligado = nenhum. */
export function planReminders(s: ReminderSettings): ReminderPlan[] {
  const out: ReminderPlan[] = [];
  if (s.dinner.enabled) {
    for (const weekday of [...new Set(s.dinner.weekdays)].sort()) {
      out.push({
        id: `dinner-${weekday}`,
        kind: 'dinner',
        title: 'O que vai ser hoje?',
        body: 'Toque para sortear o jantar.',
        trigger: { type: 'weekly', weekday, hour: s.dinner.hour, minute: s.dinner.minute },
      });
    }
  }
  if (s.weeklyMenu.enabled) {
    out.push({
      id: 'weekly-menu',
      kind: 'weeklyMenu',
      title: 'Cardápio da semana',
      body: 'Sorteie os jantares da semana e gere a lista de compras.',
      trigger: { type: 'weekly', weekday: 1, hour: 11, minute: 30 },
    });
  }
  if (s.monthly.enabled) {
    out.push({
      id: 'monthly-retro',
      kind: 'monthly',
      title: 'Sua retrospectiva chegou',
      body: 'Veja tudo o que vocês decidiram no mês.',
      trigger: { type: 'monthly', day: 1, hour: 10, minute: 0 },
    });
  }
  return out;
}

/** "Deu certo?" no dia seguinte, às 10h. */
export function feedbackReminderDate(decidedAt: Date): Date {
  const d = new Date(decidedAt);
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}
