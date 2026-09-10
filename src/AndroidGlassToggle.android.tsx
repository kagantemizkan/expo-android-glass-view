import { requireNativeView } from 'expo';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import type { AndroidGlassToggleProps } from './AndroidGlassComponents.types';
import { type NativeColor, toNativeColor } from './utils';

type ValueEvent = { nativeEvent: { value: boolean; eventCount: number } };

type NativeAndroidGlassToggleProps = Omit<
  AndroidGlassToggleProps,
  'onValueChange' | 'accentColor' | 'trackColor'
> & {
  /** Count of the last change event handled here (see ControlledProp on the native side). */
  mostRecentEventCount: number;
  onValueChange: (event: ValueEvent) => void;
  accentColor?: NativeColor;
  trackColor?: NativeColor;
};

const NativeAndroidGlassToggle: React.ComponentType<NativeAndroidGlassToggleProps> =
  requireNativeView('ExpoAndroidGlassView', 'AndroidGlassToggle');

export default function AndroidGlassToggle({
  value,
  onValueChange,
  accentColor,
  trackColor,
  style,
  ...rest
}: AndroidGlassToggleProps) {
  // Without a `value` prop, the switch keeps the user's choice.
  const [ownValue, setOwnValue] = React.useState(false);
  // Sent back with `value`, so the native side can tell a stale value (JS still catching up with
  // earlier changes) from a current one.
  const [eventCount, setEventCount] = React.useState(0);
  const checked = value ?? ownValue;
  return (
    <NativeAndroidGlassToggle
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      {...rest}
      style={[styles.toggle, style]}
      value={checked}
      mostRecentEventCount={eventCount}
      accentColor={toNativeColor(accentColor)}
      trackColor={toNativeColor(trackColor)}
      onValueChange={(event) => {
        const { value: next, eventCount: count } = event.nativeEvent;
        setEventCount((current) => Math.max(current, count));
        setOwnValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

const styles = StyleSheet.create({
  // The track is 64 × 28 dp; the thumb grows past it while pressed.
  toggle: {
    width: 64,
    height: 28,
  },
});
