import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppButton, AppInput, AppText, EmptyState, FilterChip, Screen } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import { spacing } from '../../theme/tokens';
import { roomErrorMessage } from '../rooms/types';
import { personName, socialRepo, useInvalidateSocial, useSocial } from './useSocial';

export function NewGroupScreen() {
  const router = useRouter();
  const { friends } = useSocial();
  const invalidate = useInvalidateSocial();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const id = await socialRepo().createGroup(name.trim(), selected);
      invalidate();
      router.replace({ pathname: '/amigos/grupos/[id]', params: { id } });
    } catch (e) {
      Alert.alert('Não deu para criar', roomErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Novo grupo' }} />
      <AppInput label="Nome do grupo" value={name} onChangeText={setName} maxLength={30} placeholder="Ex.: Família" />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">Quem entra?</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(friends.data ?? []).map((f) => (
            <FilterChip
              key={f.user_id}
              multi
              label={personName(f)}
              selected={selected.includes(f.user_id)}
              onPress={() => setSelected((s) => (s.includes(f.user_id) ? s.filter((x) => x !== f.user_id) : [...s, f.user_id]))}
            />
          ))}
        </View>
        {(friends.data ?? []).length === 0 ? (
          <AppText variant="small" color="textMuted">
            Só amigos entram em grupos. Adicione alguém primeiro.
          </AppText>
        ) : null}
      </View>
      <AppButton label={busy ? 'Criando…' : 'Criar grupo'} onPress={create} disabled={busy || !name.trim() || selected.length === 0} fullWidth />
    </Screen>
  );
}

export function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { groups, userId } = useSocial();
  const invalidate = useInvalidateSocial();
  const group = (groups.data ?? []).find((g) => g.id === id);

  if (!group) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Grupo não encontrado" message="Você pode ter saído dele." />
      </Screen>
    );
  }

  const others = group.members.filter((m) => m.user_id !== userId).map((m) => m.user_id);

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: '' }} />
      <AppText variant="title1">{group.name}</AppText>
      <AppText color="textMuted">{group.members.length} pessoas</AppText>
      <View style={{ gap: spacing.sm }}>
        {group.members.map((m, i) => (
          <View key={m.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar name={m.name ?? '?'} index={i} />
            <AppText variant="bodyStrong">
              {m.name}
              {m.user_id === userId ? ' (você)' : ''}
            </AppText>
          </View>
        ))}
      </View>
      <AppButton label="Nova decisão com o grupo" onPress={() => router.push({ pathname: '/amigos/convidar', params: { ids: others.join(',') } })} disabled={others.length === 0} fullWidth />
      <AppButton
        label={group.is_owner ? 'Apagar grupo' : 'Sair do grupo'}
        variant="ghost"
        onPress={() =>
          Alert.alert(group.is_owner ? 'Apagar o grupo?' : 'Sair do grupo?', undefined, [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: group.is_owner ? 'Apagar' : 'Sair',
              style: 'destructive',
              onPress: () =>
                socialRepo()
                  .leaveGroup(group.id)
                  .then(() => {
                    invalidate();
                    router.back();
                  }),
            },
          ])
        }
        fullWidth
      />
    </Screen>
  );
}
