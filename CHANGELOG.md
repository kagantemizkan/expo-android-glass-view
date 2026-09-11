# Changelog

## 0.1.3 — 2026-09-11

- Fix a crash when navigating to or from a screen that has a glass view (Expo Router and React
  Navigation on react-native-screens): `IllegalStateException: Cannot locate windowRecomposer … is
  not attached to a window`. React Native measures views that are not attached to the window —
  a pushed screen or a tab opened for the first time, before react-native-screens attaches it, or
  a screen it has detached — and measuring the glass layer there made Compose look for the
  window. The glass layer is now skipped while detached and sized when it attaches.
- `captureRevision` is now 3.

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
