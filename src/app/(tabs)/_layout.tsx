import { Tabs } from 'expo-router';

import { TabIcon, type TabIconName } from '../../components/ui/TabIcon';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFamily } from '../../theme/tokens';

const tabs: { name: string; title: string; icon: TabIconName }[] = [
  { name: 'index', title: 'Início', icon: 'home' },
  { name: 'amigos', title: 'Amigos', icon: 'users' },
  { name: 'historico', title: 'Histórico', icon: 'clock' },
  { name: 'perfil', title: 'Perfil', icon: 'person' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopWidth: 0, elevation: 0 },
        tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 13 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <TabIcon name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
