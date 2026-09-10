import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AndroidGlassBottomTabsProps } from './AndroidGlassComponents.types';

/** iOS and web fallback: a plain tab bar with the same API (it does not minimize). */
export default function AndroidGlassBottomTabs({
  selectedIndex = 0,
  onTabSelected,
  minimized: _minimized,
  onMinimizedChange: _onMinimizedChange,
  accentColor: _accentColor,
  containerColor,
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
        { backgroundColor: containerColor ?? 'rgba(250, 250, 250, 0.9)' },
        style,
      ]}>
      {tabs.map((tab, index) => (
        <Pressable
          key={tab.key ?? index}
          accessibilityRole="tab"
          accessibilityState={{ selected: index === selectedIndex }}
          onPress={() => onTabSelected?.(index)}
          style={[styles.tab, index === selectedIndex && styles.selected]}>
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
