import { router } from 'expo-router';
import { Alert } from 'react-native';

/** Aviso de limite do plano grátis, com caminho para o Premium. */
export function showLimitAlert(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Agora não', style: 'cancel' },
    { text: 'Ver Premium', onPress: () => router.push('/premium') },
  ]);
}

export const limitMessages = {
  wheels: (limit: number) => ({
    title: `Suas ${limit} roletas já estão salvas`,
    message: 'Apague uma para criar outra, ou libere roletas ilimitadas com o Premium.',
  }),
  favorites: (limit: number) => ({
    title: `Você já tem ${limit} favoritos`,
    message: 'Remova um para salvar outro, ou libere favoritos ilimitados com o Premium.',
  }),
};
