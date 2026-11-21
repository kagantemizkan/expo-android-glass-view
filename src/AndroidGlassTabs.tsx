import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AndroidGlassTabsProps } from './AndroidGlassView.types';

// iOS and web: a plain row of tabs with the same API; the selected one gets a faint pill.
export default function AndroidGlassTabs({
  selectedIndex,
  onTabSelected,
  tintColor,
  children,
  style,
}: AndroidGlassTabsProps) {
  const tabs = React.Children.toArray(children).filter(React.isValidElement);
  const [ownIndex, setOwnIndex] = React.useState(0);
  const selected = selectedIndex ?? ownIndex;
  return (
    <View accessibilityRole="tablist" style={[styles.bar, { backgroundColor: tintColor }, style]}>
      {tabs.map((tab, index) => (
        <Pressable
          key={tab.key ?? index}
          accessibilityRole="tab"
          accessibilityState={{ selected: index === selected }}
          style={[styles.tab, index === selected && styles.selected]}
          onPress={() => {
            setOwnIndex(index);
            onTabSelected?.(index);
          }}>
          {tab}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 64, padding: 4, borderRadius: 32 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
  selected: { backgroundColor: 'rgba(0,0,0,0.1)' },
});
