# Changelog

## 1.0.3 — 2026-11-19

### Fixed

- **`AndroidGlassBottomTabs`: a vertical swipe that started on the bar selected the tab under
  the finger** ([#1](https://github.com/kagantemizkan/expo-android-glass-view/issues/1)). The bar
  now tells the direction apart once the finger passes touch slop: a mostly horizontal move
  scrubs between tabs as before, a mostly vertical one is ignored and selects nothing on
  release.
- **A cancelled tab gesture committed the tab it was passing over**
  ([#2](https://github.com/kagantemizkan/expo-android-glass-view/issues/2)). When the system or
  another touch handler cancels a scrub on the bar or a drag of the droplet, the droplet now
  slides back to the selected tab and `onTabSelected` is not called.

### Compatibility

- Rebuild the Android app or development client; this is a native change. iOS and web are
  unchanged.

## 1.0.2 — 2026-10-18

### Fixed

- **1.0.1 crashed on Android when a menu opened or closed** (`UnsupportedOperationException:
  Only CornerBasedShape is supported in lens effects`): it handed the menu's drop-shaped
  silhouette to the glass lens, which only accepts rounded rectangles. The glass is drawn
  exactly as in 1.0.0 again. The drop shadow is now a separate layer behind it, with the
  same position, size, scale and fade, so it stays visible without touching the glass.
  Do not use 1.0.1.

### Compatibility

- Rebuild the Android app or development client; this is a native change.

## 1.0.1 — 2026-10-18

### Fixed

- `AndroidGlassMenu` now draws its drop shadow. The menu's animation layer clipped everything
  inside it to the menu's shape, including the shadow, so `shadow` and `shadowOpacity` had no
  visible effect. The glass surface now clips itself and the animation layer only scales and
  fades, so the shadow shows around the menu and follows its opening animation.

### Compatibility

- Rebuild the Android app or development client; this is a native change. iOS and web are
  unchanged.

## 1.0.0 — 2026-09-21

### Changed

- **Breaking:** `AndroidGlassMenu` defaults to action rows without a leading checkmark slot.
  Set `isSelectMenu` on selection menus to display `checked` items and reserve the slot,
  including in nested rows. Rebuild the Android app or development client for this native prop.

## 0.1.11 — 2026-09-21

### Added

- `AndroidGlassMenu` standard rows now accept a decorative React element as `icon`, such as
  `<Ionicons />`, alongside the existing native glyph names. Custom icons render inside the
  glass surface and follow its opening, scrolling and submenu animations without replacing
  native row selection.
- `AndroidGlassMenu` now accepts `shadow={false}` to remove its Android drop shadow and
  `shadowOpacity` (0–1) to set its strength. Both affect the root and nested menu surfaces,
  including menus with custom React content. The existing light/dark defaults are unchanged.

### Compatibility

- Rebuild the Android app or development client for these native menu capabilities; a JS-only
  update is not enough. iOS and web continue to use plain menu fallbacks.

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
