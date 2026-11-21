import { View } from 'react-native';

import type { GlassBackdropSourceProps } from './AndroidGlassView.types';

// iOS and web: a plain container.
export default function GlassBackdropSource({ name: _name, ...rest }: GlassBackdropSourceProps) {
  return <View {...rest} />;
}
