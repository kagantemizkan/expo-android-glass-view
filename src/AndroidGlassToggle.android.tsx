import { requireNativeView } from 'expo';
import * as React from 'react';
import { processColor, StyleSheet } from 'react-native';

import type { AndroidGlassToggleProps } from './AndroidGlassView.types';

type NativeProps = Omit<AndroidGlassToggleProps, 'onValueChange' | 'accentColor' | 'trackColor'> & {
  onValueChange: (event: { nativeEvent: { value: boolean } }) => void;
  accentColor?: number | null;
  trackColor?: number | null;
};

const NativeAndroidGlassToggle: React.ComponentType<NativeProps> = requireNativeView(
  'ExpoAndroidGlassView',
  'AndroidGlassToggle'
);

function toNative(color: AndroidGlassToggleProps['accentColor']) {
  const value = color == null ? null : processColor(color);
  return typeof value === 'number' ? value : null;
}

/** A glass switch: tap to flip, or drag the thumb. Without `value`, it keeps its own state. */
export default function AndroidGlassToggle({
  value,
  onValueChange,
  accentColor,
  trackColor,
  style,
  ...rest
}: AndroidGlassToggleProps) {
  const [own, setOwn] = React.useState(false);
  const checked = value ?? own;
  return (
    <NativeAndroidGlassToggle
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      {...rest}
      style={[styles.toggle, style]}
      value={checked}
      accentColor={toNative(accentColor)}
      trackColor={toNative(trackColor)}
      onValueChange={(event) => {
        setOwn(event.nativeEvent.value);
        onValueChange?.(event.nativeEvent.value);
      }}
    />
  );
}

const styles = StyleSheet.create({
  // The 64×28dp track, with room for the thumb to swell.
  toggle: { width: 64, height: 28 },
});
