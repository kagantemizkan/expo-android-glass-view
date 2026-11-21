import { requireNativeView } from 'expo';
import type * as React from 'react';
import { processColor, StyleSheet } from 'react-native';

import type { AndroidGlassSliderProps } from './AndroidGlassView.types';

type ValueEvent = { nativeEvent: { value: number } };

type NativeProps = Omit<
  AndroidGlassSliderProps,
  'onValueChange' | 'onSlidingComplete' | 'accentColor' | 'trackColor'
> & {
  onValueChange: (event: ValueEvent) => void;
  onSlidingComplete: (event: ValueEvent) => void;
  accentColor?: number | null;
  trackColor?: number | null;
};

const NativeAndroidGlassSlider: React.ComponentType<NativeProps> = requireNativeView(
  'ExpoAndroidGlassView',
  'AndroidGlassSlider'
);

function toNative(color: AndroidGlassSliderProps['accentColor']) {
  const value = color == null ? null : processColor(color);
  return typeof value === 'number' ? value : null;
}

/** A glass slider: press anywhere to move the thumb there, then drag. */
export default function AndroidGlassSlider({
  value,
  minimumValue = 0,
  maximumValue = 1,
  onValueChange,
  onSlidingComplete,
  accentColor,
  trackColor,
  style,
  ...rest
}: AndroidGlassSliderProps) {
  return (
    <NativeAndroidGlassSlider
      accessibilityRole="adjustable"
      accessibilityValue={{ min: minimumValue, max: maximumValue, now: value }}
      {...rest}
      style={[styles.slider, style]}
      value={value ?? minimumValue}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      accentColor={toNative(accentColor)}
      trackColor={toNative(trackColor)}
      onValueChange={(event) => onValueChange?.(event.nativeEvent.value)}
      onSlidingComplete={(event) => onSlidingComplete?.(event.nativeEvent.value)}
    />
  );
}

const styles = StyleSheet.create({
  slider: { height: 40, alignSelf: 'stretch' },
});
