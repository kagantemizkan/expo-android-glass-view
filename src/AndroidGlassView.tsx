import { Pressable, View } from 'react-native';

import type { AndroidGlassViewProps } from './AndroidGlassView.types';

// iOS and web: a plain view with the same API, coloured with the tint (or the fallback colour).
export default function AndroidGlassView({
  cornerRadius,
  tintColor,
  fallbackColor,
  theme,
  interactive,
  onPress,
  style,
  ...rest
}: AndroidGlassViewProps) {
  const surface = {
    borderRadius: cornerRadius,
    backgroundColor:
      tintColor ??
      fallbackColor ??
      (theme === 'dark' ? 'rgba(28,28,30,0.8)' : 'rgba(242,242,247,0.8)'),
  };
  if (interactive) {
    return <Pressable {...rest} onPress={onPress} style={[surface, style]} />;
  }
  return <View {...rest} style={[surface, style]} />;
}
