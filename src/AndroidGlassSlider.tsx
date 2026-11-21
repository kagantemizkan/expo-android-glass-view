import * as React from 'react';
import { type LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';

import type { AndroidGlassSliderProps } from './AndroidGlassView.types';

// iOS and web: a plain track and thumb with the same API.
export default function AndroidGlassSlider({
  value,
  minimumValue = 0,
  maximumValue = 1,
  onValueChange,
  onSlidingComplete,
  accentColor = '#0088FF',
  trackColor = 'rgba(120,120,120,0.2)',
  style,
  ...rest
}: AndroidGlassSliderProps) {
  const [width, setWidth] = React.useState(0);
  const [own, setOwn] = React.useState(minimumValue);
  const current = value ?? own;
  const span = maximumValue - minimumValue || 1;
  const fraction = Math.min(1, Math.max(0, (current - minimumValue) / span));
  const responder = React.useMemo(() => {
    const valueAt = (x: number) =>
      minimumValue + span * Math.min(1, Math.max(0, width > 0 ? x / width : 0));
    const slide = (x: number) => {
      const next = valueAt(x);
      setOwn(next);
      onValueChange?.(next);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => slide(event.nativeEvent.locationX),
      onPanResponderMove: (event) => slide(event.nativeEvent.locationX),
      onPanResponderRelease: (event) => onSlidingComplete?.(valueAt(event.nativeEvent.locationX)),
    });
  }, [width, minimumValue, span, onValueChange, onSlidingComplete]);

  return (
    <View
      accessibilityRole="adjustable"
      {...rest}
      {...responder.panHandlers}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.slider, style]}>
      <View style={[styles.track, { backgroundColor: trackColor }]} />
      <View
        style={[
          styles.track,
          styles.fill,
          { width: width * fraction, backgroundColor: accentColor },
        ]}
      />
      <View
        style={[styles.thumb, { left: Math.min(Math.max(width * fraction - 20, -10), width - 30) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slider: { height: 40, alignSelf: 'stretch', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3 },
  fill: { position: 'absolute', left: 0 },
  thumb: {
    position: 'absolute',
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
