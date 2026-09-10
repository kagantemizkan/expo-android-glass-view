import * as React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { AndroidGlassButtonProps } from './AndroidGlassComponents.types';

const DEFAULT_FALLBACK_COLOR = 'rgba(255, 255, 255, 0.7)';

/** iOS and web fallback: a translucent capsule button with the same API. */
export default function AndroidGlassButton({
  onPress,
  title,
  titleStyle,
  cornerRadius,
  tintColor,
  surfaceColor,
  fallbackColor,
  style,
  children,
  blurRadius: _blurRadius,
  refractionHeight: _refractionHeight,
  refractionAmount: _refractionAmount,
  chromaticAberration: _chromaticAberration,
  depthEffect: _depthEffect,
  vibrancy: _vibrancy,
  highlight: _highlight,
  shadow: _shadow,
  interactive: _interactive,
  ...rest
}: AndroidGlassButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: tintColor ?? surfaceColor ?? fallbackColor ?? DEFAULT_FALLBACK_COLOR,
          borderRadius: cornerRadius ?? 999,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {title != null ? (
        <Text style={[styles.title, tintColor != null && styles.titleOnTint, titleStyle]}>
          {title}
        </Text>
      ) : null}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    color: '#000000',
  },
  titleOnTint: {
    color: '#ffffff',
  },
});
