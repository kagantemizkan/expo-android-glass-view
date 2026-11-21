import type * as React from 'react';
import { processColor } from 'react-native';

import type { AndroidGlassViewProps } from './AndroidGlassView.types';
import NativeView from './NativeAndroidGlassView';

type NativeProps = Omit<AndroidGlassViewProps, 'tintColor' | 'fallbackColor'> & {
  tintColor?: number | null;
  fallbackColor?: number | null;
};

const NativeAndroidGlassView = NativeView as React.ComponentType<NativeProps>;

function toNative(color: AndroidGlassViewProps['tintColor']) {
  const value = color == null ? null : processColor(color);
  return typeof value === 'number' ? value : null;
}

/** Liquid glass over whatever is behind it. */
export default function AndroidGlassView({
  tintColor,
  fallbackColor,
  ...rest
}: AndroidGlassViewProps) {
  return (
    <NativeAndroidGlassView
      {...rest}
      tintColor={toNative(tintColor)}
      fallbackColor={toNative(fallbackColor)}
    />
  );
}
