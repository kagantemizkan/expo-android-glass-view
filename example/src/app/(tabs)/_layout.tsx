import Ionicons from "@expo/vector-icons/Ionicons";
import { MinimizeOnScrollProvider } from "expo-android-glass-view";
import { Tabs } from "expo-router";

import { GlassTabBar } from "@/components/GlassTabBar";

export default function TabsLayout() {
  return (
    // Shares the minimize state between the tab bar and every screen's list.
    <MinimizeOnScrollProvider>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <GlassTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="controls"
          options={{
            title: "Controls",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="options" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="gallery"
          options={{
            title: "Gallery",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="images" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="pokelist"
          options={{
            title: "Pokémon List",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </MinimizeOnScrollProvider>
  );
}
