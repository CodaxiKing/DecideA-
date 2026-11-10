import { View } from 'react-native';

import { AppText } from './AppText';

const colors = ['#D3C4FF', '#BFD6FF', '#F3C9EC', '#BFEBE6'];

/** Círculo com a inicial, opcionalmente com o ponto de presença. */
export function Avatar({ name, index = 0, size = 44, presence }: { name: string; index?: number; size?: number; presence?: 'online' | 'busy' | 'offline' }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors[index % colors.length],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText variant="bodyStrong" style={{ color: '#1B1036' }}>
          {name.replace('@', '').charAt(0).toUpperCase()}
        </AppText>
      </View>
      {presence && presence !== 'offline' ? (
        <View
          accessibilityElementsHidden
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: 15,
            height: 15,
            borderRadius: 8,
            borderWidth: 3,
            borderColor: '#FFFFFF',
            backgroundColor: presence === 'online' ? '#13A36E' : '#D9822B',
          }}
        />
      ) : null}
    </View>
  );
}
