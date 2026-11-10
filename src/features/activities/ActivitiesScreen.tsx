import { Stack, useRouter } from 'expo-router';
import { Alert, View } from 'react-native';

import { AppButton, AppText, FilterChip, Screen } from '../../components/ui';
import { useActivityStore } from '../../stores/activityStore';
import { spacing } from '../../theme/tokens';
import { companyLabels, moodLabels, placeLabels, timeOfDay, type ActivityFilters, type Company, type Mood, type Place } from './catalog';
import { activityPool, drawActivity } from './drawActivity';

const times = [
  { v: 30, l: '30 min' },
  { v: 60, l: '1 h' },
  { v: 120, l: '2 h' },
  { v: 600, l: 'O dia' },
];
const todLabels = { manha: 'de manhã', tarde: 'à tarde', noite: 'à noite' } as const;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="smallStrong">{title}</AppText>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {children}
      </View>
    </View>
  );
}

export function ActivitiesScreen() {
  const router = useRouter();
  const filters = useActivityStore((s) => s.filters);
  const setFilters = useActivityStore((s) => s.setFilters);
  const set = (patch: Partial<ActivityFilters>) => setFilters({ ...filters, ...patch });
  const toggle = <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => set({ [key]: filters[key] === value ? undefined : value } as Partial<ActivityFilters>);
  const count = activityPool(filters).length;

  const draw = () => {
    const a = drawActivity();
    if (!a) {
      Alert.alert('Nenhuma atividade', 'Nada combina com esses filtros. Tente afrouxar algum.');
      return;
    }
    router.push({ pathname: '/fazer/resultado', params: { id: a.id } });
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: '' }} />
      <AppText variant="title1">O Que Fazer?</AppText>
      <Group title="Com quem?">
        {(Object.keys(companyLabels) as Company[]).map((c) => (
          <FilterChip key={c} label={companyLabels[c]} selected={filters.company === c} onPress={() => toggle('company', c)} />
        ))}
      </Group>
      <Group title="Quanto tempo?">
        {times.map((t) => (
          <FilterChip key={t.v} label={t.l} selected={filters.maxMinutes === t.v} onPress={() => toggle('maxMinutes', t.v)} />
        ))}
      </Group>
      <Group title="Onde?">
        {(Object.keys(placeLabels) as Place[]).map((p) => (
          <FilterChip key={p} label={placeLabels[p]} selected={filters.place === p} onPress={() => toggle('place', p)} />
        ))}
        <FilterChip label="Tanto faz" selected={!filters.place} onPress={() => set({ place: undefined })} />
      </Group>
      <Group title="Qual o clima?">
        {(Object.keys(moodLabels) as Mood[]).map((m) => (
          <FilterChip key={m} label={moodLabels[m]} selected={filters.mood === m} onPress={() => toggle('mood', m)} />
        ))}
      </Group>
      <AppText variant="small" color="textMuted">
        {count === 0 ? 'Nenhuma atividade com esses filtros.' : `${count} ${count === 1 ? 'atividade boa' : 'atividades boas'} para fazer ${todLabels[timeOfDay()]}.`}
      </AppText>
      <View style={{ gap: 10 }}>
        <AppButton label="Sortear atividade" onPress={draw} disabled={count === 0} fullWidth />
        <AppButton label="Decidir a dois" variant="ghost" onPress={() => router.push({ pathname: '/sala/criar', params: { kind: 'activity', mode: 'match' } })} fullWidth />
      </View>
    </Screen>
  );
}
