import { AndroidGlassView } from "expo-android-glass-view";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Diameter of the two glass badges. */
const BADGE_SIZE = 96;
/** The glass tab bar's height plus its gap to the screen bottom (see GlassTabBar). */
const TAB_BAR_SPACE = 64 + 12;

/** Scattered coloured dots around the badges, so the glass has something to bend. */
const DOTS = [
  { top: 240, left: 160, size: 50, color: "#4C7DFF" },
  { top: 300, left: 165, size: 50, color: "#FF6B9A" },
  { top: 270, left: 110, size: 34, color: "#FFC53D" },
  { top: 330, left: 230, size: 42, color: "#3DDC84" },
  { top: 230, left: 240, size: 28, color: "#A66BFF" },
  { top: 345, left: 95, size: 30, color: "#FF8A3D" },
  { top: 215, left: 125, size: 22, color: "#2EC4E6" },
  { top: 360, left: 190, size: 24, color: "#FF4F5E" },
];

/** A calm, centred hero: two glass badges, a title and the install command. */
export default function Home() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + TAB_BAR_SPACE,
        },
      ]}
    >
      {DOTS.map((dot, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            borderRadius: dot.size / 2,
            backgroundColor: dot.color,
          }}
        />
      ))}
      <View style={styles.badges}>
        <AndroidGlassView cornerRadius={BADGE_SIZE / 2} style={styles.badge}>
          <Image
            style={styles.badgeIcon}
            contentFit="contain"
            source={require("@/assets/images/expo-icon.svg")}
          />
        </AndroidGlassView>
        <AndroidGlassView
          cornerRadius={BADGE_SIZE / 2}
          tintColor="rgba(61, 220, 132, 0.12)"
          style={styles.badge}
        >
          <Image
            style={styles.badgeIcon}
            contentFit="contain"
            source={require("@/assets/images/android.png")}
          />
        </AndroidGlassView>
      </View>

      <Text style={styles.title}>Liquid Glass</Text>
      <Text style={styles.subtitle}>expo-android-glass-view</Text>

      <View style={styles.command}>
        <Text style={styles.commandText}>
          npx expo install expo-android-glass-view
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  badges: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 28,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIcon: {
    width: "48%",
    height: "48%",
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1.5,
    color: "#111111",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: "500",
    color: "#8e8e93",
  },
  command: {
    marginTop: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f2f2f7",
  },
  commandText: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#3a3a3c",
  },
});
