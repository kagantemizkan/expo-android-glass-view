import { requireNativeView } from 'expo';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import type { AndroidGlassViewProps } from './AndroidGlassView.types';
import { type NativeColor, toNativeColor } from './utils';

type NativeAndroidGlassViewProps = Omit<
  AndroidGlassViewProps,
  'tintColor' | 'surfaceColor' | 'fallbackColor'
> & {
  tintColor?: NativeColor;
  surfaceColor?: NativeColor;
  fallbackColor?: NativeColor;
};

const NativeAndroidGlassView: React.ComponentType<NativeAndroidGlassViewProps> = requireNativeView(
  'ExpoAndroidGlassView',
  'AndroidGlassView'
);

export default function AndroidGlassView({
  cornerRadius,
  tintColor,
  surfaceColor,
  fallbackColor,
  style,
  ...rest
}: AndroidGlassViewProps) {
  const borderRadius = StyleSheet.flatten(style)?.borderRadius;
  return (
    <NativeAndroidGlassView
      {...rest}
      style={style}
      cornerRadius={cornerRadius ?? (typeof borderRadius === 'number' ? borderRadius : undefined)}
      tintColor={toNativeColor(tintColor)}
      surfaceColor={toNativeColor(surfaceColor)}
      fallbackColor={toNativeColor(fallbackColor)}
    />
  );
}
