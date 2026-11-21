import { Ionicons } from '@expo/vector-icons';
import {
  AndroidGlassSlider,
  AndroidGlassTabs,
  AndroidGlassToggle,
  AndroidGlassView,
  GlassBackdropSource,
} from 'expo-android-glass-view';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Every glass component of the library in its base state: only sizes, and the backdrop source
 * that devices below SDK 37.2 need. Scroll the photos behind them.
 */

const PHOTOS = [
  require('../../assets/gallery/10.jpg'),
  require('../../assets/gallery/11.jpg'),
  require('../../assets/gallery/12.jpg'),
  require('../../assets/gallery/13.jpg'),
  require('../../assets/gallery/14.jpg'),
  require('../../assets/gallery/15.jpg'),
];

const TABS = [
  { label: 'Home', icon: 'home' as const },
  { label: 'Search', icon: 'search' as const },
  { label: 'Library', icon: 'albums' as const },
  { label: 'Settings', icon: 'settings' as const },
];

export default function Showcase() {
  const insets = useSafeAreaInsets();
  const [presses, setPresses] = useState(0);
  const [on, setOn] = useState(true);
  const [value, setValue] = useState(0.5);
  const [tab, setTab] = useState(0);
  const [dark, setDark] = useState(false);
  const theme = dark ? 'dark' : 'light';
  const ink = dark ? '#fff' : '#111';
  const subInk = dark ? '#ddd' : '#333';

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ animation: 'none' }} />

      <GlassBackdropSource name="showcase" style={styles.fill}>
        <ScrollView contentContainerStyle={styles.photos}>
          {PHOTOS.map((source, i) => (
            <Image key={i} source={source} style={styles.photo} />
          ))}
        </ScrollView>
      </GlassBackdropSource>

      <View style={[styles.overlay, { paddingTop: insets.top + 12 }]} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.title}>Showcase</Text>
          <View style={styles.segment}>
            {(['light', 'dark'] as const).map((t) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityState={{ selected: theme === t }}
                onPress={() => setDark(t === 'dark')}
                style={[styles.segmentItem, theme === t && styles.segmentItemOn]}>
                <Text style={[styles.segmentText, theme === t && styles.segmentTextOn]}>
                  {t === 'light' ? 'Light' : 'Dark'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.row} pointerEvents="none">
          <AndroidGlassView backdropSource="showcase" theme={theme} style={styles.card}>
            <Text style={[styles.cardText, { color: ink }]}>AndroidGlassView</Text>
            <Text style={[styles.cardSub, { color: subInk }]}>regular (default)</Text>
          </AndroidGlassView>
          <AndroidGlassView
            backdropSource="showcase"
            theme={theme}
            glassEffectStyle="clear"
            style={styles.card}>
            <Text style={[styles.cardText, { color: ink }]}>AndroidGlassView</Text>
            <Text style={[styles.cardSub, { color: subInk }]}>clear</Text>
          </AndroidGlassView>
        </View>

        <AndroidGlassView
          backdropSource="showcase"
          theme={theme}
          interactive
          onPress={() => setPresses((n) => n + 1)}
          cornerRadius={999}
          style={styles.button}>
          <Text style={[styles.cardText, { color: ink }]}>interactive · pressed {presses}×</Text>
        </AndroidGlassView>

        <View style={styles.controlRow}>
          <Text style={styles.label}>AndroidGlassToggle</Text>
          <AndroidGlassToggle
            backdropSource="showcase"
            theme={theme}
            value={on}
            onValueChange={setOn}
          />
        </View>

        <Text style={styles.label}>AndroidGlassSlider · {value.toFixed(2)}</Text>
        <AndroidGlassSlider
          backdropSource="showcase"
          theme={theme}
          value={value}
          onValueChange={setValue}
        />
      </View>

      <AndroidGlassTabs
        backdropSource="showcase"
        theme={theme}
        selectedIndex={tab}
        onTabSelected={setTab}
        style={[styles.tabBar, { bottom: insets.bottom + 16 }]}>
        {TABS.map((t) => (
          <View key={t.label} style={styles.tabItem}>
            <Ionicons name={t.icon} size={24} color={dark ? '#fff' : '#151515'} />
            <Text style={[styles.tabLabel, { color: dark ? '#fff' : '#151515' }]}>{t.label}</Text>
          </View>
        ))}
      </AndroidGlassTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  fill: { flex: 1 },
  photos: { paddingBottom: 140 },
  photo: { width: '100%', height: 340 },
  overlay: { position: 'absolute', left: 20, right: 20, top: 0, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 18,
    padding: 3,
  },
  segmentItem: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15 },
  segmentItemOn: { backgroundColor: '#fff' },
  segmentText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  segmentTextOn: { color: '#111' },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardText: { fontSize: 15, fontWeight: '700', color: '#111' },
  cardSub: { fontSize: 12, fontWeight: '600', color: '#333' },
  button: { height: 56, alignItems: 'center', justifyContent: 'center' },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
  tabBar: { position: 'absolute', left: 24, right: 24 },
  tabItem: { alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 11, color: '#151515', fontWeight: '600' },
});
