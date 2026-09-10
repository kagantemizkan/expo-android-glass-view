import { requireNativeView } from 'expo';
import * as React from 'react';
import { StyleSheet, Text } from 'react-native';

import type { AndroidGlassButtonProps } from './AndroidGlassComponents.types';
import { type NativeColor, toNativeColor } from './utils';

type NativeAndroidGlassButtonProps = Omit<
  AndroidGlassButtonProps,
  'tintColor' | 'surfaceColor' | 'fallbackColor' | 'onPress' | 'title' | 'titleStyle'
> & {
  tintColor?: NativeColor;
  surfaceColor?: NativeColor;
  fallbackColor?: NativeColor;
  onPress?: () => void;
};

const NativeAndroidGlassButton: React.ComponentType<NativeAndroidGlassButtonProps> =
  requireNativeView('ExpoAndroidGlassView', 'AndroidGlassButton');

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
  ...rest
}: AndroidGlassButtonProps) {
  const borderRadius = StyleSheet.flatten(style)?.borderRadius;
  return (
    <NativeAndroidGlassButton
      accessibilityRole="button"
      {...rest}
      style={[styles.button, style]}
      cornerRadius={cornerRadius ?? (typeof borderRadius === 'number' ? borderRadius : undefined)}
      tintColor={toNativeColor(tintColor)}
      surfaceColor={toNativeColor(surfaceColor)}
      fallbackColor={toNativeColor(fallbackColor)}
      onPress={onPress ? () => onPress() : undefined}>
      {title != null ? (
        <Text style={[styles.title, tintColor != null && styles.titleOnTint, titleStyle]}>
          {title}
        </Text>
      ) : null}
      {children}
    </NativeAndroidGlassButton>
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
