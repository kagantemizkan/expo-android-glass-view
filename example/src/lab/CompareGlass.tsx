import { AndroidGlassView } from 'expo-android-glass-view';
import { GlassView } from 'expo-glass-effect';
import { Platform, StyleSheet, Text, View } from 'react-native';

export type CompareStyle = 'regular' | 'clear';

/**
 * The same glass on both platforms, for side-by-side screenshots: Apple's Liquid Glass on iOS
 * (expo-glass-effect's GlassView, i.e. UIGlassEffect), this library's glass on Android.
 */
export default function CompareGlass({
  glassStyle,
  dark,
}: {
  glassStyle: CompareStyle;
  dark?: boolean;
}) {
  return (
    <View style={styles.column}>
      <Glass glassStyle={glassStyle} dark={dark} style={styles.capsule}>
        <Text style={[styles.label, dark && styles.labelDark]}>Liquid Glass</Text>
      </Glass>
      <Glass glassStyle={glassStyle} dark={dark} style={styles.circle} />
    </View>
  );
}

function Glass({
  glassStyle,
  dark,
  style,
  children,
}: {
  glassStyle: CompareStyle;
  dark?: boolean;
  style: object;
  children?: React.ReactNode;
}) {
  if (Platform.OS === 'ios') {
    return (
      <GlassView glassEffectStyle={glassStyle} colorScheme={dark ? 'dark' : 'light'} style={style}>
        {children}
      </GlassView>
    );
  }
  return (
    <AndroidGlassView
      backdropSource="lab"
      glassEffectStyle={glassStyle}
      cornerRadius={999}
      theme={dark ? 'dark' : 'light'}
      style={style}>
      {children}
    </AndroidGlassView>
  );
}

const styles = StyleSheet.create({
  column: { alignItems: 'center', gap: 40 },
  capsule: {
    width: 300,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: { width: 96, height: 96, borderRadius: 48 },
  label: { fontSize: 24, fontWeight: '700', color: '#111' },
  labelDark: { color: '#fff' },
});
