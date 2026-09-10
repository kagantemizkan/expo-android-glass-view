# Changelog

## 0.1.2 — 2026-09-10

- Fix a crash when a glass view sits inside a react-native-screens stack (Expo Router and React
  Navigation native stacks): `IllegalStateException: Recording currently in progress`. While a
  glass view captures its backdrop, its ancestors are still being drawn; the capture no longer
  calls their `draw()` again but draws their background and children itself.
- New native constant `captureRevision` (2), so JS can tell a fixed binary from an older one.

## 0.1.0 — 2026-09-10

First release.

- `AndroidGlassView`: a Liquid Glass container (blur, lens refraction, vibrancy, highlight, shadow)
  whose backdrop is the live React Native screen behind it.
- `AndroidGlassButton`, `AndroidGlassToggle`, `AndroidGlassSlider`, `AndroidGlassBottomTabs` and
  `AndroidGlassTab`: Kyant's Backdrop Catalog components, driven from React Native.
- Minimize on scroll: the tab bar shrinks while a list scrolls down and comes back on scroll up or
  touch, like iOS 26. Animated natively. `MinimizeOnScrollProvider` + `useMinimizeOnScrollHandler`
  share it across a navigator's screens; `useMinimizeOnScroll` and the `minimized` prop cover a
  single component.
- iOS and web: plain fallbacks with the same API.
