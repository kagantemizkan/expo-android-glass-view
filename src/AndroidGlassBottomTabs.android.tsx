import { requireNativeView } from 'expo';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { AndroidGlassBottomTabsProps } from './AndroidGlassComponents.types';
import { MinimizedStateContext } from './MinimizeOnScroll';
import { type NativeColor, toNativeColor } from './utils';

type IndexEvent = { nativeEvent: { index: number; eventCount: number } };
type MinimizedEvent = { nativeEvent: { minimized: boolean } };

type NativeAndroidGlassBottomTabsProps = Omit<
  AndroidGlassBottomTabsProps,
  'onTabSelected' | 'onMinimizedChange' | 'accentColor' | 'containerColor'
> & {
  tabsCount: number;
  /** Count of the last selection event handled here (see ControlledProp on the native side). */
  mostRecentEventCount: number;
  onTabSelected: (event: IndexEvent) => void;
  onMinimizedChange: (event: MinimizedEvent) => void;
  accentColor?: NativeColor;
  containerColor?: NativeColor;
};

const NativeAndroidGlassBottomTabs: React.ComponentType<NativeAndroidGlassBottomTabsProps> =
  requireNativeView('ExpoAndroidGlassView', 'AndroidGlassBottomTabs');

export default function AndroidGlassBottomTabs({
  selectedIndex,
  onTabSelected,
  minimized,
  onMinimizedChange,
  accentColor,
  containerColor,
  children,
  style,
  ...rest
}: AndroidGlassBottomTabsProps) {
  const tabs = React.Children.toArray(children).filter(React.isValidElement);
  // Without a `selectedIndex` prop, the bar keeps the user's selection.
  const [ownIndex, setOwnIndex] = React.useState(0);
  // Sent back with `selectedIndex`, so the native side can tell a stale index (JS still catching
  // up with earlier selections) from a current one.
  const [eventCount, setEventCount] = React.useState(0);
  const selected = selectedIndex ?? ownIndex;
  // Inside a MinimizeOnScrollProvider, the bar follows the shared state unless `minimized` is given.
  const shared = React.useContext(MinimizedStateContext);
  const followsProvider = minimized === undefined;
  return (
    <NativeAndroidGlassBottomTabs
      accessibilityRole="tablist"
      {...rest}
      style={[styles.bar, style]}
      selectedIndex={selected}
      tabsCount={tabs.length}
      mostRecentEventCount={eventCount}
      minimized={minimized ?? shared?.minimized ?? false}
      accentColor={toNativeColor(accentColor)}
      containerColor={toNativeColor(containerColor)}
      onTabSelected={(event) => {
        const { index, eventCount: count } = event.nativeEvent;
        setEventCount((current) => Math.max(current, count));
        setOwnIndex(index);
        onTabSelected?.(index);
      }}
      onMinimizedChange={(event) => {
        const value = event.nativeEvent.minimized;
        if (followsProvider) shared?.setMinimized(value);
        onMinimizedChange?.(value);
      }}>
      {tabs.map((tab, index) => (
        // The native bar handles taps and drags, and draws these views itself (inside the glass
        // and, tinted, under the droplet), so they must stay real views and not take touches.
        <View
          key={tab.key ?? index}
          collapsable={false}
          pointerEvents="none"
          accessibilityRole="tab"
          accessibilityState={{ selected: index === selected }}
          style={styles.tab}>
          {tab}
        </View>
      ))}
    </NativeAndroidGlassBottomTabs>
  );
}

const styles = StyleSheet.create({
  // 4 dp side padding keeps the tabs aligned with the droplet: (width - 8 dp) / count each.
  bar: {
    height: 64,
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
