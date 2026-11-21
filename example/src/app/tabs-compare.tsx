import { Ionicons } from '@expo/vector-icons';
import { AndroidGlassTabs, GlassBackdropSource } from 'expo-android-glass-view';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, LogBox } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BarBackdrop from '../lab/BarBackdrop';
import { useTuneProps } from '../lab/tuneParams';

// Screenshots for comparison: no warning toasts over the glass.
LogBox.ignoreAllLogs();

/**
 * The showcase's tab bar over the fixed BarBackdrop, the same backdrop the iOS native tab bar
 * reference (/native-tabs) draws, so the two can be compared pixel for pixel.
 */
const TABS = [
  { label: 'Home', icon: 'home' as const },
  { label: 'Search', icon: 'search' as const },
  { label: 'Library', icon: 'albums' as const },
  { label: 'Settings', icon: 'settings' as const },
];

export default function TabsCompare() {
  const insets = useSafeAreaInsets();
  const tune = useTuneProps();
  const { theme } = useLocalSearchParams<{ theme?: string }>();
  const dark = theme === 'dark';
  const ink = dark ? '#fff' : '#151515';
  const [tab, setTab] = useState(0);
  const [barCenterY, setBarCenterY] = useState<number | null>(null);
  const sourceRef = useRef<View>(null);
  const barRef = useRef<View>(null);

  // Both measured in window coordinates, so the photo lands on the bar's real centre whatever
  // offset (status bar, edge-to-edge) the containers have.
  const measure = () => {
    sourceRef.current?.measureInWindow((_sx, sy) => {
      barRef.current?.measureInWindow((_bx, by, _bw, bh) => {
        setBarCenterY(by + bh / 2 - sy);
      });
    });
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ animation: 'none' }} />
      <GlassBackdropSource name="tabs-compare" style={styles.fill}>
        <View ref={sourceRef} style={styles.fill} onLayout={measure}>
          {barCenterY !== null && <BarBackdrop barCenterY={barCenterY} />}
        </View>
      </GlassBackdropSource>
      <View ref={barRef} style={[styles.tabBar, { bottom: insets.bottom + 16 }]} onLayout={measure}>
        <AndroidGlassTabs
          {...tune}
          backdropSource="tabs-compare"
          theme={dark ? 'dark' : 'light'}
          selectedIndex={tab}
          onTabSelected={setTab}>
          {TABS.map((t) => (
            <View key={t.label} style={styles.tabItem}>
              <Ionicons name={t.icon} size={24} color={ink} />
              <Text style={[styles.tabLabel, { color: ink }]}>{t.label}</Text>
            </View>
          ))}
        </AndroidGlassTabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#808080' },
  fill: { flex: 1 },
  tabBar: { position: 'absolute', left: 24, right: 24 },
  tabItem: { alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 11, color: '#151515', fontWeight: '600' },
});
