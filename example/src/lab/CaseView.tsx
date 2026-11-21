import { Ionicons } from '@expo/vector-icons';
import {
  AndroidGlassSlider,
  AndroidGlassTabs,
  AndroidGlassToggle,
  GlassBackdropSource,
} from 'expo-android-glass-view';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LabCase } from './cases';
import CompareGlass from './CompareGlass';
import LabGlassView, { type BackdropStatus } from './LabGlassView';
import Scene from './Scene';

const TABS = [
  { label: 'Home', icon: 'home' as const },
  { label: 'Search', icon: 'search' as const },
  { label: 'Library', icon: 'albums' as const },
  { label: 'Settings', icon: 'settings' as const },
];

const GLASS_W = 280;
const GLASS_H = 180;

/** One test case: the scene, the glass on top, and a header saying what the platform did. */
export default function CaseView({ testCase }: { testCase: LabCase }) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<BackdropStatus | null>(null);
  const [presses, setPresses] = useState(0);
  const [tab, setTab] = useState(0);
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [brightness, setBrightness] = useState(70);
  const [slides, setSlides] = useState(0);
  const variant = testCase.variant ?? 'single';

  return (
    <View style={styles.root}>
      <GlassBackdropSource name="lab" style={styles.source}>
        <Scene name={testCase.scene} />
      </GlassBackdropSource>

      <View
        style={[
          styles.stage,
          (variant === 'tabs' || variant === 'controls' || variant === 'controls-scroll') && {
            display: 'none',
          },
        ]}
        pointerEvents={testCase.props.interactive ? 'box-none' : 'none'}>
        <Glass testCase={testCase} onStatus={setStatus} onPress={() => setPresses((n) => n + 1)} />
      </View>

      {variant === 'controls' && (
        <View style={styles.controls}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Wi-Fi {wifi ? 'on' : 'off'}</Text>
            <AndroidGlassToggle backdropSource="lab" value={wifi} onValueChange={setWifi} />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Bluetooth {bluetooth ? 'on' : 'off'}</Text>
            <AndroidGlassToggle
              value={bluetooth}
              onValueChange={setBluetooth}
              accentColor="#FF9500"
            />
          </View>
          <Text style={styles.rowLabel}>Volume {volume.toFixed(2)}</Text>
          <AndroidGlassSlider
            backdropSource="lab"
            value={volume}
            onValueChange={setVolume}
            onSlidingComplete={() => setSlides((n) => n + 1)}
          />
          <Text style={styles.rowLabel}>Brightness {Math.round(brightness)} (0–100)</Text>
          <AndroidGlassSlider
            backdropSource="lab"
            value={brightness}
            minimumValue={0}
            maximumValue={100}
            onValueChange={setBrightness}
            accentColor="#FF2D55"
          />
          <Text style={styles.rowLabel}>onSlidingComplete ×{slides}</Text>
        </View>
      )}

      {variant === 'controls-scroll' && (
        <ScrollView style={styles.scrollControls} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.rowLabel}>Scroll me ↕ — volume {volume.toFixed(2)}</Text>
          <AndroidGlassSlider backdropSource="lab" value={volume} onValueChange={setVolume} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Wi-Fi {wifi ? 'on' : 'off'}</Text>
            <AndroidGlassToggle backdropSource="lab" value={wifi} onValueChange={setWifi} />
          </View>
          {Array.from({ length: 12 }, (_, i) => (
            <Text key={i} style={styles.filler}>
              Row {i + 1}
            </Text>
          ))}
        </ScrollView>
      )}

      {variant === 'tabs' && (
        <AndroidGlassTabs
          backdropSource="lab"
          // Lab only: the native view reports its backdrop mode.
          {...({
            onBackdropStatus: (event: { nativeEvent: BackdropStatus }) =>
              setStatus(event.nativeEvent),
          } as object)}
          onTabSelected={setTab}
          style={[styles.tabBar, { bottom: insets.bottom + 16 }]}>
          {TABS.map((t) => (
            <View key={t.label} style={styles.tabItem}>
              <Ionicons name={t.icon} size={24} color="#151515" />
              <Text style={styles.tabLabel}>{t.label}</Text>
            </View>
          ))}
        </AndroidGlassTabs>
      )}

      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="none">
        <Text style={styles.id}>
          {testCase.group} · {testCase.id}
        </Text>
        <Text style={styles.title}>{testCase.title}</Text>
        <Text style={styles.question}>{testCase.question}</Text>
        <Text style={[styles.status, status?.applied ? styles.ok : styles.bad]}>
          {status == null
            ? 'no status yet'
            : `sdk ${status.sdkFull} · supported ${status.supported} · applied ${status.applied}` +
              (status.error ? `\n${status.error}` : '') +
              ` · mode ${status.mode}` +
              ` · ${status.width}×${status.height}px · variant ${variant}` +
              (testCase.props.interactive ? ` · onPress ×${presses}` : '') +
              (variant === 'tabs' ? ` · selected tab ${tab}` : '')}
        </Text>
      </View>
    </View>
  );
}

function Glass({
  testCase,
  onStatus,
  onPress,
}: {
  testCase: LabCase;
  onStatus: (status: BackdropStatus) => void;
  onPress: () => void;
}) {
  const variant = testCase.variant ?? 'single';
  const motion = useRef(new Animated.Value(0)).current;
  const [toggleOn, setToggleOn] = useState(true);

  useEffect(() => {
    if (variant !== 'animated') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [motion, variant]);

  useEffect(() => {
    if (variant !== 'toggle') return;
    const timer = setInterval(() => setToggleOn((on) => !on), 1000);
    return () => clearInterval(timer);
  }, [variant]);

  const props = {
    ...testCase.props,
    effect: variant === 'toggle' && !toggleOn ? ('none' as const) : testCase.props.effect,
  };
  const glass = (extra?: object, label = testCase.id) => (
    <LabGlassView
      {...props}
      backdropSource={testCase.noSource ? undefined : 'lab'}
      strokeColor="rgba(255,255,255,0.8)"
      style={[styles.glass, testCase.size, extra]}
      onPress={onPress}
      onBackdropStatus={(event) => onStatus(event.nativeEvent)}>
      <Text style={styles.label}>{label}</Text>
    </LabGlassView>
  );

  switch (variant) {
    case 'compare':
      return testCase.compare ? (
        <CompareGlass glassStyle={testCase.compare.glassStyle} dark={testCase.compare.dark} />
      ) : null;
    case 'nested':
      return (
        <View style={{ width: GLASS_W + 80, height: GLASS_H + 80 }}>
          {glass({ position: 'absolute', left: 0, top: 0 }, 'lower')}
          {glass({ position: 'absolute', left: 80, top: 80 }, 'upper')}
        </View>
      );
    case 'animated':
      return (
        <Animated.View
          style={{
            transform: [
              { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] }) },
              { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.25] }) },
            ],
          }}>
          {glass()}
        </Animated.View>
      );
    case 'margin': {
      const m = testCase.props.margin ?? 0;
      return glass({ width: GLASS_W + 2 * m, height: GLASS_H + 2 * m });
    }
    case 'opacity':
      return glass({ opacity: 0.5 });
    case 'edge':
      return glass({ position: 'absolute', left: -GLASS_W / 2, top: 260 });
    case 'toggle':
      return glass(undefined, toggleOn ? 'toggle: on' : 'toggle: off');
    default:
      return glass();
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  source: { flex: 1 },
  stage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glass: {
    width: GLASS_W,
    height: GLASS_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: { position: 'absolute', left: 24, right: 24 },
  controls: { position: 'absolute', left: 24, right: 24, top: 260, gap: 14 },
  scrollControls: { position: 'absolute', left: 0, right: 0, top: 220, bottom: 0 },
  scrollContent: { paddingHorizontal: 24, gap: 14, paddingBottom: 200 },
  filler: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 18,
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  tabItem: { alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 11, color: '#151515', fontWeight: '600' },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  id: { color: '#8e8e93', fontSize: 11 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  question: { color: '#d1d1d6', fontSize: 12, marginTop: 4 },
  status: { fontSize: 11, marginTop: 6, fontFamily: 'monospace' },
  ok: { color: '#30d158' },
  bad: { color: '#ff9f0a' },
});
