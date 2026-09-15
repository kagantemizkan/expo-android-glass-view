import {
  AndroidGlassButton,
  AndroidGlassSlider,
  AndroidGlassToggle,
  AndroidGlassView,
  useMinimizeOnScrollHandler,
} from "expo-android-glass-view";
import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassHeader, HEADER_SPACE } from "@/components/GlassHeader";

/** The glass tab bar's height plus its gap to the screen bottom (see GlassTabBar). */
const TAB_BAR_SPACE = 64 + 12;

/** Every glass control, one section each: toggles, sliders, buttons. */
export default function Controls() {
  const insets = useSafeAreaInsets();
  const onScroll = useMinimizeOnScrollHandler();
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [brightness, setBrightness] = useState(0.6);
  const [volume, setVolume] = useState(0.3);

  const reset = () => {
    setWifi(true);
    setBluetooth(false);
    setBrightness(0.6);
    setVolume(0.3);
  };
  const randomize = () => {
    setBrightness(Math.random());
    setVolume(Math.random());
  };

  return (
    <View style={styles.root}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + HEADER_SPACE + 8,
            paddingBottom: insets.bottom + TAB_BAR_SPACE + 24,
          },
        ]}
      >
        <AndroidGlassButton title="Cam test laboratuvarı →" onPress={() => router.push("/glass-lab")} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Glass</Text>
          <GlassVariants />
        </View>
        <Section title="Toggles">
          <Row label="Wi-Fi">
            <AndroidGlassToggle value={wifi} onValueChange={setWifi} />
          </Row>
          <Row label="Bluetooth">
            <AndroidGlassToggle
              value={bluetooth}
              onValueChange={setBluetooth}
            />
          </Row>
        </Section>

        <Section title="Sliders">
          <Row label="Brightness" value={`${Math.round(brightness * 100)}%`} />
          <AndroidGlassSlider
            value={brightness}
            onValueChange={setBrightness}
          />
          <Row label="Volume" value={`${Math.round(volume * 100)}%`} />
          <AndroidGlassSlider value={volume} onValueChange={setVolume} />
        </Section>

        <Section title="Buttons">
          <View style={styles.buttons}>
            <AndroidGlassButton
              title="Reset"
              style={styles.button}
              onPress={reset}
            />
            <AndroidGlassButton
              title="Randomize"
              tintColor="#0A84FF"
              style={styles.button}
              onPress={randomize}
            />
          </View>
        </Section>
      </ScrollView>

      <GlassHeader title="Controls" subtitle="Toggle · Slider · Button" />
    </View>
  );
}

/** Coloured dots behind the variant tiles: the glass needs something to blur and bend. */
const DOTS = [
  { top: "4%", left: "6%", size: 70, color: "#4C7DFF" },
  { top: "30%", left: "36%", size: 90, color: "#FF6B9A" },
  { top: "8%", left: "62%", size: 60, color: "#FFC53D" },
  { top: "56%", left: "4%", size: 64, color: "#3DDC84" },
  { top: "60%", left: "70%", size: 80, color: "#A66BFF" },
  { top: "38%", left: "84%", size: 40, color: "#FF8A3D" },
  { top: "78%", left: "40%", size: 46, color: "#2EC4E6" },
] as const;

/** The same glass with different props, over the same backdrop. */
const VARIANTS = [
  { label: "Default", props: {} },
  { label: "Frosted", props: { blurRadius: 12 } },
  {
    label: "Lens",
    props: { refractionHeight: 28, refractionAmount: 56, depthEffect: true },
  },
  {
    label: "Prism",
    props: { refractionAmount: 40, chromaticAberration: true },
  },
  { label: "Tint", props: { tintColor: "rgba(10, 132, 255, 0.3)" } },
  { label: "No shadow", props: { shadow: false, highlight: false } },
];

function GlassVariants() {
  return (
    <View style={styles.stage}>
      {/* A separate layer, not a direct parent of the tiles: the glass then keeps a live
          reference to it and sees the dots move without re-capturing every frame. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {DOTS.map((dot) => (
          <DriftingDot key={dot.color} {...dot} />
        ))}
      </View>
      {VARIANTS.map((variant) => (
        <AndroidGlassView
          key={variant.label}
          cornerRadius={22}
          style={styles.tile}
          {...variant.props}
        >
          <Text style={styles.tileLabel}>{variant.label}</Text>
        </AndroidGlassView>
      ))}
    </View>
  );
}

const drift = () => (Math.random() * 2 - 1) * 36;
const easing = Easing.inOut(Easing.sin);

/** A dot that wanders around its spot on a random, endless path. */
function DriftingDot({
  top,
  left,
  size,
  color,
}: {
  top: DimensionValue;
  left: DimensionValue;
  size: number;
  color: string;
}) {
  // Picked once per dot, so every dot takes its own path and pace.
  const [path] = useState(() => ({
    x: [drift(), drift(), drift()],
    y: [drift(), drift(), drift()],
    duration: 2200 + Math.random() * 2200,
  }));
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  useEffect(() => {
    const leg = { duration: path.duration, easing };
    x.set(
      withRepeat(
        withSequence(
          ...path.x.map((v) => withTiming(v, leg)),
          withTiming(0, leg),
        ),
        -1,
      ),
    );
    y.set(
      withRepeat(
        withSequence(
          ...path.y.map((v) => withTiming(v, leg)),
          withTiming(0, leg),
        ),
        -1,
      ),
    );
  }, [path, x, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** A captioned glass panel. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <AndroidGlassView cornerRadius={24} style={styles.panel}>
        {children}
      </AndroidGlassView>
    </View>
  );
}

/** A label on the left, a value or a control on the right. */
function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  content: {
    paddingHorizontal: 16,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#6e6e73",
  },
  stage: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 12,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  tile: {
    flexBasis: "46%",
    flexGrow: 1,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  panel: {
    padding: 18,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  value: {
    fontSize: 15,
    color: "#6e6e73",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
