import { useGlassAppearance } from './GlassAppearance';
import { AndroidGlassBottomTabs, AndroidGlassTab } from 'expo-android-glass-view';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** The navigator's tab bar: Kyant's glass tabs, driven by the navigation state. */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useGlassAppearance();
  const insets = useSafeAreaInsets();
  // Routes hidden with `href: null` reach a custom bar as `display: 'none'`.
  const routes = state.routes.filter(
    (route) =>
      StyleSheet.flatten(descriptors[route.key].options.tabBarItemStyle)?.display !== 'none'
  );
  const focusedKey = state.routes[state.index].key;

  return (
    <AndroidGlassBottomTabs
      theme={theme}
      selectedIndex={routes.findIndex((route) => route.key === focusedKey)}
      onTabSelected={(index) => {
        const route = routes[index];
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!event.defaultPrevented) navigation.navigate(route.name, route.params);
      }}
      style={[styles.bar, { bottom: insets.bottom + 12 }]}>
      {routes.map((route) => {
        const { options } = descriptors[route.key];
        return (
          <AndroidGlassTab
            key={route.key}
            label={options.title ?? route.name}
            labelStyle={{ color: theme === 'dark' ? '#fff' : '#151515' }}
            // The droplet tints the selected tab, so every icon is drawn in one colour.
            icon={options.tabBarIcon?.({
              focused: false,
              color: theme === 'dark' ? '#fff' : '#151515',
              size: 24,
            })}
          />
        );
      })}
    </AndroidGlassBottomTabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
});
