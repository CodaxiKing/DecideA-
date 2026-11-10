import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton, AppInput, AppText, FilterChip, Screen } from '../../components/ui';
import { authErrorMessage, requestPasswordReset, signIn, signUp, validateCredentials } from '../../services/auth';
import { isBackendConfigured } from '../../services/supabase';
import { spacing } from '../../theme/tokens';
import { BackendNotice } from '../rooms/BackendNotice';

type Mode = 'signin' | 'signup' | 'reset';

export function SignInScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();

  // Aberta por link não tem tela anterior: volta ao Perfil.
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  const submit = async () => {
    setError(undefined);
    setInfo(undefined);
    if (mode === 'reset') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Digite um e-mail válido.');
        return;
      }
    } else {
      const invalid = validateCredentials(email, password);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        leave();
      } else if (mode === 'signup') {
        await signUp(email, password);
        leave();
      } else {
        await requestPasswordReset(email);
        setInfo('Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha.');
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha';

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: spacing.lg }}>
      <Stack.Screen options={{ title }} />
      <AppText variant="title1">{title}</AppText>
      <AppText color="textMuted">
        A conta é opcional. Ela guarda suas roletas, favoritos e histórico para usar em outro aparelho.
      </AppText>
      {!isBackendConfigured ? (
        <BackendNotice />
      ) : (
        <>
          {mode !== 'reset' ? (
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
              <FilterChip label="Já tenho conta" selected={mode === 'signin'} onPress={() => setMode('signin')} />
              <FilterChip label="Criar conta" selected={mode === 'signup'} onPress={() => setMode('signup')} />
            </View>
          ) : null}
          <AppInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          {mode !== 'reset' ? (
            <AppInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              placeholder={mode === 'signup' ? 'Pelo menos 8 caracteres' : undefined}
            />
          ) : null}
          {error ? (
            <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          {info ? (
            <AppText variant="small" accessibilityLiveRegion="polite">
              {info}
            </AppText>
          ) : null}
          <AppButton
            label={busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
            onPress={submit}
            disabled={busy}
            fullWidth
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode(mode === 'reset' ? 'signin' : 'reset')}
            style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'center' }}
          >
            <AppText variant="bodyStrong" style={{ textDecorationLine: 'underline' }}>
              {mode === 'reset' ? 'Voltar para entrar' : 'Esqueci a senha'}
            </AppText>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
