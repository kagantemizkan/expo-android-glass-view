import * as React from 'react';
import { type GestureResponderEvent, StyleSheet, View } from 'react-native';

import type { AndroidGlassSliderProps } from './AndroidGlassComponents.types';

/** iOS and web fallback: a plain slider with the same API. */
export default function AndroidGlassSlider({
  value = 0,
  minimumValue = 0,
  maximumValue = 1,
  onValueChange,
  onSlidingComplete,
  accentColor = '#0088FF',
  trackColor = 'rgba(120, 120, 120, 0.2)',
  style,
  onLayout,
  ...rest
}: AndroidGlassSliderProps) {
  const [width, setWidth] = React.useState(0);
  const range = maximumValue - minimumValue || 1;
  const progress = Math.min(1, Math.max(0, (value - minimumValue) / range));

  const valueAt = (event: GestureResponderEvent) =>
    minimumValue + Math.min(1, Math.max(0, event.nativeEvent.locationX / (width || 1))) * range;

  return (
    <View
      accessibilityRole="adjustable"
      {...rest}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => onValueChange?.(valueAt(event))}
      onResponderMove={(event) => onValueChange?.(valueAt(event))}
      onResponderRelease={(event) => onSlidingComplete?.(valueAt(event))}
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
        onLayout?.(event);
      }}
      style={[styles.container, style]}>
      <View pointerEvents="none" style={[styles.track, { backgroundColor: trackColor }]}>
        <View
          style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accentColor }]}
        />
      </View>
      <View pointerEvents="none" style={[styles.thumb, { left: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    width: 40,
    height: 24,
    marginLeft: -20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
