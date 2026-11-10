import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold } from '@expo-google-fonts/figtree';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PremiumManager } from '../features/premium/usePremium';
import { SyncManager } from '../features/sync/SyncManager';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { fontFamily } from '../theme/tokens';

export { AppErrorBoundary as ErrorBoundary } from '../features/home/AppErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

function RootStack() {
  const { scheme, colors } = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SyncManager />
      <PremiumManager />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fontFamily.bodySemiBold },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="comer/filtros" options={{ presentation: 'modal' }} />
        <Stack.Screen name="filmes/filtros" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootStack />
        </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
