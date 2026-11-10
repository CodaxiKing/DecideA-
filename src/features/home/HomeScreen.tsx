import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppButton, AppText, BrandMark, DecisionTile, Screen, WheelArt } from '../../components/ui';
import { spacing } from '../../theme/tokens';

export function HomeScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
        <BrandMark size={28} />
        <AppText variant="title3">DecideAí</AppText>
      </View>
      <AppText variant="title1">O que vamos decidir agora?</AppText>
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
      <AppButton label="Estão juntos? Votem neste celular" variant="ghost" onPress={() => router.push('/passa')} fullWidth />
    </Screen>
  );
}
