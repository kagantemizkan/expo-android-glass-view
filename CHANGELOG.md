# Changelog

## Unreleased

- Fix: refresh glass backdrops when navigation replaces children in an inline-drawn container,
  or changes their visibility or drawing order. Tab bars no longer keep references to detached
  screens. Manually applied transforms and alpha are tracked too, including drawer movement.
  All glass components share this fix; referenced lists still scroll without re-capturing.
- `captureRevision` is now 4. Consumer apps need a native rebuild to receive this fix.

## 0.1.6 — 2026-09-12

- Fix: 0.1.4 and 0.1.5 were published without their compiled JavaScript (`build/`), so Metro
  failed with `Unable to resolve "expo-android-glass-view"`. The native code is the same as in
  0.1.5: an app whose native build already has 0.1.5 only needs the new JavaScript, no rebuild.
- `prepare` now fails when TypeScript emits nothing, so a package without its JavaScript can't be
  published again.

## 0.1.5 — 2026-09-12

- Performance: a glass view's capture leaves out everything that cannot reach it. Before, an
  animation anywhere on screen made every glass view re-render its blur and refraction on every
  frame; now only the glass views it can be seen through do. On a screen with 17 glass views over
  an animated backdrop (Helio G99, release build) this took the frame rate from about 20 to about
  70 fps. A left-out view that moves, resizes or scrolls triggers a new capture.

- Performance: scrolling no longer re-captures every glass view in the window. A glass view
  captures again only when a container whose scroll offset its capture baked in has scrolled;
  lists it merely references (e.g. a screen's list under a tab bar) scroll live for free.
- Performance: the drop shadow, inner shadow and rim highlight are only re-recorded when their
  shape or parameters change (not when they fade, and not on every redraw), and are skipped at
  zero alpha.

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
