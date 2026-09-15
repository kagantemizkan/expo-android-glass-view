# Changelog

## 0.1.10 — 2026-09-15

### Added

- Optional `blurGradient="top-to-bottom"` on View, Button and BottomTabs: a spatial Gaussian
  blur that decreases linearly to zero at the bottom on Android 13+. Omission keeps uniform
  blur; Android 12 falls back to uniform blur and older platforms retain plain surfaces.

- `AndroidGlassMenu` and `AndroidGlassMenuProvider`: anchored, same-window glass menus with
  nested items, checkmarks, icons, separators, disabled/destructive actions and actions that
  keep the menu open. Includes safe-area positioning, overlap/below placement, Android Back
  handling, long-menu scrolling and plain iOS/web fallbacks.
- Custom interactive React menu content through `children` and optional `contentHeight`.
  Children replace native rows, scroll within the panel and follow the opening/closing morph.
- Optional `theme="light" | "dark"` on View, Button, Menu and BottomTabs, with light/dark
  material responses tuned against iOS references. Button, Menu and BottomTabs default to light.
- Optional BottomTabs glass props: `cornerRadius`, `blurRadius`, `refractionHeight`,
  `refractionAmount`, `chromaticAberration`, `depthEffect`, `vibrancy`, `highlight`, `shadow`,
  `tintColor`, `surfaceColor` and `fallbackColor`. They configure the bar surface; the selection
  droplet keeps its own optics. Removing overrides restores the defaults.
- Optional BottomTabs `opacity` prop (0–1), affecting the entire bar including icons and labels.
  When supplied it overrides `style.opacity`; existing styles continue to work when omitted.

### Changed

- Menu opening/closing morphs, finger-following deformation and release springs, animated
  row-snapped highlights, and submenu headers that animate into position. The backdrop stays
  anchored to screen coordinates throughout the morph.
- Button convenience labels follow the selected theme. Custom React text remains caller-styled.

### Fixed

- Opening or closing a menu no longer rebuilds the provider's native content wrapper, which
  could leave the menu and tab bar sampling an empty backdrop until the next scroll.
- Dark menu appearance now applies to the native background as well as its text.
- Menu highlights stay on selectable rows instead of appearing in gaps or panel padding.
- Touches and scrolling inside custom React menu content no longer dismiss the panel.

### Compatibility

- GlassView without `theme` retains its original untinted material: blur 2 dp, refraction
  height/amount 12/24 dp and vibrancy enabled. Explicit themes use 9 dp, 2/3 dp and vibrancy off.
- Toggle and Slider do not receive a theme prop and keep their existing appearance.
- Rebuild the native application to use the new menu and BottomTabs props; a JS-only update
  does not add these native capabilities.

## 0.1.9 — 2026-09-14

- Republish the 0.1.3 implementation with the updated README and npm-compatible demo image URLs.
- No runtime changes from 0.1.3; supersedes the 0.1.4–0.1.8 publications.

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
