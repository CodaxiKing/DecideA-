import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppButton, AppCard, AppInput, AppText, Screen } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import type { PersonRef } from '../../repositories/socialRepository';
import { spacing } from '../../theme/tokens';
import { roomErrorMessage } from '../rooms/types';
import { personName, socialRepo, useInvalidateSocial, useSocial } from './useSocial';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/+$/, '');
export const friendInviteLink = (token: string) => (WEB_URL ? `${WEB_URL}/amigos/convite/${token}` : Linking.createURL(`/amigos/convite/${token}`));

export function AddFriendScreen() {
  const { settings, requests } = useSocial();
  const invalidate = useInvalidateSocial();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<PersonRef | null | undefined>();
  const [message, setMessage] = useState<string>();
  const invite = useQuery({ queryKey: ['social', 'friendInvite'], queryFn: () => socialRepo().createFriendInvite(), staleTime: Infinity });
  const decided = useQuery({ queryKey: ['social', 'decidedWithMe'], queryFn: () => socialRepo().decidedWithMe() });
  const link = invite.data ? friendInviteLink(invite.data) : undefined;

  const search = async () => {
    setMessage(undefined);
    setFound(await socialRepo().findUser(query.trim().toLowerCase()));
  };

  const add = async (p: PersonRef) => {
    try {
      const r = await socialRepo().sendRequest(p.user_id);
      setMessage(
        r === 'accepted' ? `Agora você e ${personName(p)} são amigos.` : r === 'already_friends' ? 'Vocês já são amigos.' : `Pedido enviado para ${personName(p)}.`,
      );
      invalidate();
    } catch (e) {
      Alert.alert('Não deu para adicionar', roomErrorMessage(e));
    }
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Adicionar amigos' }} />
      <View style={{ gap: spacing.sm }}>
        <AppInput label="Nome de usuário" placeholder="@usuario" value={query} onChangeText={setQuery} autoCapitalize="none" onSubmitEditing={search} returnKeyType="search" />
        <AppButton label="Procurar" size="sm" onPress={search} disabled={query.trim().length < 3} />
        {found === null ? (
          <AppText variant="small" color="textMuted">
            Ninguém com esse usuário. Confira a grafia ou mande seu link.
          </AppText>
        ) : found ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar name={personName(found)} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{personName(found)}</AppText>
              <AppText variant="small" color="textMuted">
                @{found.username}
              </AppText>
            </View>
            <AppButton label="Adicionar" size="sm" onPress={() => add(found)} />
          </View>
        ) : null}
        {message ? (
          <AppText variant="small" accessibilityLiveRegion="polite">
            {message}
          </AppText>
        ) : null}
      </View>

      <AppCard style={{ alignItems: 'center' }}>
        <AppText variant="small" color="textMuted">
          Seu usuário
        </AppText>
        <AppText variant="title3">{settings.data?.username ? `@${settings.data.username}` : 'Escolha um na aba Amigos'}</AppText>
        {link ? (
          <View accessible accessibilityLabel="QR Code para me adicionar" style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 16 }}>
            <QRCode value={link} size={150} color="#1B1036" backgroundColor="#FFFFFF" />
          </View>
        ) : null}
        <AppButton
          label="Enviar meu link"
          size="sm"
          variant="ghost"
          disabled={!link}
          onPress={() => link && Share.share({ message: `Me adiciona no DecideAí para a gente decidir junto: ${link}` }).catch(() => {})}
        />
        <AppText variant="small" color="textMuted" style={{ textAlign: 'center' }}>
          Quem abrir o link ou ler o QR Code vira seu amigo na hora. O link vale 7 dias.
        </AppText>
      </AppCard>

      {(requests.data ?? []).length ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="title3">Pedidos de amizade</AppText>
          {requests.data!.map((r, i) => (
            <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar name={personName(r)} index={i} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{personName(r)}</AppText>
                <AppText variant="small" color="textMuted">
                  @{r.username}
                </AppText>
              </View>
              <AppButton label="Aceitar" size="sm" onPress={() => socialRepo().respondRequest(r.id, true).then(invalidate)} />
              <AppButton label="Recusar" size="sm" variant="ghost" onPress={() => socialRepo().respondRequest(r.id, false).then(invalidate)} />
            </View>
          ))}
        </View>
      ) : null}

      {(decided.data ?? []).length ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="title3">Decidiram com você</AppText>
          {decided.data!.map((p, i) => (
            <View key={p.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar name={personName(p)} index={i + 1} />
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {personName(p)}
              </AppText>
              <AppButton label="Adicionar" size="sm" variant="ghost" onPress={() => add(p)} />
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
