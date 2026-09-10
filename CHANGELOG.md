# Changelog

## 0.1.0 — 2026-09-10

First release.

- `AndroidGlassView`: a Liquid Glass container (blur, lens refraction, vibrancy, highlight, shadow)
  whose backdrop is the live React Native screen behind it.
- `AndroidGlassButton`, `AndroidGlassToggle`, `AndroidGlassSlider`, `AndroidGlassBottomTabs` and
  `AndroidGlassTab`: Kyant's Backdrop Catalog components, driven from React Native.
- `useMinimizeOnScroll` and the tab bar's `minimized` prop: the tab bar shrinks while a list
  scrolls down and comes back on scroll up or touch, like iOS 26. Animated natively.
- iOS and web: plain fallbacks with the same API.
