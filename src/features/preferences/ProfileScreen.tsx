import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppButton, AppCard, AppInput, AppText, FilterChip, Screen } from '../../components/ui';
import { deleteAccount, signOut, useAuth } from '../../services/auth';
import { isBackendConfigured, supabase } from '../../services/supabase';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useMovieStore } from '../../stores/movieStore';
import { usePassStore } from '../../stores/passStore';
import { usePreferencesStore, type ThemePreference } from '../../stores/preferencesStore';
import { useProfileStore } from '../../stores/profileStore';
import { useWheelStore } from '../../stores/wheelStore';
import { spacing } from '../../theme/tokens';
import { formatDayLabel, formatTime } from '../../utils/dates';
import { syncRepository } from '../../repositories/syncRepository';
import { runSync, useSyncStatus } from '../sync/SyncManager';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Do sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

function clearLocalData() {
  useWheelStore.setState({ wheels: [], deletedIds: [] });
  useFavoritesStore.setState({ items: [], removed: [] });
  useHistoryStore.setState({ entries: [] });
  useMovieStore.setState({ votes: {} });
  usePassStore.setState({ session: undefined });
  useProfileStore.setState({ displayName: '' });
}

export function ProfileScreen() {
  const router = useRouter();
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);
  const displayName = useProfileStore((s) => s.displayName);
  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const { user, registered } = useAuth();
  const sync = useSyncStatus();
  const [name, setName] = useState(displayName);

  const saveName = () => {
    setDisplayName(name.trim());
    if (registered && supabase && user) syncRepository(supabase, user.id).setDisplayName(name.trim()).catch(() => {});
  };

  const confirmSignOut = () =>
    Alert.alert('Sair da conta?', 'Seus dados continuam neste aparelho e na conta.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', onPress: () => signOut().catch(() => {}) },
    ]);

  const confirmDeleteAccount = () =>
    Alert.alert(
      'Excluir conta?',
      'Isso apaga para sempre sua conta e tudo guardado nela: roletas, favoritos, histórico e participação em salas. Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          onPress: () =>
            deleteAccount()
              .then(() => Alert.alert('Conta excluída', 'Os dados da conta foram apagados. O que está neste aparelho continua aqui até você apagar.'))
              .catch(() => Alert.alert('Não deu para excluir', 'Confira a internet e tente de novo.')),
        },
      ],
    );

  const confirmClearLocal = () =>
    Alert.alert('Apagar dados deste aparelho?', 'Roletas, favoritos, histórico e votos guardados aqui serão apagados. A conta, se houver, não muda.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: clearLocalData },
    ]);

  const syncText =
    sync.state === 'syncing'
      ? 'Sincronizando…'
      : sync.state === 'error'
        ? 'A última sincronização falhou. Tentamos de novo sozinhos.'
        : sync.lastSyncedAt
          ? `Sincronizado ${formatDayLabel(sync.lastSyncedAt).toLowerCase()}, às ${formatTime(sync.lastSyncedAt)}.`
          : 'Ainda não sincronizado.';

  return (
    <Screen>
      <AppText variant="title1">Perfil</AppText>

      <AppCard>
        <AppText variant="bodyStrong">Conta</AppText>
        {registered ? (
          <>
            <AppText>{user?.email}</AppText>
            <AppText variant="small" color="textMuted" accessibilityLiveRegion="polite">
              {syncText}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <AppButton label="Sincronizar agora" size="sm" onPress={() => user && runSync(user.id)} disabled={sync.state === 'syncing'} />
              <AppButton label="Sair" size="sm" variant="ghost" onPress={confirmSignOut} />
            </View>
          </>
        ) : (
          <>
            <AppText variant="small" color="textMuted">
              {isBackendConfigured
                ? 'Você usa o DecideAí sem conta. Entre para guardar roletas, favoritos e histórico e usar em outro aparelho.'
                : 'Você usa o DecideAí sem conta. Contas precisam do servidor, que não está configurado nesta versão.'}
            </AppText>
            {isBackendConfigured ? <AppButton label="Entrar ou criar conta" size="sm" onPress={() => router.push('/conta/entrar')} /> : null}
          </>
        )}
      </AppCard>

      <AppCard>
        <AppInput label="Seu nome nas salas" value={name} onChangeText={setName} onBlur={saveName} onSubmitEditing={saveName} maxLength={20} placeholder="Ex.: Ana" />
      </AppCard>

      <AppCard>
        <AppText variant="bodyStrong">Aparência</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {themeOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={themePreference === option.value}
              onPress={() => setThemePreference(option.value)}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="bodyStrong">Privacidade</AppText>
        <AppButton label="Apagar dados deste aparelho" size="sm" variant="ghost" onPress={confirmClearLocal} />
        {registered ? <AppButton label="Excluir conta" size="sm" variant="danger" onPress={confirmDeleteAccount} /> : null}
      </AppCard>
    </Screen>
  );
}
