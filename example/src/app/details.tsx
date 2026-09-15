import Ionicons from "@expo/vector-icons/Ionicons";
import { AndroidGlassButton, AndroidGlassView } from "expo-android-glass-view";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CARDS, ColorCard } from "@/components/ColorCard";

/** Pushed on the native stack, over the tabs. */
export default function Details() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 180 },
        ]}
      >
        {[...CARDS].reverse().map((card) => (
          <ColorCard key={card.title} {...card} />
        ))}
      </ScrollView>

      <AndroidGlassButton
        accessibilityLabel="Back"
        cornerRadius={24}
        style={[styles.back, { top: insets.top + 12 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color="#000000" />
      </AndroidGlassButton>

      <AndroidGlassView
        cornerRadius={28}
        style={[styles.card, { bottom: insets.bottom + 24 }]}
      >
        <Text style={styles.title}>Details</Text>
        <Text style={styles.body}>
          A screen pushed on the native stack. The glass bends whatever scrolls
          behind it.
        </Text>
      </AndroidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  back: {
    position: "absolute",
    left: 16,
    width: 48,
    paddingHorizontal: 0,
  },
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    padding: 22,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  body: {
    fontSize: 15,
    color: "#333333",
  },
});
