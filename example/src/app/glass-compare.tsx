import { AndroidGlassView, GlassBackdropSource } from 'expo-android-glass-view';
import { GlassView } from 'expo-glass-effect';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Appearance, Platform, StyleSheet, useWindowDimensions, View, LogBox } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BarBackdrop from '../lab/BarBackdrop';
import { useTuneProps } from '../lab/tuneParams';

// Screenshots for comparison: no warning toasts over the glass.
LogBox.ignoreAllLogs();

/**
 * A plain glass capsule the size of the iOS 26 tab bar (360 × 61 pt), over the fixed
 * BarBackdrop: Apple's GlassView on iOS, AndroidGlassView on Android. Compares the material
 * itself, including `clear`, which the system tab bar has no variant of.
 * Params: ?photo=12|15|17&style=regular|clear&theme=light|dark
 */
/** Defaults: the iOS 26 tab bar's size. Override with ?w=&h=&r= (r = corner radius). */
const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 61;
/** Same place as the iOS tab bar: centre 52 pt above the bottom of the screen. */
const CENTER_FROM_BOTTOM = 52;

export default function GlassCompare() {
  const { style, theme, w, h, r } = useLocalSearchParams<{
    style?: string;
    theme?: string;
    w?: string;
    h?: string;
    r?: string;
  }>();
  const WIDTH = w ? Number(w) : DEFAULT_WIDTH;
  const HEIGHT = h ? Number(h) : DEFAULT_HEIGHT;
  const RADIUS = r ? Number(r) : HEIGHT / 2;
  // Tall glass sits higher so it stays on screen; the backdrop follows its centre anyway.
  const centerFromBottom = Math.max(CENTER_FROM_BOTTOM, HEIGHT / 2 + 40);
  const glassStyle = style === 'clear' ? 'clear' : 'regular';
  const dark = theme === 'dark';
  const { width, height } = useWindowDimensions();
  // Keep Android's glass above its navigation bar; the backdrop follows the glass anyway.
  const insets = useSafeAreaInsets();
  const tune = useTuneProps();
  const navBar = Platform.OS === 'android' ? insets.bottom : 0;
  useEffect(() => {
    Appearance.setColorScheme(dark ? 'dark' : 'light');
  }, [dark]);
  const [centerY, setCenterY] = useState<number | null>(null);
  const sourceRef = useRef<View>(null);
  const glassRef = useRef<View>(null);

  const measure = () => {
    sourceRef.current?.measureInWindow((_sx, sy) => {
      glassRef.current?.measureInWindow((_gx, gy, _gw, gh) => setCenterY(gy + gh / 2 - sy));
    });
  };

  const frame = {
    position: 'absolute' as const,
    width: WIDTH,
    height: HEIGHT,
    left: (width - WIDTH) / 2,
    top: height - navBar - centerFromBottom - HEIGHT / 2,
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ animation: 'none' }} />
      <GlassBackdropSource name="glass-compare" style={styles.fill}>
        <View ref={sourceRef} style={styles.fill} onLayout={measure}>
          {centerY !== null && <BarBackdrop barCenterY={centerY} />}
        </View>
      </GlassBackdropSource>
      <View ref={glassRef} style={frame} onLayout={measure}>
        {Platform.OS === 'ios' ? (
          <GlassView
            glassEffectStyle={glassStyle}
            colorScheme={dark ? 'dark' : 'light'}
            style={{ width: WIDTH, height: HEIGHT, borderRadius: RADIUS }}
          />
        ) : (
          <AndroidGlassView
            {...tune}
            backdropSource="glass-compare"
            glassEffectStyle={glassStyle}
            theme={dark ? 'dark' : 'light'}
            cornerRadius={RADIUS}
            style={{ width: WIDTH, height: HEIGHT, borderRadius: RADIUS }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#808080' },
  fill: { flex: 1 },
});
