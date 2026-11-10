import { useRouter } from 'expo-router';

import { AppBadge, AppButton, EmptyState, Screen } from '../../components/ui';

export interface ComingSoonScreenProps {
  title: string;
  message: string;
  phase: number;
  showBack?: boolean;
}

/**
 * Estado vazio honesto para seções que ainda não foram construídas.
 * Diz em que fase do plano a função chega, sem simular a funcionalidade.
 */
export function ComingSoonScreen({ title, message, phase, showBack = true }: ComingSoonScreenProps) {
  const router = useRouter();
  return (
    <Screen scroll={false} edges={showBack ? [] : ['top']}>
      <EmptyState
        illustration={<AppBadge label={`Chega na Fase ${phase}`} />}
        title={title}
        message={message}
        action={
          showBack ? <AppButton label="Voltar ao início" variant="ghost" onPress={() => router.back()} /> : null
        }
      />
    </Screen>
  );
}
