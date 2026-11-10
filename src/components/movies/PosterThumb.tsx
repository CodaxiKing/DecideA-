import { Image, View } from 'react-native';

import type { MovieTitle } from '../../features/movies/types';
import { AppText } from '../ui/AppText';

/** Miniatura do pôster; sem imagem licenciada, mostra a inicial sobre a cor do título. */
export function PosterThumb({ title, width = 64, height = 88 }: { title: MovieTitle; width?: number; height?: number }) {
  return (
    <View style={{ width, height, borderRadius: 14, overflow: 'hidden', backgroundColor: title.posterColor, alignItems: 'center', justifyContent: 'center' }}>
      {title.image ? (
        <Image source={title.image} style={{ width, height }} resizeMode="cover" />
      ) : (
        <AppText variant="title2" style={{ color: '#FFFFFF' }}>
          {title.title[0]}
        </AppText>
      )}
    </View>
  );
}
