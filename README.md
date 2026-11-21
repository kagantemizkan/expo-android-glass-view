# expo-android-glass-view

iOS 26 Liquid Glass for React Native on **Android**: a glass view, a tab bar with a droplet, a
toggle and a slider. The glass bends what is behind it at the rim, frosts it, tints it and
catches the light. It is tuned against iOS 26's own glass (`UIGlassEffect`) in light and dark.

On Android 17 QPR (SDK 37.2) and newer, the platform hands every view the pixels behind it.
On older devices, the glass draws the content you mark with `GlassBackdropSource` instead.

```tsx
import {
  AndroidGlassView,
  AndroidGlassTabs,
  AndroidGlassToggle,
  AndroidGlassSlider,
  GlassBackdropSource,
  getBackdropInfo,
} from 'expo-android-glass-view';
```

> [!NOTE]
> **2.0 is a rewrite.** The Jetpack Compose glass from 1.x is gone, and so are
> `AndroidGlassButton`, `AndroidGlassBottomTabs` / `AndroidGlassTab`, `AndroidGlassMenu` and the
> minimize-on-scroll helpers. See [Migrating from 1.x](#migrating-from-1x).

## Platforms

| Device                                | What you get                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| Android 17 QPR (SDK 37.2) and newer   | Full glass over anything behind it, no setup                                 |
| Android 13 and newer, below 37.2      | Full glass over the content of a `GlassBackdropSource`                       |
| Android 12 and older                  | A flat surface in `fallbackColor`                                            |
| Below 37.2 without a `backdropSource` | A flat surface in `fallbackColor`                                            |
| iOS, web                              | Plain views with the same props, so shared code runs                         |

It is a native module, so it needs a development build (it does not run in Expo Go) and the React Native New
Architecture. Built against Expo SDK 57 / React Native 0.86.

## Installation

```sh
npx expo install expo-android-glass-view
npx expo run:android
```

For bare React Native apps, [install Expo Modules](https://docs.expo.dev/bare/installing-expo-modules/) first.

## Quick start

Wrap what sits behind the glass in a `GlassBackdropSource`, give it a name, and point the glass
at that name. Put the glass next to the source, on top of it, never inside it.

```tsx
<View style={{ flex: 1 }}>
  <GlassBackdropSource name="screen" style={StyleSheet.absoluteFill}>
    <ScrollView>{/* photos, lists, anything */}</ScrollView>
  </GlassBackdropSource>

  <AndroidGlassView backdropSource="screen" cornerRadius={24} style={{ padding: 20 }}>
    <Text>On glass</Text>
  </AndroidGlassView>
</View>
```

On SDK 37.2 and newer, `backdropSource` is ignored and the glass sees the whole screen. Below
that, a glass without a source shows `fallbackColor`.

## `AndroidGlassView`

A container: its children draw on top of the glass and stay fully interactive.

```tsx
<AndroidGlassView backdropSource="screen" cornerRadius={999} style={{ padding: 16 }}>
  <Text>Capsule</Text>
</AndroidGlassView>

<AndroidGlassView backdropSource="screen" glassEffectStyle="clear" theme="dark" />

<AndroidGlassView backdropSource="screen" interactive onPress={save} cornerRadius={999}>
  <Text>Save</Text>
</AndroidGlassView>
```

Accepts every `View` prop plus:

| Prop               | Type                   | Default            | Description                                                                                            |
| ------------------ | ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| `backdropSource`   | `string`               | —                  | Name of the `GlassBackdropSource` behind the glass. Needed below SDK 37.2, ignored on newer devices.  |
| `cornerRadius`     | `number`               | `0`                | Corner radius in dp. Use a large value (e.g. `999`) for a capsule.                                    |
| `glassEffectStyle` | `"regular" \| "clear"` | `"regular"`        | `regular` is frosted with a surface tint; `clear` is lightly blurred and keeps the backdrop visible.   |
| `theme`            | `"light" \| "dark"`    | `"light"`          | Tint and fallback colours. Independent of the system theme.                                           |
| `blurRadius`       | `number`               | from the style     | Blur in dp. Regular uses 5.2 on small glass and more on tall glass, like iOS; clear uses 2.5.        |
| `refraction`       | `boolean`              | `true`             | The lens at the rim. `false` leaves blur and tint.                                                     |
| `tintColor`        | `ColorValue`           | from style + theme | Surface colour; its alpha is how strongly it covers the backdrop.                                     |
| `fallbackColor`    | `ColorValue`           | from `theme`       | Shown where there is no backdrop (see _Platforms_).                                                    |
| `interactive`      | `boolean`              | `false`            | Pressable glass: it swells, leans towards the finger, lights up under it and springs back on release. |
| `onPress`          | `() => void`           | —                  | Fired when a press on an `interactive` glass ends inside it.                                           |

Don't set `backgroundColor` on a glass view: it paints over the glass. Use `tintColor`.

## `AndroidGlassTabs`

A glass tab bar. A droplet marks the selected tab: tap a tab, drag the droplet, or scrub across
the bar. Each child is one tab, and the tabs share the width equally.

```tsx
const [tab, setTab] = useState(0);

<AndroidGlassTabs
  backdropSource="screen"
  selectedIndex={tab}
  onTabSelected={setTab}
  style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
  {tabs.map((t) => (
    <View key={t.label} style={{ alignItems: 'center' }}>
      <Ionicons name={t.icon} size={24} />
      <Text>{t.label}</Text>
    </View>
  ))}
</AndroidGlassTabs>
```

Takes the glass props of `AndroidGlassView`, except `interactive` and `onPress`, plus:

| Prop            | Type                      | Default      | Description                                                    |
| --------------- | ------------------------- | ------------ | -------------------------------------------------------------- |
| `selectedIndex` | `number`                  | —            | The selected tab. Without it, the bar keeps its own selection. |
| `onTabSelected` | `(index: number) => void` | —            | Fired when the user taps a tab or drops the droplet on one.    |
| `accentColor`   | `ColorValue`              | from `theme` | Colour of the selected tab's content under the droplet.        |

The bar is a 64dp capsule with a 4dp inset by default. The pressed droplet swells past the bar,
so leave a little room around it.

## `AndroidGlassToggle`

```tsx
<AndroidGlassToggle backdropSource="screen" value={on} onValueChange={setOn} />
```

| Prop             | Type                       | Default      | Description                                            |
| ---------------- | -------------------------- | ------------ | ------------------------------------------------------ |
| `value`          | `boolean`                  | `false`      | Controlled value.                                      |
| `onValueChange`  | `(value: boolean) => void` | —            | Fired on a tap, or when a drag ends on the other side. |
| `theme`          | `"light" \| "dark"`        | `"light"`    | Default colours.                                       |
| `accentColor`    | `ColorValue`               | iOS green    | Track colour when on.                                  |
| `trackColor`     | `ColorValue`               | from `theme` | Track colour when off.                                 |
| `backdropSource` | `string`                   | —            | What the pressed thumb's lens bends, below SDK 37.2.   |

## `AndroidGlassSlider`

```tsx
<AndroidGlassSlider
  backdropSource="screen"
  value={volume}
  onValueChange={setVolume}
  onSlidingComplete={save}
/>
```

| Prop                | Type                      | Default      | Description                                          |
| ------------------- | ------------------------- | ------------ | ---------------------------------------------------- |
| `value`             | `number`                  | `0`          | Controlled value.                                    |
| `minimumValue`      | `number`                  | `0`          |                                                      |
| `maximumValue`      | `number`                  | `1`          |                                                      |
| `onValueChange`     | `(value: number) => void` | —            | Called continuously while sliding.                   |
| `onSlidingComplete` | `(value: number) => void` | —            | Called once, when the finger lifts.                  |
| `theme`             | `"light" \| "dark"`       | `"light"`    | Default colours.                                     |
| `accentColor`       | `ColorValue`              | from `theme` | Filled part of the track.                            |
| `trackColor`        | `ColorValue`              | from `theme` | Empty part of the track.                             |
| `backdropSource`    | `string`                  | —            | What the pressed thumb's lens bends, below SDK 37.2. |

The slider ignores values the app echoes back after the finger lifts, so a controlled slider
does not jump back to an older value.

## `GlassBackdropSource`

Marks the content that glass views show below SDK 37.2.

| Prop   | Type     | Description                                   |
| ------ | -------- | --------------------------------------------- |
| `name` | `string` | The name glass views use in `backdropSource`. |

Plus every `View` prop. One source can serve any number of glass views. A glass inside its own
source would draw itself, so it shows nothing: keep glass views outside it.

## `getBackdropInfo()`

```ts
const { supported, sdkFull } = getBackdropInfo();
```

`supported` is true where the platform supplies the backdrop (SDK 37.2+); `sdkFull` is the
Android version, e.g. `"36.0"`. On iOS and web, `supported` is false.

## How it works

- **SDK 37.2 and newer:** each glass view gets a `RenderEffect` through
  `View.setBackdropRenderEffect`, and the system runs it on the pixels behind the view.
- **API 33 up to SDK 37.2:** `GlassBackdropSource` records its children into a `RenderNode` each
  time it draws. That node references the children's display lists rather than copying pixels,
  so a scrolling list or an animation behind the glass shows up without being recorded again.
  Each glass view draws the part of that node under itself into a node of its own and puts the
  effect on it.
- **The glass:** a blur, then an AGSL port of
  [arya3d/liquid-glass-webgpu](https://github.com/arya3d/liquid-glass-webgpu): the lens at the
  rim (a reflection across the glass's height, like a cylinder), a small colour split,
  saturation, the surface tint, a rim ring and Fresnel light. The presets were fitted to iOS 26
  pixels over the same backdrops.
- **Press:** `interactive` glass, the toggle and slider thumbs and the tab droplet follow the
  press behaviour of Kyant's LiquidButton and DampedDragAnimation: they swell, stretch in the
  direction of travel and settle with a spring.

## Performance

- Nothing redraws while nothing moves.
- Frosted glass blurs a quarter-size copy of its backdrop and scales it back up: a blurred image
  loses nothing at the lower resolution. Clear glass keeps the full size, because its lens
  magnifies detail at the rim.
- In the flat interior of the glass, the shader takes one sample instead of four.
- Shaders are compiled once and reused.

Glass costs GPU time on every frame where what is behind it changes, for example during a fast
scroll. On low-end devices, keep the number of glass views on screen moderate.

## Migrating from 1.x

| 1.x                                            | 2.0                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Glass sees the window without setup            | Below SDK 37.2, wrap the content in `GlassBackdropSource` and set `backdropSource`        |
| `AndroidGlassButton`                           | `AndroidGlassView` with `interactive` and `onPress`, its content as children              |
| `AndroidGlassBottomTabs` + `AndroidGlassTab`   | `AndroidGlassTabs` with plain views as tabs                                               |
| `AndroidGlassMenu`, `AndroidGlassMenuProvider` | Removed: use a JS menu or the platform menu                                               |
| `MinimizeOnScrollProvider` and its hooks       | Removed                                                                                   |
| `blurGradient`, `refractionHeight`, `refractionAmount`, `chromaticAberration`, `depthEffect`, `vibrancy`, `highlight`, `shadow`, `surfaceColor` | Replaced by `glassEffectStyle` (`regular` / `clear`), `refraction`, `blurRadius` and `tintColor` |

2.0 has no Jetpack Compose dependency. Rebuild the Android app or development client after
upgrading.

## Credits and licenses

- The glass shader is ported from
  [arya3d/liquid-glass-webgpu](https://github.com/arya3d/liquid-glass-webgpu) (MIT).
- The press, drag and droplet behaviour follows the Backdrop Catalog sample components of
  [Kyant0/AndroidLiquidGlass](https://github.com/Kyant0/AndroidLiquidGlass) (Apache 2.0).

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md). This package is licensed under Apache 2.0.
