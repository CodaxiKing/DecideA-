import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { AppButton, AppInput, AppText, EmptyState, Screen } from '../../components/ui';
import { authErrorMessage, completePasswordReset } from '../../services/auth';
import { spacing } from '../../theme/tokens';

/** Aberta pelo link de recuperação do e-mail (decideai://conta/nova-senha?code=...). */
export function NewPasswordScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (!code) {
    return (
      <Screen scroll={false} edges={[]}>
        <Stack.Screen options={{ title: 'Nova senha' }} />
        <EmptyState title="Link inválido" message="Peça um novo link em Perfil, Entrar, Esqueci a senha." />
      </Screen>
    );
  }

  const save = async () => {
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await completePasswordReset(code, password);
      router.replace('/perfil');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Nova senha' }} />
      <AppText variant="title1">Crie uma nova senha</AppText>
      <AppInput label="Nova senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="Pelo menos 8 caracteres" />
      {error ? (
        <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
      <AppButton label={busy ? 'Salvando…' : 'Salvar senha'} onPress={save} disabled={busy} fullWidth />
    </Screen>
  );
}
