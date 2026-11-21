import { requireNativeView } from 'expo';
import * as React from 'react';
import { processColor, StyleSheet, View } from 'react-native';

import type { AndroidGlassTabsProps } from './AndroidGlassView.types';

type NativeProps = Omit<
  AndroidGlassTabsProps,
  'onTabSelected' | 'accentColor' | 'tintColor' | 'fallbackColor'
> & {
  tabsCount: number;
  cornerRadius?: number;
  clip?: boolean;
  onTabSelected: (event: { nativeEvent: { index: number } }) => void;
  accentColor?: number | null;
  tintColor?: number | null;
  fallbackColor?: number | null;
};

const NativeAndroidGlassTabs: React.ComponentType<NativeProps> = requireNativeView(
  'ExpoAndroidGlassView',
  'AndroidGlassTabs'
);

function toNative(color: AndroidGlassTabsProps['accentColor']) {
  const value = color == null ? null : processColor(color);
  return typeof value === 'number' ? value : null;
}

/**
 * A liquid glass tab bar: the bar is liquid glass, a droplet marks the selected tab and can be
 * tapped, dragged or scrubbed between tabs. The native side handles every touch on the bar.
 */
export default function AndroidGlassTabs({
  selectedIndex,
  onTabSelected,
  accentColor,
  tintColor,
  fallbackColor,
  children,
  style,
  ...rest
}: AndroidGlassTabsProps) {
  const tabs = React.Children.toArray(children).filter(React.isValidElement);
  const [ownIndex, setOwnIndex] = React.useState(0);
  return (
    <NativeAndroidGlassTabs
      accessibilityRole="tablist"
      cornerRadius={999}
      // The pressed droplet swells past the bar.
      clip={false}
      {...rest}
      style={[styles.bar, style]}
      tabsCount={tabs.length}
      selectedIndex={selectedIndex ?? ownIndex}
      accentColor={toNative(accentColor)}
      tintColor={toNative(tintColor)}
      fallbackColor={toNative(fallbackColor)}
      onTabSelected={(event) => {
        setOwnIndex(event.nativeEvent.index);
        onTabSelected?.(event.nativeEvent.index);
      }}>
      {tabs.map((tab, index) => (
        <View
          key={tab.key ?? index}
          style={styles.tab}
          pointerEvents="none"
          accessibilityRole="tab"
          accessibilityState={{ selected: index === (selectedIndex ?? ownIndex) }}>
          {tab}
        </View>
      ))}
    </NativeAndroidGlassTabs>
  );
}

const styles = StyleSheet.create({
  // PADDING_DP on the native side.
  bar: { flexDirection: 'row', height: 64, padding: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
