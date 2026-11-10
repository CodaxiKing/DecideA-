import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';

import { AppBadge, AppButton, AppCard, AppText, EmptyState, Icon, Screen } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import { supabase } from '../../services/supabase';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { formatDayLabel } from '../../utils/dates';
import { itemInfo } from '../catalog/items';
import { personName, socialRepo, useInvalidateSocial, useSocial } from './useSocial';

/** Dupla fixa: conectar, aceitar, favoritos em comum, decidir agora e desfazer. */
export function PairScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { pair, friends, registered } = useSocial();
  const invalidate = useInvalidateSocial();
  const myFavs = useFavoritesStore((s) => s.items);
  const recent = useHistoryStore((s) => s.entries.filter((e) => e.source === 'Match a dois').slice(0, 5));
  const link = pair.data;
  const partnerFavs = useQuery({
    queryKey: ['social', 'partnerFavorites', link?.partner_id],
    queryFn: () => socialRepo().partnerFavorites(link!.partner_id),
    enabled: !!supabase && link?.status === 'accepted',
  });

  if (!registered) {
    return (
      <Screen scroll={false} edges={[]}>
        <EmptyState title="Dupla precisa de conta" message="Crie uma conta em Perfil para conectar sua dupla." />
      </Screen>
    );
  }

  if (!link) {
    return (
      <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
        <Stack.Screen options={{ title: '' }} />
        <AppText variant="title1">Conecte sua dupla</AppText>
        <AppCard>
          {[
            ['Preferências em comum', 'heart'],
            ['Favoritos compartilhados', 'heartFilled'],
            ['Histórico de decisões juntos', 'clock'],
          ].map(([t, icon]) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 36 }}>
              <Icon name={icon as 'heart'} color={colors.primary} />
              <AppText>{t}</AppText>
            </View>
          ))}
        </AppCard>
        <AppText variant="small" color="textMuted">
          A dupla só começa depois que a outra pessoa aceitar. Dá para desfazer quando quiser. Escolha um amigo:
        </AppText>
        {(friends.data ?? []).map((f, i) => (
          <Pressable
            key={f.user_id}
            accessibilityRole="button"
            accessibilityLabel={`Convidar ${personName(f)} para ser sua dupla`}
            onPress={() =>
              socialRepo()
                .requestPair(f.user_id)
                .then(invalidate)
                .catch((e) => Alert.alert('Não deu', e instanceof Error && e.message.includes('already_paired') ? 'Essa pessoa já tem uma dupla.' : 'Tente de novo.'))
            }
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56 }}
          >
            <Avatar name={personName(f)} index={i} presence={f.presence} />
            <AppText variant="bodyStrong" style={{ flex: 1 }}>
              {personName(f)}
            </AppText>
            <Icon name="chevron" color={colors.text} />
          </Pressable>
        ))}
        {(friends.data ?? []).length === 0 ? <AppButton label="Adicionar amigos" onPress={() => router.push('/amigos/adicionar')} fullWidth /> : null}
      </Screen>
    );
  }

  if (link.status === 'pending') {
    return (
      <Screen scroll={false} edges={['bottom']}>
        <Stack.Screen options={{ title: '' }} />
        <EmptyState
          title={link.i_requested ? `Esperando ${link.partner_name} aceitar` : `${link.partner_name} quer formar dupla`}
          message="A dupla só começa quando os dois aceitam."
          action={
            link.i_requested ? (
              <AppButton label="Cancelar pedido" variant="ghost" onPress={() => socialRepo().unpair().then(invalidate)} />
            ) : (
              <View style={{ gap: spacing.sm }}>
                <AppButton label="Aceitar" onPress={() => socialRepo().respondPair(true).then(invalidate)} />
                <AppButton label="Recusar" variant="ghost" onPress={() => socialRepo().respondPair(false).then(invalidate)} />
              </View>
            )
          }
        />
      </Screen>
    );
  }

  const mine = new Set(myFavs.map((f) => `${f.kind}:${f.id}`));
  const common = [
    ...(partnerFavs.data?.foods ?? []).filter((id) => mine.has(`food:${id}`)).map((id) => ({ kind: 'food', id })),
    ...(partnerFavs.data?.movies ?? []).filter((id) => mine.has(`movie:${id}`)).map((id) => ({ kind: 'movie', id })),
  ];
  const partnerOnly = [
    ...(partnerFavs.data?.foods ?? []).filter((id) => !mine.has(`food:${id}`)).map((id) => ({ kind: 'food', id })),
    ...(partnerFavs.data?.movies ?? []).filter((id) => !mine.has(`movie:${id}`)).map((id) => ({ kind: 'movie', id })),
  ];
  const itemRow = (x: { kind: string; id: string }) => {
    const info = itemInfo(x.kind, x.id);
    return info ? (
      <Pressable key={`${x.kind}:${x.id}`} accessibilityRole="button" onPress={() => router.push(info.href)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <AppText variant="bodyStrong">{info.title}</AppText>
      </Pressable>
    ) : null;
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Sua dupla' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flexDirection: 'row' }}>
          <Avatar name="Eu" index={0} />
          <View style={{ marginLeft: -12 }}>
            <Avatar name={link.partner_name ?? '?'} index={2} />
          </View>
        </View>
        <AppText variant="title2">Você e {link.partner_name}</AppText>
      </View>
      <AppButton label="Decidir agora" onPress={() => router.push({ pathname: '/amigos/convidar', params: { ids: link.partner_id } })} fullWidth />
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title3">Favoritos em comum</AppText>
        {common.length ? common.map(itemRow) : <AppText variant="small" color="textMuted">Nenhum ainda. Favoritem o que gostarem.</AppText>}
      </View>
      {partnerOnly.length ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="title3">Favoritos de {link.partner_name}</AppText>
          {partnerOnly.slice(0, 8).map(itemRow)}
        </View>
      ) : null}
      {recent.length ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="title3">Decisões recentes</AppText>
          {recent.map((e) => (
            <View key={e.id} style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 36, alignItems: 'center' }}>
              <AppText variant="bodyStrong">{e.title}</AppText>
              <AppBadge label={formatDayLabel(e.createdAt)} />
            </View>
          ))}
        </View>
      ) : null}
      <AppButton
        label="Desfazer a dupla"
        variant="ghost"
        onPress={() =>
          Alert.alert('Desfazer a dupla?', 'Vocês deixam de ver os favoritos e as preferências um do outro. Os dados de cada um continuam com cada um.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Desfazer', style: 'destructive', onPress: () => socialRepo().unpair().then(invalidate) },
          ])
        }
        fullWidth
      />
    </Screen>
  );
}
