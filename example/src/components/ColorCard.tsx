import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

/** Bright, busy content for behind the glass: the effect needs something to bend. */
export const CARDS = [
  { color: "#FF6B6B", emoji: "🍓", title: "Strawberry" },
  { color: "#FFA94D", emoji: "🍊", title: "Orange" },
  { color: "#FFD43B", emoji: "🍋", title: "Lemon" },
  { color: "#69DB7C", emoji: "🥝", title: "Kiwi" },
  { color: "#38D9A9", emoji: "🌊", title: "Wave" },
  { color: "#4DABF7", emoji: "🐳", title: "Whale" },
  { color: "#748FFC", emoji: "🪐", title: "Planet" },
  { color: "#DA77F2", emoji: "🔮", title: "Crystal" },
  { color: "#F783AC", emoji: "🌸", title: "Blossom" },
];

type ColorCardProps = {
  color: string;
  emoji: string;
  title: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** A coloured card with an emoji wallpaper. */
export function ColorCard({ color, emoji, title, style, children }: ColorCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: color }, style]}>
      <Text style={styles.wallpaper}>{emoji.repeat(60)}</Text>
      {/* JS toUpperCase ignores the device locale; textTransform on a Turkish phone gives "KİWİ". */}
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 160,
    padding: 20,
    gap: 16,
    borderRadius: 28,
    overflow: "hidden",
  },
  wallpaper: {
    ...StyleSheet.absoluteFill,
    padding: 8,
    fontSize: 30,
    lineHeight: 44,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#ffffff",
  },
});
