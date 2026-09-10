import { requireNativeView } from 'expo';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import type { AndroidGlassSliderProps } from './AndroidGlassComponents.types';
import { type NativeColor, toNativeColor } from './utils';

type ValueEvent = { nativeEvent: { value: number; eventCount: number } };

type NativeAndroidGlassSliderProps = Omit<
  AndroidGlassSliderProps,
  'onValueChange' | 'onSlidingComplete' | 'accentColor' | 'trackColor'
> & {
  /** Count of the last event handled here (see ControlledProp on the native side). */
  mostRecentEventCount: number;
  onValueChange: (event: ValueEvent) => void;
  onSlidingComplete: (event: ValueEvent) => void;
  accentColor?: NativeColor;
  trackColor?: NativeColor;
};

const NativeAndroidGlassSlider: React.ComponentType<NativeAndroidGlassSliderProps> =
  requireNativeView('ExpoAndroidGlassView', 'AndroidGlassSlider');

export default function AndroidGlassSlider({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  onSlidingComplete,
  accentColor,
  trackColor,
  style,
  ...rest
}: AndroidGlassSliderProps) {
  const min = minimumValue ?? 0;
  // Without a `value` prop, the slider keeps the position the user gives it.
  const [ownValue, setOwnValue] = React.useState(min);
  // Sent back with `value`, so the native side can tell a stale value (JS still catching up with
  // earlier events) from a current one.
  const [eventCount, setEventCount] = React.useState(0);
  const handleEvent = (event: ValueEvent) => {
    const { value: next, eventCount: count } = event.nativeEvent;
    setEventCount((current) => Math.max(current, count));
    setOwnValue(next);
    return next;
  };
  return (
    <NativeAndroidGlassSlider
      accessibilityRole="adjustable"
      {...rest}
      style={[styles.slider, style]}
      value={value ?? ownValue}
      minimumValue={min}
      maximumValue={maximumValue ?? 1}
      mostRecentEventCount={eventCount}
      accentColor={toNativeColor(accentColor)}
      trackColor={toNativeColor(trackColor)}
      onValueChange={(event) => onValueChange?.(handleEvent(event))}
      onSlidingComplete={(event) => onSlidingComplete?.(handleEvent(event))}
    />
  );
}

const styles = StyleSheet.create({
  slider: {
    height: 36,
    alignSelf: 'stretch',
  },
});
