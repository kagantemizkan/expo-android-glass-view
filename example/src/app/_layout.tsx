import { GlassAppearanceProvider } from '@/components/GlassAppearance';
import { AndroidGlassMenuProvider } from 'expo-android-glass-view';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlassAppearanceProvider>
        <AndroidGlassMenuProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="details" />
          </Stack>
        </AndroidGlassMenuProvider>
      </GlassAppearanceProvider>
    </GestureHandlerRootView>
  );
}
