import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppCard, AppInput, AppText, FilterChip, IconButton, Screen } from '../../components/ui';
import { useFoodStore } from '../../stores/foodStore';
import { useMovieStore } from '../../stores/movieStore';
import { MAX_PASS_PEOPLE, usePassStore, type PassKind } from '../../stores/passStore';
import { spacing } from '../../theme/tokens';
import { newId } from '../../utils/random';
import { pickFoodOptions, pickMovieOptions } from './options';

const avatarColors = ['#D3C4FF', '#F3C9EC', '#BFD6FF', '#BFEBE6'];

export function PassConfigScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: PassKind; from?: string }>();
  const session = usePassStore((s) => s.session);
  const start = usePassStore((s) => s.start);
  const clear = usePassStore((s) => s.clear);
  const [kind, setKind] = useState<PassKind>(params.kind === 'movie' ? 'movie' : 'food');
  const [people, setPeople] = useState([
    { id: newId(), name: '' },
    { id: newId(), name: '' },
  ]);
  const [showErrors, setShowErrors] = useState(false);

  const names = people.map((p) => p.name.trim());
  const valid = names.filter(Boolean).length === people.length && new Set(names.map((n) => n.toLowerCase())).size === names.length;
  const unfinished = session && session.phase !== 'done' ? session : undefined;

  const begin = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    const optionIds =
      kind === 'food'
        ? pickFoodOptions(useFoodStore.getState().choices, useFoodStore.getState().filters)
        : pickMovieOptions(
            useMovieStore.getState().filters,
            params.from === 'votes'
              ? Object.entries(useMovieStore.getState().votes).filter(([, v]) => v.vote === 'yes').map(([id]) => id)
              : [],
          );
    start(kind, names, optionIds);
    router.replace('/passa/votar');
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: '' }} />
      <AppText variant="title1">Passa o celular</AppText>
      <AppText color="textMuted">Votem aqui mesmo, um de cada vez. Sem conta e sem internet.</AppText>

      {unfinished ? (
        <AppCard>
          <AppText variant="bodyStrong">Tem uma votação no meio</AppText>
          <AppText variant="small" color="textMuted">
            {unfinished.people.join(', ')} · vez de {unfinished.people[unfinished.current]}
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <AppButton
              label="Continuar"
              size="sm"
              onPress={() => router.replace(unfinished.phase === 'handoff' ? '/passa/troca' : '/passa/votar')}
            />
            <AppButton label="Descartar" size="sm" variant="ghost" onPress={clear} />
          </View>
        </AppCard>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">Quem vai votar?</AppText>
        {people.map((p, i) => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: avatarColors[i % avatarColors.length], alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="bodyStrong" style={{ color: '#1B1036' }}>
                {(p.name.trim()[0] ?? String(i + 1)).toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                compact
                value={p.name}
                placeholder={`Pessoa ${i + 1}`}
                accessibilityLabel={`Nome da pessoa ${i + 1}`}
                maxLength={20}
                onChangeText={(name) => setPeople((list) => list.map((x) => (x.id === p.id ? { ...x, name } : x)))}
                error={showErrors && !p.name.trim() ? ' ' : undefined}
              />
            </View>
            {people.length > 2 ? (
              <IconButton icon="trash" plain label={`Remover ${p.name || `pessoa ${i + 1}`}`} onPress={() => setPeople((l) => l.filter((x) => x.id !== p.id))} />
            ) : null}
          </View>
        ))}
        {showErrors && !valid ? (
          <AppText variant="small" color="danger">
            Preencha um nome diferente para cada pessoa.
          </AppText>
        ) : null}
        <AppButton
          label="Adicionar pessoa"
          variant="ghost"
          size="sm"
          fullWidth
          disabled={people.length >= MAX_PASS_PEOPLE}
          onPress={() => setPeople((l) => [...l, { id: newId(), name: '' }])}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">O que vão decidir?</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
          <FilterChip label="Comida" selected={kind === 'food'} onPress={() => setKind('food')} />
          <FilterChip label="Filme" selected={kind === 'movie'} onPress={() => setKind('movie')} />
        </View>
        <AppText variant="small" color="textMuted">
          Cada pessoa vota nas mesmas 8 opções. Os votos ficam escondidos até o fim.
        </AppText>
      </View>

      <AppButton label={names[0] ? `${names[0]} começa` : 'Começar'} onPress={begin} fullWidth />
    </Screen>
  );
}
