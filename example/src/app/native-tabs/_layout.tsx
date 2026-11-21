import { useGlobalSearchParams } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect } from 'react';
import { Appearance } from 'react-native';

// Reference: the platform's own tab bar (iOS 26: UITabBar with Liquid Glass), over the same photos
// as the showcase, to compare with AndroidGlassTabs.
export default function NativeTabsLayout() {
  // `?theme=dark` forces the window's appearance (the app's Info.plist may pin Light).
  const { theme } = useGlobalSearchParams<{ theme?: string }>();
  useEffect(() => {
    Appearance.setColorScheme(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Icon sf="square.stack.fill" />
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gearshape.fill" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
