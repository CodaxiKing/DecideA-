import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { Switch, View } from 'react-native';

import { AppButton, AppCard, AppText, FilterChip, Screen } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import type { InvitePolicy, SocialSettings } from '../../repositories/socialRepository';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { personName, socialRepo, useInvalidateSocial, useSocial } from './useSocial';

const policies: { v: InvitePolicy; l: string }[] = [
  { v: 'friends', l: 'Amigos' },
  { v: 'online_friends', l: 'Só amigos online' },
  { v: 'nobody', l: 'Ninguém' },
];

export function PrivacyScreen() {
  const { colors } = useTheme();
  const { settings } = useSocial();
  const invalidate = useInvalidateSocial();
  const blocked = useQuery({ queryKey: ['social', 'blocked'], queryFn: () => socialRepo().blocked() });
  const s = settings.data;
  if (!s) return <Screen>{null}</Screen>;

  const save = (patch: Partial<SocialSettings>) => {
    const next = { ...s, ...patch };
    socialRepo()
      .updateSettings({ show_presence: next.show_presence, invite_policy: next.invite_policy, discoverable: next.discoverable, notify_invites: next.notify_invites })
      .then(invalidate)
      .catch(() => {});
  };

  const switchRow = (title: string, text: string, value: boolean, key: 'show_presence' | 'notify_invites') => (
    <AppCard style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="small" color="textMuted">
          {text}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={(v) => save({ [key]: v })}
        trackColor={{ true: colors.primary, false: colors.surfaceStrong }}
        thumbColor="#FFFFFF"
      />
    </AppCard>
  );

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Privacidade' }} />
      {switchRow('Mostrar quando estou online', 'Só seus amigos veem. Desligado, você aparece offline e também não vê os outros.', s.show_presence, 'show_presence')}
      <AppCard>
        <AppText variant="bodyStrong">Quem pode me convidar</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {policies.map((p) => (
            <FilterChip key={p.v} label={p.l} selected={s.invite_policy === p.v} onPress={() => save({ invite_policy: p.v })} />
          ))}
        </View>
      </AppCard>
      <AppCard>
        <AppText variant="bodyStrong">Quem pode me achar pelo usuário</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
          <FilterChip label="Todos" selected={s.discoverable} onPress={() => save({ discoverable: true })} />
          <FilterChip label="Só com meu link" selected={!s.discoverable} onPress={() => save({ discoverable: false })} />
        </View>
      </AppCard>
      {switchRow('Avisos de convite', 'Aviso quando um amigo te chamar', s.notify_invites, 'notify_invites')}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title3">Bloqueados</AppText>
        {(blocked.data ?? []).length === 0 ? (
          <AppText variant="small" color="textMuted">
            Ninguém bloqueado.
          </AppText>
        ) : (
          blocked.data!.map((b, i) => (
            <View key={b.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar name={personName(b)} index={i} />
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {personName(b)}
              </AppText>
              <AppButton
                label="Desbloquear"
                size="sm"
                variant="ghost"
                onPress={() =>
                  socialRepo()
                    .unblock(b.user_id)
                    .then(() => {
                      blocked.refetch();
                      invalidate();
                    })
                }
              />
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}
