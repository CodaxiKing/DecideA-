import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppButton, AppCard, AppText, BrandMark, DecisionTile, Screen, WheelArt } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { DidItWorkCard } from '../preferences/DidItWorkCard';

export function HomeScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
        <BrandMark size={28} />
        <AppText variant="title3">DecideAí</AppText>
      </View>
      <AppText variant="title1">O que vamos decidir agora?</AppText>
      <DidItWorkCard />
      <View accessibilityLabel="Ferramentas" style={{ gap: spacing.sm }}>
        <DecisionTile
          tone="primary"
          title="O Que Comer?"
          subtitle="Sorteio ou seus ingredientes"
          image={require('../../../assets/images/mesa.jpg')}
          onPress={() => router.push('/comer')}
        />
        <DecisionTile
          tone="blue"
          title="Qual Filme?"
          subtitle="Vote e descubra títulos"
          image={require('../../../assets/images/cinema.jpg')}
          onPress={() => router.push('/filmes')}
        />
        <DecisionTile
          tone="lilac"
          title="Roleta"
          subtitle="Crie e gire a sua"
          art={<WheelArt size={172} />}
          onPress={() => router.push('/roleta')}
        />
      </View>
      <AppCard style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <AppText variant="bodyStrong" style={{ flex: 1 }}>
            Decidir em grupo
          </AppText>
          <AppButton label="Criar sala" size="sm" onPress={() => router.push('/sala/criar')} />
        </View>
        <AppButton label="Tenho um código de sala" variant="ghost" size="sm" onPress={() => router.push('/sala/entrar')} />
        <AppButton label="Estão juntos? Votem neste celular" variant="ghost" size="sm" onPress={() => router.push('/passa')} />
      </AppCard>
    </Screen>
  );
}
