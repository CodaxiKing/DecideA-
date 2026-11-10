import { render, screen, userEvent } from '@testing-library/react-native';

import { DecisionTile } from '../src/components/ui/DecisionTile';
import { ProfileScreen } from '../src/features/preferences/ProfileScreen';
import { usePreferencesStore } from '../src/stores/preferencesStore';
import { ThemeProvider } from '../src/theme/ThemeProvider';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

describe('DecisionTile', () => {
  it('é um botão acessível que dispara a navegação', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <DecisionTile tone="primary" title="O Que Comer?" subtitle="Sorteio ou seus ingredientes" onPress={onPress} />
      </ThemeProvider>,
    );
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'O Que Comer? Sorteio ou seus ingredientes' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ProfileScreen', () => {
  beforeEach(() => usePreferencesStore.setState({ themePreference: 'system' }));

  it('troca e guarda a preferência de tema', async () => {
    await render(
      <ThemeProvider>
        <ProfileScreen />
      </ThemeProvider>,
    );
    expect(screen.getByRole('radio', { name: 'Do sistema' })).toBeChecked();

    const user = userEvent.setup();
    await user.press(screen.getByRole('radio', { name: 'Escuro' }));

    expect(usePreferencesStore.getState().themePreference).toBe('dark');
    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeChecked();
  });
});
