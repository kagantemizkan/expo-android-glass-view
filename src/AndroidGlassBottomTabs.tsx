import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AndroidGlassBottomTabsProps } from './AndroidGlassComponents.types';

/** iOS and web fallback: a plain tab bar with the same API (it does not minimize). */
export default function AndroidGlassBottomTabs({
  theme = 'light',
  selectedIndex = 0,
  onTabSelected,
  minimized: _minimized,
  onMinimizedChange: _onMinimizedChange,
  accentColor: _accentColor,
  containerColor,
  cornerRadius,
  opacity,
  fallbackColor,
  surfaceColor,
  tintColor,
  blurRadius: _blurRadius,
  blurGradient: _blurGradient,
  refractionHeight: _refractionHeight,
  refractionAmount: _refractionAmount,
  chromaticAberration: _chromaticAberration,
  depthEffect: _depthEffect,
  vibrancy: _vibrancy,
  highlight: _highlight,
  shadow: _shadow,
  children,
  style,
  ...rest
}: AndroidGlassBottomTabsProps) {
  const tabs = React.Children.toArray(children).filter(React.isValidElement);
  return (
    <View
      accessibilityRole="tablist"
      {...rest}
      style={[
        styles.bar,
        {
          backgroundColor:
            containerColor ??
            surfaceColor ??
            tintColor ??
            fallbackColor ??
            (theme === 'dark' ? '#242b33' : 'rgba(255, 255, 255, 0.7)'),
        },
        style,
        cornerRadius !== undefined && { borderRadius: cornerRadius },
        opacity !== undefined && { opacity: Math.max(0, Math.min(1, opacity)) },
      ]}>
      {tabs.map((tab, index) => (
        <Pressable
          key={tab.key ?? index}
          accessibilityRole="tab"
          accessibilityState={{ selected: index === selectedIndex }}
          onPress={() => onTabSelected?.(index)}
          style={[
            styles.tab,
            index === selectedIndex && {
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
          ]}>
          {tab}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 64,
    flexDirection: 'row',
    padding: 4,
    borderRadius: 32,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 28,
  },
  selected: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
});
