import type { GlassTheme } from 'expo-android-glass-view';
import { createContext, useContext, useState, type ReactNode } from 'react';
const AppearanceContext = createContext<{
  theme: GlassTheme;
  setTheme: (theme: GlassTheme) => void;
}>({ theme: 'light', setTheme: () => {} });
export function GlassAppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<GlassTheme>('light');
  return (
    <AppearanceContext.Provider value={{ theme, setTheme }}>{children}</AppearanceContext.Provider>
  );
}
export const useGlassAppearance = () => useContext(AppearanceContext);
