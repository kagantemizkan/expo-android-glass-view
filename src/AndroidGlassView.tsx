import * as React from 'react';
import { View } from 'react-native';

import type { AndroidGlassViewProps } from './AndroidGlassView.types';

const DEFAULT_FALLBACK_COLOR = 'rgba(255, 255, 255, 0.7)';

/**
 * iOS and web fallback: the glass effect is Android-only, so render a plain translucent surface
 * with the same shape. Children render as usual.
 */
export default function AndroidGlassView({
  cornerRadius,
  fallbackColor,
  blurRadius: _blurRadius,
  refractionHeight: _refractionHeight,
  refractionAmount: _refractionAmount,
  chromaticAberration: _chromaticAberration,
  depthEffect: _depthEffect,
  vibrancy: _vibrancy,
  highlight: _highlight,
  shadow: _shadow,
  tintColor: _tintColor,
  surfaceColor: _surfaceColor,
  style,
  ...rest
}: AndroidGlassViewProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: fallbackColor ?? DEFAULT_FALLBACK_COLOR,
          borderRadius: cornerRadius ?? 24,
          overflow: 'hidden',
        },
        style,
      ]}
    />
  );
}
