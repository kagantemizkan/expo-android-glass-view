import {
  AndroidGlassButton,
  AndroidGlassMenu,
  useMinimizeOnScrollHandler,
} from "expo-android-glass-view";
import { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CARDS } from "@/components/ColorCard";
import { GlassHeader } from "@/components/GlassHeader";

const TILES = [...CARDS, ...CARDS].map((card, index) => ({
  ...card,
  key: `${card.title}-${index}`,
}));
const PADDING = 16;
const GAP = 12;

export default function Gallery() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const onScroll = useMinimizeOnScrollHandler();
  const menuAnchor = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [triggerHidden, setTriggerHidden] = useState(false);
  const [sort, setSort] = useState('original');
  const [darkMenu, setDarkMenu] = useState(true);
  const [tiles, setTiles] = useState(TILES);
  const tileSize = (width - PADDING * 2 - GAP) / 2;

  const shuffle = () =>
    setTiles((current) => [...current].sort(() => Math.random() - 0.5));

  return (
    <View style={styles.root}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.grid,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {tiles.map((tile) => (
          <View
            key={tile.key}
            style={[
              styles.tile,
              {
                width: tileSize,
                height: tileSize,
                backgroundColor: tile.color,
              },
            ]}
          >
            <Text style={styles.emoji}>{tile.emoji}</Text>
            <Text style={styles.tileTitle}>{tile.title}</Text>
          </View>
        ))}
      </ScrollView>

      <GlassHeader title="Gallery" subtitle={`${tiles.length} tiles`} />

      <View ref={menuAnchor} collapsable={false} style={{ position: 'absolute', right: 24, top: insets.top + 76, opacity: triggerHidden ? 0 : 1 }}>
        <AndroidGlassButton title="☰  Menu" onPress={() => {
          setTriggerHidden(true);
          setMenuVisible(true);
        }} />
      </View>
      <AndroidGlassMenu
        visible={menuVisible}
        anchorRef={menuAnchor}
        sourceIcon="sort"
        onDismissed={() => setTriggerHidden(false)}
        theme={darkMenu ? 'dark' : 'light'}
        insets={{ top: insets.top + 8, bottom: insets.bottom + 8 }}
        items={[
          { id: 'original', title: 'Sort by original order', checked: sort === 'original' },
          { id: 'name', title: 'Sort by name', checked: sort === 'name' },
          { id: 'shuffle', title: 'Shuffle tiles', separator: true },
          { id: 'theme', title: darkMenu ? 'Use light glass' : 'Use dark glass' },
          { id: 'disabled', title: 'Unavailable action', disabled: true },
          { id: 'reset', title: 'Reset gallery', separator: true, destructive: true },
        ]}
        onDismiss={() => setMenuVisible(false)}
        onSelect={(id) => {
          if (id === 'theme') setDarkMenu((value) => !value);
          else if (id === 'shuffle') { shuffle(); setSort('shuffle'); }
          else if (id === 'name') { setTiles((current) => [...current].sort((a, b) => a.title.localeCompare(b.title))); setSort(id); }
          else { setTiles(TILES); setSort('original'); }
        }}
      />

      <AndroidGlassButton
        title="Shuffle"
        titleStyle={styles.buttonTitle}
        style={[styles.shuffle, { bottom: insets.bottom + 96 }]}
        onPress={shuffle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    paddingHorizontal: PADDING,
  },
  tile: {
    borderRadius: 24,
    padding: 16,
    justifyContent: "space-between",
  },
  emoji: {
    fontSize: 56,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  shuffle: {
    position: "absolute",
    right: 24,
    paddingHorizontal: 24,
  },
  buttonTitle: {
    fontWeight: "700",
  },
});
