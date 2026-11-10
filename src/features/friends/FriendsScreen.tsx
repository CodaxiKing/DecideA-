import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, View } from 'react-native';

import { AppBadge, AppButton, AppCard, AppInput, AppText, EmptyState, FilterChip, Icon, Screen } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import type { Friend } from '../../repositories/socialRepository';
import { isBackendConfigured } from '../../services/supabase';
import { useProfileStore } from '../../stores/profileStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { itemKindLabels } from '../catalog/items';
import { usePremium } from '../premium/usePremium';
import { roomErrorMessage } from '../rooms/types';
import { lastSeenLabel, personName, socialRepo, useInvalidateSocial, useSocial } from './useSocial';

const modeLabels: Record<string, string> = {
  battle: 'uma batalha',
  match: 'um Match',
  ranking: 'um ranking',
  wheel: 'uma roleta ao vivo',
  vote: 'uma votação',
};

function UsernameSetup() {
  const invalidate = useInvalidateSocial();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  const save = async () => {
    try {
      await socialRepo().setUsername(value.trim().toLowerCase().replace(/^@/, ''));
      invalidate();
    } catch (e) {
      setError(roomErrorMessage(e));
    }
  };
  return (
    <AppCard>
      <AppText variant="bodyStrong">Escolha seu nome de usuário</AppText>
      <AppText variant="small" color="textMuted">
        É como seus amigos te acham. Letras minúsculas, números, ponto ou _.
      </AppText>
      <AppInput onSurface accessibilityLabel="Nome de usuário" value={value} onChangeText={setValue} placeholder="ex.: ana.decide" autoCapitalize="none" maxLength={20} error={error} />
      <AppButton label="Salvar" size="sm" onPress={save} disabled={value.trim().length < 3} />
    </AppCard>
  );
}

export function FriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isPremium } = usePremium();
  const { registered, settings, friends, requests, roomInvites, groups, pair } = useSocial();
  const invalidate = useInvalidateSocial();
  const displayName = useProfileStore((s) => s.displayName);
  const [tab, setTab] = useState<'friends' | 'groups'>('friends');

  if (!isBackendConfigured || !registered) {
    return (
      <Screen scroll={false}>
        <EmptyState
          title="Amigos precisam de conta"
          message={isBackendConfigured ? 'Crie uma conta para adicionar amigos, ver quem está online e chamar para decidir.' : 'Amigos precisam do servidor, que não está configurado nesta versão.'}
          action={isBackendConfigured ? <AppButton label="Entrar ou criar conta" onPress={() => router.push('/conta/entrar')} /> : undefined}
        />
      </Screen>
    );
  }

  const list = friends.data ?? [];
  const online = list.filter((f) => f.presence !== 'offline');
  const offline = list.filter((f) => f.presence === 'offline');

  const friendActions = (f: Friend) => {
    const name = personName(f);
    const options: { text: string; onPress: () => void; style?: 'destructive' | 'cancel' }[] = [
      { text: 'Chamar para decidir', onPress: () => router.push({ pathname: '/amigos/convidar', params: { ids: f.user_id } }) },
      ...(pair.data ? [] : [{ text: 'Fazer dupla', onPress: () => socialRepo().requestPair(f.user_id).then(invalidate).catch((e) => Alert.alert('Não deu', roomErrorMessage(e))) }]),
      {
        text: 'Remover amizade',
        style: 'destructive',
        onPress: () => socialRepo().removeFriend(f.user_id).then(invalidate),
      },
      {
        text: 'Bloquear',
        style: 'destructive',
        onPress: () =>
          Alert.alert(`Bloquear ${name}?`, 'A pessoa não poderá te achar, pedir amizade nem te convidar. Ela não é avisada.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Bloquear', style: 'destructive', onPress: () => socialRepo().block(f.user_id).then(invalidate) },
          ]),
      },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: [...options.map((o) => o.text), 'Cancelar'], cancelButtonIndex: options.length, title: name }, (i) => options[i]?.onPress());
    } else {
      Alert.alert(name, undefined, [...options.slice(0, 2), { text: 'Mais…', onPress: () => Alert.alert(name, undefined, [...options.slice(2), { text: 'Cancelar', style: 'cancel' }]) }]);
    }
  };

  const row = (f: Friend, i: number) => (
    <View key={f.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${personName(f)}, opções`} onPress={() => friendActions(f)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        <Avatar name={personName(f)} index={i} presence={f.presence} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{personName(f)}</AppText>
          <AppText variant="small" color="textMuted">
            {f.presence === 'online' ? 'Online' : f.presence === 'busy' ? 'Decidindo agora · ocupado' : lastSeenLabel(f.last_seen_at)}
          </AppText>
        </View>
      </Pressable>
      <AppButton
        label={f.presence === 'offline' ? 'Chamar' : 'Convidar'}
        size="sm"
        variant={f.presence === 'online' ? 'primary' : 'ghost'}
        onPress={() => router.push({ pathname: '/amigos/convidar', params: { ids: f.user_id } })}
      />
    </View>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="title1">Amigos</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Privacidade" onPress={() => router.push('/amigos/privacidade')} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
            <Icon name="filter" color={colors.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Adicionar amigos" onPress={() => router.push('/amigos/adicionar')} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
            <Icon name="plus" color={colors.text} />
          </Pressable>
        </View>
      </View>

      {settings.data && !settings.data.username ? <UsernameSetup /> : null}

      {(roomInvites.data ?? []).map((inv) => (
        <AppCard key={inv.id} style={{ backgroundColor: colors.primary }}>
          <AppText variant="title3" color="onPrimary">
            {inv.from_name} te chamou para {modeLabels[inv.decision_mode] ?? 'decidir'}
          </AppText>
          <AppText variant="small" color="onPrimary">
            {itemKindLabels[inv.item_type as 'food'] ?? 'Decisão'} · com {inv.participants.join(', ')} · expira às{' '}
            {new Date(inv.expires_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <AppButton
              label="Entrar"
              size="sm"
              variant="ghost"
              onPress={async () => {
                try {
                  const roomId = await socialRepo().respondRoomInvite(inv.id, true, displayName || undefined);
                  invalidate();
                  if (roomId) router.push({ pathname: '/sala/[id]', params: { id: roomId } });
                } catch (e) {
                  Alert.alert('Não deu para entrar', roomErrorMessage(e));
                }
              }}
            />
            <AppButton label="Agora não" size="sm" variant="ghost" onPress={() => socialRepo().respondRoomInvite(inv.id, false).then(invalidate)} />
          </View>
        </AppCard>
      ))}

      {pair.data && pair.data.status === 'pending' && !pair.data.i_requested ? (
        <AppCard>
          <AppText variant="bodyStrong">{pair.data.partner_name} quer formar dupla com você</AppText>
          <AppText variant="small" color="textMuted">
            Vocês passam a ver os favoritos e as preferências um do outro. Dá para desfazer quando quiser.
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <AppButton label="Aceitar" size="sm" onPress={() => socialRepo().respondPair(true).then(invalidate)} />
            <AppButton label="Recusar" size="sm" variant="ghost" onPress={() => socialRepo().respondPair(false).then(invalidate)} />
          </View>
        </AppCard>
      ) : null}

      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
        <FilterChip label="Amigos" selected={tab === 'friends'} onPress={() => setTab('friends')} />
        <FilterChip label="Grupos" selected={tab === 'groups'} onPress={() => setTab('groups')} />
        <FilterChip label="Dupla" selected={false} onPress={() => router.push('/dupla')} />
      </View>

      {tab === 'friends' ? (
        <>
          {(requests.data ?? []).length ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/amigos/adicionar')}>
              <AppCard style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText variant="bodyStrong">
                  {requests.data!.length} {requests.data!.length === 1 ? 'pedido de amizade' : 'pedidos de amizade'}
                </AppText>
                <Icon name="chevron" color={colors.text} />
              </AppCard>
            </Pressable>
          ) : null}
          {list.length === 0 ? (
            <View style={{ minHeight: 260 }}>
              <EmptyState
                title="Nenhum amigo ainda"
                message="Adicione pelo nome de usuário, por link ou QR Code."
                action={<AppButton label="Adicionar amigos" onPress={() => router.push('/amigos/adicionar')} />}
              />
            </View>
          ) : (
            <>
              {online.length ? (
                <View style={{ gap: spacing.xs }}>
                  <AppText variant="smallStrong" color="textMuted" accessibilityRole="header">
                    Online agora · {online.length}
                  </AppText>
                  {online.map(row)}
                </View>
              ) : null}
              {offline.length ? (
                <View style={{ gap: spacing.xs }}>
                  <AppText variant="smallStrong" color="textMuted" accessibilityRole="header">
                    Offline · {offline.length}
                  </AppText>
                  {offline.map((f, i) => row(f, i + online.length))}
                </View>
              ) : null}
            </>
          )}
        </>
      ) : (
        <>
          {!isPremium ? (
            <AppCard>
              <AppBadge label="Premium" tone="strong" />
              <AppText variant="small">Grupos permanentes são do Premium. Você ainda participa dos grupos em que te colocarem.</AppText>
            </AppCard>
          ) : null}
          {(groups.data ?? []).map((g) => (
            <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`${g.name}, ${g.members.length} pessoas`} onPress={() => router.push({ pathname: '/amigos/grupos/[id]', params: { id: g.id } })}>
              <AppCard style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flexDirection: 'row' }}>
                  {g.members.slice(0, 3).map((m, i) => (
                    <View key={m.user_id} style={{ marginLeft: i ? -12 : 0 }}>
                      <Avatar name={m.name ?? '?'} index={i} size={36} />
                    </View>
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{g.name}</AppText>
                  <AppText variant="small" color="textMuted">
                    {g.members.length} pessoas
                  </AppText>
                </View>
              </AppCard>
            </Pressable>
          ))}
          <AppButton label="Criar grupo" onPress={() => router.push('/amigos/grupos/novo')} disabled={!isPremium} fullWidth />
        </>
      )}
    </Screen>
  );
}
