import { AndroidGlassView } from "expo-android-glass-view";
import { StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Top padding a scroll view needs so its first item starts below the header. */
export const HEADER_SPACE = 104;

/** A floating glass header; the screen scrolls underneath it. */
export function GlassHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <AndroidGlassView cornerRadius={28} style={[styles.header, { top: insets.top + 8 }]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </AndroidGlassView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 80,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#333333",
  },
});
