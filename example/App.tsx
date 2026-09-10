import Ionicons from "@expo/vector-icons/Ionicons";
import {
  AndroidGlassBottomTabs,
  AndroidGlassButton,
  AndroidGlassSlider,
  AndroidGlassTab,
  AndroidGlassToggle,
  AndroidGlassView,
  MinimizeOnScrollProvider,
  useMinimizeOnScrollHandler,
} from "expo-android-glass-view";
import { type ReactNode, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const EMOJI = "🌊 ⛵️ 🐬 🏝️ 🐚 🌅 🦀 🐙 🌴 ⚓️ 🧭 🐠 ";
const WALLPAPER = EMOJI.repeat(14);
const ROW_COLORS = ["#ff595e", "#ffca3a", "#4267ac", "#f15bb5", "#00bbf9"];

const TABS = [
  { label: "Home", icon: "home" },
  { label: "Search", icon: "search" },
  { label: "Library", icon: "albums" },
  { label: "Profile", icon: "person" },
] as const;

export default function App() {
  return (
    // One minimize state for the list and the tab bar, as around a navigator's tabs.
    <MinimizeOnScrollProvider>
      <Showcase />
    </MinimizeOnScrollProvider>
  );
}

function Showcase() {
  const [tab, setTab] = useState(0);
  const [presses, setPresses] = useState(0);
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [volume, setVolume] = useState(50);
  const press = () => setPresses((count) => count + 1);
  // Scrolling down minimizes the tab bar; scrolling up, or touching it, brings it back.
  const onScroll = useMinimizeOnScrollHandler();

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <Section title="Buttons" color="#8ac926">
          <AndroidGlassButton
            title="Transparent Liquid Button"
            onPress={press}
          />
          <AndroidGlassButton
            title="Surface Liquid Button"
            surfaceColor="rgba(255, 255, 255, 0.3)"
            onPress={press}
          />
          <AndroidGlassButton
            title="Tinted Liquid Button"
            tintColor="#0088FF"
            onPress={press}
          />
          <AndroidGlassButton tintColor="#FF8D28" onPress={press}>
            <Ionicons name="sparkles" size={18} color="#ffffff" />
            <Text style={styles.buttonText}>With an icon</Text>
          </AndroidGlassButton>
          <Text style={styles.caption}>Pressed {presses} times</Text>
        </Section>

        <Section title="Toggles" color="#1982c4">
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

        <Section title="Slider" color="#ff924c">
          <AndroidGlassSlider
            value={volume}
            minimumValue={0}
            maximumValue={100}
            onValueChange={setVolume}
          />
          <Text style={styles.caption}>Volume {Math.round(volume)}</Text>
        </Section>

        <Section title="Glass view" color="#6a4c93">
          <AndroidGlassView style={styles.card} cornerRadius={24}>
            <Text style={styles.cardTitle}>AndroidGlassView</Text>
            <Text style={styles.cardText}>
              A container: anything inside stays interactive. Glass on top of it
              sees the card.
            </Text>
            <View style={styles.cardRow}>
              <AndroidGlassToggle value={wifi} onValueChange={setWifi} />
              <Text style={styles.cardText}>Glass on glass</Text>
            </View>
          </AndroidGlassView>
        </Section>

        {ROW_COLORS.map((color, index) => (
          <Section
            key={color}
            title={`Keep scrolling ${index + 1}`}
            color={color}
          >
            <Text style={styles.caption}>
              The tab bar and the header bend whatever scrolls underneath.
            </Text>
          </Section>
        ))}
      </ScrollView>

      <AndroidGlassView style={styles.header} cornerRadius={28}>
        <Text style={styles.headerTitle}>expo-android-glass-view</Text>
        <Text style={styles.headerSubtitle}>
          {Platform.OS} {Platform.Version} · Kyant's Liquid Glass in React
          Native
        </Text>
      </AndroidGlassView>

      <AndroidGlassBottomTabs
        selectedIndex={tab}
        onTabSelected={setTab}
        style={styles.tabs}
      >
        {TABS.map((item) => (
          <AndroidGlassTab
            key={item.label}
            label={item.label}
            icon={<Ionicons name={item.icon} size={24} color="#000000" />}
          />
        ))}
      </AndroidGlassBottomTabs>
    </View>
  );
}

function Section(props: { title: string; color: string; children: ReactNode }) {
  return (
    <View style={[styles.section, { backgroundColor: props.color }]}>
      <Text style={styles.wallpaper}>{WALLPAPER}</Text>
      <Text style={styles.sectionTitle}>{props.title}</Text>
      <View style={styles.sectionBody}>{props.children}</View>
    </View>
  );
}

function Row(props: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{props.label}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingTop: 150,
    paddingBottom: 150,
    paddingHorizontal: 16,
    gap: 16,
  },
  section: {
    borderRadius: 28,
    overflow: "hidden",
    padding: 20,
    gap: 16,
  },
  wallpaper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    fontSize: 30,
    lineHeight: 44,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#ffffff",
  },
  sectionBody: {
    alignItems: "center",
    gap: 16,
  },
  row: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  caption: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  buttonText: {
    fontSize: 15,
    color: "#ffffff",
  },
  card: {
    alignSelf: "stretch",
    padding: 18,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111111",
  },
  cardText: {
    fontSize: 14,
    color: "#333333",
  },
  cardRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  header: {
    position: "absolute",
    top: 52,
    left: 16,
    right: 16,
    height: 80,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111111",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#333333",
  },
  tabs: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 32,
  },
});
