<p align="center">
  <img src="https://raw.githubusercontent.com/kagantemizkan/expo-android-glass-view/5a563ac/.github/assets/hero.png" alt="Liquid Glass — expo-android-glass-view" width="1040" />
</p>

# expo-android-glass-view

Liquid Glass for React Native on **Android**: real refraction, blur, vibrancy and rim
highlights behind any React content, rendered with Jetpack Compose — plus ready-made glass
buttons, toggles, sliders, a bottom tab bar and anchored menus.

The glass effects and the components come from
[Kyant0/AndroidLiquidGlass](https://github.com/Kyant0/AndroidLiquidGlass). The part that lets
the glass see the React Native screen behind it is adapted from
[QWEA0/Liquid-Glass-Android](https://github.com/QWEA0/Liquid-Glass-Android).

> [!WARNING]
> **⚠️ EXPERIMENTAL — NOT PRODUCTION READY**
>
> This is an early **0.1 release**. APIs, behavior and native implementation may change before `1.0`.
> **Use it for experiments and prototypes, not production apps yet.**

```tsx
import {
  AndroidGlassView,
  AndroidGlassButton,
  AndroidGlassToggle,
  AndroidGlassSlider,
  AndroidGlassBottomTabs,
  AndroidGlassTab,
  AndroidGlassMenu,
  AndroidGlassMenuProvider,
  MinimizeOnScrollProvider,
  useMinimizeOnScrollHandler,
  useMinimizeOnScroll,
} from 'expo-android-glass-view';
```

Glass components sample what is drawn behind them in the same window, keeping up with
scrolling lists, animations and layout changes. View, Button, Toggle, Slider and BottomTabs
need no provider. Menus require `AndroidGlassMenuProvider` above the navigator.

Version **0.1.10** adds anchored menus with custom React content, optional light/dark materials,
and configurable tab bar glass effects.
See [CHANGELOG.md](./CHANGELOG.md) for the release notes.

## Platforms

| Platform               | Result                                                        |
| ---------------------- | ------------------------------------------------------------- |
| Android 13+ (API 33)   | Full effect: refraction, chromatic aberration, blur, vibrancy |
| Android 12 (API 31–32) | Blur and vibrancy, no refraction (needs AGSL runtime shaders) |
| Android 11 and older   | Plain translucent surface (`fallbackColor`)                   |
| iOS, web               | Same components, plain fallbacks with the same API — no crash |

Requires a development build (it is a native module, so it does not run in Expo Go) and the
React Native New Architecture. Built against Expo SDK 57 / React Native 0.86.

## Installation

```sh
npx expo install expo-android-glass-view
npx expo run:android
```

For bare React Native apps, [install Expo Modules](https://docs.expo.dev/bare/installing-expo-modules/) first.

When upgrading to 0.1.10, rebuild your native app or development client. The new menu and
BottomTabs props require the matching native binary; updating JavaScript alone is insufficient.

## `AndroidGlassView`

A container: children render on top of the glass and stay fully interactive.

```tsx
<AndroidGlassView style={{ padding: 20 }} cornerRadius={24}>
  <Text>Anything</Text>
</AndroidGlassView>
```

<img src="https://raw.githubusercontent.com/kagantemizkan/expo-android-glass-view/5a563ac/.github/assets/glasses.gif" alt="AndroidGlassView with different props: default, frosted, lens, prism, tint, no shadow" width="480" />

Accepts every `View` prop plus:

| Prop                  | Type                | Default                                            | Description                                                                                                                                   |
| --------------------- | ------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme`               | `"light" \| "dark"` | omitted                                            | Optional appearance; omission preserves the original untinted glass.                                                                          |
| `cornerRadius`        | `number`            | `style.borderRadius`, else `24`                    | Corner radius of the glass shape in dp. Use a large value (e.g. `999`) for a capsule.                                                         |
| `blurRadius`          | `number`            | `2` unthemed / `9` themed                          | Backdrop blur in dp. `0` disables it.                                                                                                         |
| `blurGradient`        | `"top-to-bottom"`   | omitted                                            | Android 13+: blur decreases linearly from `blurRadius` at the top to zero at the bottom. Omit for uniform blur; Android 12 uses uniform blur. |
| `refractionHeight`    | `number`            | `12` unthemed / `2` themed                         | Width of the refracting rim in dp. `0` disables refraction.                                                                                   |
| `refractionAmount`    | `number`            | `24` unthemed / `3` themed                         | How far content is bent at the rim, in dp.                                                                                                    |
| `chromaticAberration` | `boolean`           | `false`                                            | Split the refraction per colour channel (prism fringe).                                                                                       |
| `depthEffect`         | `boolean`           | `false`                                            | Stronger, depth-like bending towards the rim.                                                                                                 |
| `vibrancy`            | `boolean`           | `true` unthemed / `false` themed                   | Boost the saturation of what is behind the glass.                                                                                             |
| `highlight`           | `boolean`           | `true`                                             | Specular highlight along the rim.                                                                                                             |
| `shadow`              | `boolean`           | `true`                                             | Soft drop shadow around the shape.                                                                                                            |
| `tintColor`           | `ColorValue`        | —                                                  | Colour tint mixed into the glass.                                                                                                             |
| `surfaceColor`        | `ColorValue`        | —                                                  | Flat colour painted over the glass, on top of the refraction.                                                                                 |
| `fallbackColor`       | `ColorValue`        | `#242b33` dark / `rgba(255,255,255,0.7)` otherwise | Surface used where the effect cannot run (see _Platforms_).                                                                                   |

Don't set `backgroundColor` on a glass view — it would paint over the effect. Use `tintColor`
or `surfaceColor` instead.

## `AndroidGlassButton`

Kyant's liquid button: while pressed, the glass swells, stretches towards the finger and a
highlight follows it.

<img src="https://raw.githubusercontent.com/kagantemizkan/expo-android-glass-view/5a563ac/.github/assets/buttons.gif" alt="AndroidGlassButton" width="480" />

```tsx
<AndroidGlassButton title="Save" onPress={save} />
<AndroidGlassButton title="Continue" tintColor="#0088FF" onPress={next} />
<AndroidGlassButton surfaceColor="rgba(255, 255, 255, 0.3)" onPress={share}>
  <Ionicons name="share-outline" size={18} />
  <Text>Share</Text>
</AndroidGlassButton>
```

Takes every `AndroidGlassView` prop, with `theme="light"` and a capsule corner radius by default, plus:

| Prop          | Type         | Default | Description                                                 |
| ------------- | ------------ | ------- | ----------------------------------------------------------- |
| `onPress`     | `() => void` | —       | Called on tap.                                              |
| `title`       | `string`     | —       | Convenience label (15 sp; white with dark theme or a tint). |
| `titleStyle`  | `TextStyle`  | —       | Style for `title`.                                          |
| `interactive` | `boolean`    | `true`  | Press and drag deformation.                                 |

The default size is 48 dp high with 16 dp horizontal padding; override it with `style`. The
children are drawn _inside_ the glass (clipped to it, deformed with it), so they are decorative:
don't put interactive elements in a button.

## `AndroidGlassToggle`

<img src="https://raw.githubusercontent.com/kagantemizkan/expo-android-glass-view/5a563ac/.github/assets/toggles.gif" alt="AndroidGlassToggle" width="480" />

```tsx
<AndroidGlassToggle value={enabled} onValueChange={setEnabled} />
```

| Prop            | Type                       | Default          | Description                                                   |
| --------------- | -------------------------- | ---------------- | ------------------------------------------------------------- |
| `value`         | `boolean`                  | `false`          |                                                               |
| `onValueChange` | `(value: boolean) => void` | —                | Called on tap or when the thumb is dropped on the other side. |
| `accentColor`   | `ColorValue`               | iOS green        | Track colour when on.                                         |
| `trackColor`    | `ColorValue`               | translucent grey | Track colour when off.                                        |

The track is 64 × 28 dp; the thumb turns into refracting glass and grows past it while dragged.

Use it controlled (`value` + `onValueChange`). A `value` prop only wins once JS has handled every
change made on the switch, so quick taps never make it flicker; if `onValueChange` doesn't take the
new value, the switch returns to `value`.

## `AndroidGlassSlider`

<img src="https://raw.githubusercontent.com/kagantemizkan/expo-android-glass-view/5a563ac/.github/assets/sliders.gif" alt="AndroidGlassSlider" width="480" />

```tsx
<AndroidGlassSlider value={volume} maximumValue={100} onValueChange={setVolume} />
```

| Prop                            | Type                      | Default          | Description                                                    |
| ------------------------------- | ------------------------- | ---------------- | -------------------------------------------------------------- |
| `value`                         | `number`                  | `0`              |                                                                |
| `minimumValue` / `maximumValue` | `number`                  | `0` / `1`        |                                                                |
| `onValueChange`                 | `(value: number) => void` | —                | Called continuously while dragging.                            |
| `onSlidingComplete`             | `(value: number) => void` | —                | Called when the finger is lifted, or after a tap on the track. |
| `accentColor`                   | `ColorValue`              | system blue      | Filled part of the track.                                      |
| `trackColor`                    | `ColorValue`              | translucent grey | Unfilled part of the track.                                    |

It stretches to the width of its parent and is 36 dp high by default.

Use it controlled (`value` + `onValueChange`). While a finger is on the slider it is driven
natively, and after that a `value` prop only wins once JS has handled every event the slider sent
(the handshake React Native's `TextInput` uses). So an older value never pulls the thumb back, even
on a slow JS thread, and a value you set in `onSlidingComplete` (a rounded one, say) still wins.

## `AndroidGlassBottomTabs` and `AndroidGlassTab`

Kyant's iOS 26 style tab bar: a glass capsule with a liquid selection droplet you can drag
between tabs. Under the droplet the tab content takes the accent colour and is magnified while
pressed.

All glass surface options are optional: `cornerRadius`, `blurRadius`, `blurGradient`, `refractionHeight`,
`refractionAmount`, `chromaticAberration`, `depthEffect`, `vibrancy`, `highlight`,
`shadow`, `tintColor`, `surfaceColor`, and `fallbackColor`. Omitted options preserve
existing theme defaults and the capsule shape. Removing an override restores its default.
These options affect the bar surface; the selection droplet retains its own optics.
`containerColor` is painted above tint/surface colours. On iOS/web, optical effects are
unavailable; the fallback uses the supplied colours and corner radius.

`opacity` (0–1) fades the entire bar including icons and labels. It overrides
`style.opacity` only when supplied; otherwise the style works as before.

```tsx
<AndroidGlassBottomTabs
  theme="dark"
  opacity={0.85}
  blurRadius={16}
  refractionHeight={8}
  refractionAmount={12}
  chromaticAberration
  shadow={false}>
  <AndroidGlassTab label="Home" />
  <AndroidGlassTab label="Search" />
</AndroidGlassBottomTabs>
```

<img src="https://raw.githubusercontent.com/kagantemizkan/expo-android-glass-view/5a563ac/.github/assets/tabbar.gif" alt="AndroidGlassBottomTabs" width="480" />

```tsx
<AndroidGlassBottomTabs
  selectedIndex={tab}
  onTabSelected={setTab}
  style={{ position: 'absolute', left: 24, right: 24, bottom: 32 }}>
  <AndroidGlassTab label="Home" icon={<Ionicons name="home" size={24} />} />
  <AndroidGlassTab label="Search" icon={<Ionicons name="search" size={24} />} />
  <AndroidGlassTab label="Profile" icon={<Ionicons name="person" size={24} />} />
</AndroidGlassBottomTabs>
```

| Prop                | Type                           | Default                   | Description                                                                                 |
| ------------------- | ------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `theme`             | `"light" \| "dark"`            | `"light"`                 | Glass appearance, independent of the system.                                                |
| `opacity`           | `number`                       | `style.opacity`, else `1` | Whole bar opacity, including icons and labels; clamped to 0–1.                              |
| `cornerRadius`      | `number`                       | capsule                   | Explicit bar radius in dp.                                                                  |
| `selectedIndex`     | `number`                       | `0`                       |                                                                                             |
| `onTabSelected`     | `(index: number) => void`      | —                         | Called on tap, or when the droplet is dropped on a tab.                                     |
| `minimized`         | `boolean`                      | `false`                   | Minimized look: shorter and narrower, labels faded out. Animated. See _Minimize on scroll_. |
| `onMinimizedChange` | `(minimized: boolean) => void` | —                         | Called with `false` when the user expands the minimized bar by touching it.                 |
| `accentColor`       | `ColorValue`                   | system blue               | Colour of the selected tab's content.                                                       |
| `containerColor`    | `ColorValue`                   | theme material            | Colour of the glass bar.                                                                    |

Each child is one tab (equal widths). `AndroidGlassTab` is an icon over a 12 sp label, but any
view works — as with buttons, the tabs are drawn inside the glass, so keep them decorative. The
bar is 64 dp high by default.

Use it controlled (`selectedIndex` + `onTabSelected`). A `selectedIndex` prop only wins once JS has
handled every selection made on the bar, so on quick taps or a busy JS thread the droplet never
jumps back to a tab the user already left. If `onTabSelected` doesn't take the new index, the
droplet returns to `selectedIndex`.

### Minimize on scroll

Added by this package, on top of Kyant's tab bar: the bar can shrink while the user scrolls
down a list, and come back when they scroll up, get back to the top or touch it. It gets shorter and narrower; every tab keeps its
first child (the icon) while the rest (the label) fades out.

Wrap the bar and the screens in `MinimizeOnScrollProvider`, and give each list the handler from
`useMinimizeOnScrollHandler`:

```tsx
<MinimizeOnScrollProvider>
  {/* your navigator, or screens + AndroidGlassBottomTabs */}
</MinimizeOnScrollProvider>

// In any screen:
const onScroll = useMinimizeOnScrollHandler();
<FlatList onScroll={onScroll} scrollEventThrottle={16} … />
```

Inside the provider, `AndroidGlassBottomTabs` follows the shared state by itself (unless you pass
`minimized`). Each list tracks its own scroll position, and a screen isn't re-rendered when the
bar minimizes. The scroll position is read in JS, where the list lives; only the resulting flag
goes to the native side, where the animation runs. Any list that reports `onScroll` works
(ScrollView, FlatList, SectionList, FlashList…); if you already have an `onScroll`, call the
handler from it.

When the list and the bar are in the same component, `useMinimizeOnScroll` alone is enough:

```tsx
const { minimized, setMinimized, onScroll } = useMinimizeOnScroll();

<ScrollView onScroll={onScroll} scrollEventThrottle={16}>…</ScrollView>
<AndroidGlassBottomTabs minimized={minimized} onMinimizedChange={setMinimized} …>…</AndroidGlassBottomTabs>
```

The iOS and web fallbacks don't minimize; there, `useMinimizeOnScrollHandler` returns `undefined`.

### With Expo Router or React Navigation

The bar doesn't navigate by itself: use it as the navigator's `tabBar`, driven by the navigation
state. Tap vetoes (`tabPress` with `preventDefault`) send the droplet back.

```tsx
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';
import {
  AndroidGlassBottomTabs,
  AndroidGlassTab,
  MinimizeOnScrollProvider,
} from 'expo-android-glass-view';

function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // Routes hidden with `href: null` reach a custom bar as `display: 'none'`.
  const routes = state.routes.filter(
    (route) =>
      StyleSheet.flatten(descriptors[route.key].options.tabBarItemStyle)?.display !== 'none'
  );
  const focusedKey = state.routes[state.index].key;
  return (
    <AndroidGlassBottomTabs
      selectedIndex={routes.findIndex((route) => route.key === focusedKey)}
      onTabSelected={(index) => {
        const route = routes[index];
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!event.defaultPrevented) navigation.navigate(route.name, route.params);
      }}
      style={{ position: 'absolute', left: 24, right: 24, bottom: 32 }}>
      {routes.map((route) => {
        const { options } = descriptors[route.key];
        return (
          <AndroidGlassTab
            key={route.key}
            label={options.title ?? route.name}
            // The droplet tints the selected tab, so draw icons in one neutral colour.
            icon={options.tabBarIcon?.({ focused: false, color: '#000000', size: 24 })}
          />
        );
      })}
    </AndroidGlassBottomTabs>
  );
}

export default function TabLayout() {
  return (
    <MinimizeOnScrollProvider>
      <Tabs tabBar={(props) => <GlassTabBar {...props} />} />
    </MinimizeOnScrollProvider>
  );
}
```

The bar floats over the screens, so give their content some bottom padding. With React
Navigation, the same component works as `createBottomTabNavigator`'s `tabBar`.

## `AndroidGlassMenu`

<img src="https://raw.githubusercontent.com/kagantemizkan/expo-android-glass-view/main/.github/assets/menu.gif" alt="AndroidGlassMenu: opening, row highlight transitions and nested menus in dark mode" width="480" />

An anchored glass action menu with independent position, size and corner motion,
refracted labels, a selection pill that snaps to rows, checkmarks, separators and
disabled/destructive actions. The backdrop stays in screen coordinates while the
surface grows. Its surface stretches and moves toward the finger, then springs
back on release. The selection pill springs between row-aligned positions and
adapts to each row's height. It disappears when the finger is over separators,
headings, disabled rows or the panel's padding.
The menu renders in the same window as the screen, through a provider above the
navigator. It does not use React Native `Modal`.

```tsx
import { useRef, useState } from 'react';
import { View } from 'react-native';
import {
  AndroidGlassButton,
  AndroidGlassMenu,
  AndroidGlassMenuProvider,
} from 'expo-android-glass-view';

// At your application root:
// <AndroidGlassMenuProvider><YourNavigator /></AndroidGlassMenuProvider>

function SortMenu() {
  const anchorRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [sort, setSort] = useState('recent');
  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <AndroidGlassButton title="Sort" onPress={() => setVisible(true)} />
      </View>
      <AndroidGlassMenu
        visible={visible}
        anchorRef={anchorRef}
        items={[
          { id: 'recent', title: 'Most recent', checked: sort === 'recent' },
          { id: 'name', title: 'Name', checked: sort === 'name' },
        ]}
        onSelect={setSort}
        onDismiss={() => setVisible(false)}
      />
    </>
  );
}
```

`visible`, `anchorRef` and `onDismiss` are required. For native rows, supply `items` and `onSelect`. Set
`visible` to false in `onDismiss`, which runs on a dismissing selection or when
outside press / Android Back closes the root menu. `onSelect` receives the chosen item's unique `id`. Each item supports
`title`, `checked`, `disabled`, `destructive`, and `separator` (before the row).

Optional `width` defaults to 250 dp. `theme` is `light` or `dark` and defaults to
`light`. Pass safe-area `insets` (`top`, `right`, `bottom`, `left`) if the provider
covers system bars; omitted edges use 12 dp. Position is measured on opening and
window-size changes. The default `placement="overlap"` expands over the trigger,
aligned just beyond its right edge; `placement="below"` opens underneath. Both are
clamped to the provider bounds and flip above the trigger when needed. Keep the trigger stationary while open.

Items can include `children` (another item array). On Android, a front surface grows
from the selected row and leaves the parent visible behind it. Its header, a tap
on the parent, an outside press, or Android Back collapses it. There is no extra
back row on Android. Selecting a leaf calls `onSelect` with its id. Set
`keepsMenuPresented` on toggles and repeated actions to keep the menu open while
updating their checked state. `compact` uses a smaller row and `sectionTitle` adds
a muted heading. `icon` supports grid, heart, adjustments, photo, video, screenshot,
album, zoom-in, zoom-out, aspect and people glyphs.

Use `\n` for a two-line title; those rows receive extra height. If hiding the
trigger during the morph, keep its layout and ref mounted and restore it in
`onDismissed`, after the closing animation finishes. `sourceIcon="sort"` retains
the sort glyph during that transition. Decorative View groups inside a glass
button should use `pointerEvents="none"`. The provider keeps its last native panel
hidden and non-interactive after closing so its GPU programs stay ready.

Only one menu should be visible per provider. Tall menus reveal rows when dragged
along their upper/lower edge and support accessibility scrolling with TalkBack.
Dragging directly from the opening button into the menu is not part of this API. iOS and web use a plain scrollable
menu with the same selection API. On Android the animation follows system animator
duration settings.

### Custom React menu content

Pass `children` to replace the native action rows with live React content. `contentHeight`
sets the panel height in dp (default 240, including 16 dp content padding on each edge); it
is clamped to the available screen space, and overflowing content scrolls. When children
are present, `items` are ignored and `onSelect` is not used. Dismiss from a custom control by
setting `visible` to false; outside press and Android Back also dismiss.

```tsx
<AndroidGlassMenu
  visible={open}
  anchorRef={anchor}
  theme="dark"
  contentHeight={300}
  onDismiss={() => setOpen(false)}>
  <Text style={{ color: 'white' }}>Custom controls</Text>
  <Switch value={enabled} onValueChange={setEnabled} />
  <Pressable onPress={() => setOpen(false)}>
    <Text style={{ color: 'white' }}>Done</Text>
  </Pressable>
</AndroidGlassMenu>
```

The native glass retains its opening/closing morph; React children follow its scale, position
and fade, while retaining native touch responders and accessibility. Custom content does not
use native row snapping or the native label refraction shader. Style child text for the selected
theme yourself. Components render in the provider's React context, so place any context providers
needed by custom children above `AndroidGlassMenuProvider`.

## Colours and dark mode

View, Button, Menu and BottomTabs accept optional `theme="light" | "dark"`. Button, Menu and BottomTabs default to `light`. GlassView without a theme keeps its original untinted material; it does not select a theme automatically.
The material is tuned against the supplied iOS recordings: light has a milky translucent
colour response, dark retains a subdued charcoal response. View, Button, Menu and the tab
bar share the resting material; their shapes and interaction animations remain independent.
Toggle and Slider do not accept a theme prop and are unchanged by the glass appearance setting.

View/Button/BottomTabs effect overrides remain supported and survive theme changes. Removing an
override restores its default. The themed material uses blur 9 dp, refraction 2 / 3 dp and vibrancy off. Unthemed GlassView uses its original blur 2 dp, refraction 12 / 24 dp and vibrancy on. Removing its theme restores that material, including its original highlight and shadow. Button labels follow the appearance; custom child text colours are yours.
Fallback platforms use plain theme-aware surfaces.

## Gestures

The components look exactly like Kyant's samples, but take touches over a larger area:

- **Slider:** pressing anywhere on it moves the thumb under the finger (Kyant's sample only drags
  the thumb and jumps on taps).
- **Tab bar:** a tap selects the tab under the finger, like Kyant's sample. A horizontal drag that
  starts anywhere on the bar pulls the droplet under the finger and scrubs between tabs; releasing
  selects the nearest tab. Dragging the droplet itself works as before.
- **Toggle:** the whole switch takes taps and drags, not only the thumb.

Toggles, sliders and the tab bar also claim horizontal drags: once a drag on them turns out to be
horizontal, a parent `ScrollView` no longer takes it over, and React Native's JS touch handlers
are told a native gesture started. Vertical drags still scroll.

## How it works

Every glass view takes a live snapshot of what is drawn behind it, runs it through a
GPU lens (blur, refraction, vibrancy) and draws the result in its own shape.

### A Compose layer inside a React Native view

Each glass component is a React Native view (`GlassHostView`) whose first child is a Jetpack
Compose view drawing Kyant's `drawBackdrop` modifier. Your React children are regular React
Native views on top of that layer. Button and BottomTabs content is drawn _inside_ the glass
so it follows their deformation; custom menu children remain interactive React views.

### Seeing the React Native screen behind it

Kyant's library can only see Compose content behind a glass. Here the backdrop is the Android
view tree of the window — your React Native screen — captured with an approach adapted from
[QWEA0/Liquid-Glass-Android](https://github.com/QWEA0/Liquid-Glass-Android):

1. The glass records the area of the window around itself (plus a 32 dp margin for blur and for
   glass that grows while pressed) into a `RenderNode`.
2. Its own ancestors are being drawn at that very moment, and calling their `draw()` again would
   crash, so their background and children are drawn one by one instead, in their real drawing
   order (`zIndex` included).
3. Every other subtree is recorded as a _reference_ to its RenderNode rather than as pixels, so
   when content behind the glass animates, the glass shows it without capturing again.
4. Other glass views are left out of the capture, except the glass's own ancestors: a toggle on
   a glass card sees the card. This rules out cycles (glass A → glass B → glass A).
5. So is everything that cannot reach the glass (its bounds plus a small margin, and those of its
   descendants): a live reference to it would make the glass re-render — capture, blur and
   refraction — whenever it changes, even though none of it shows through the glass.

### The effects

The capture goes through Kyant's effect chain on the GPU: blur (`RenderEffect`, Android 12+),
refraction at the rim (an AGSL runtime shader, Android 13+) with optional chromatic aberration,
vibrancy, a rim highlight and a drop shadow. Where these APIs are missing, the glass falls back
to a flat `fallbackColor` surface.

### When it captures again

The capture is cached in one RenderNode with its own GPU layer, and every glass layer of a view
(the tab bar has three) samples that same texture. It is recorded again only when:

- the glass moves on screen (layout, transform, dragging),
- a container it draws inline scrolls: one of its own ancestors, one of their direct children,
  or a container that holds other glass views. A list that is simply behind the glass (deeper in
  another branch, with no glass inside) is referenced, so it scrolls live without a new capture,
- an inline container's direct children change (including screen replacement, visibility and
  drawing order), or a child whose transform is drawn inline moves, resizes or changes alpha,
- a view it left out because it was too far away moves, resizes or scrolls,
- a glass view is added or removed.

A glass view that is off screen waits until it is visible again. Pressing or dragging a glass
control only re-runs the GPU effects, not the capture.

### Controlled props

Toggles, sliders and the tab bar are dragged natively. So that a late `value` from JS never
pulls the thumb back, a prop only wins once JS has handled every event the control sent — the
handshake React Native's `TextInput` uses.

### Minimize on scroll

JS decides the direction (`useMinimizeOnScrollHandler`) and sends the bar a single boolean; the
shrinking itself is animated natively in Compose. The provider shares that state between every
screen.

## Performance

The glass costs nothing while nothing moves. It costs when what is behind a glass view changes:
that glass view then runs its blur and refraction again on the GPU. Changes elsewhere on the
screen don't count, because each glass view only captures what can reach it (see _Seeing the
React Native screen behind it_).

Earlier baseline measurements with `adb shell dumpsys gfxinfo` and `atrace` on a release build
(no new 0.1.10 performance benchmark), on a mid-range phone:
Xiaomi 24117RN76E, MediaTek Helio G99, Android 16, 120 Hz.

| Screen                                                                  | Glass views | Result                                                                  |
| ----------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| Static screen, nothing moving                                           | 3           | 0 frames rendered while idle                                            |
| Scrolling a list under a glass header, a glass button and the tab bar   | 3           | no missed frames; 90% of frames within 14 ms                            |
| 6 glass tiles over an animated backdrop, plus glass panels and controls | 17          | about 70 fps, no missed frames; the RenderThread needs ~14 ms per frame |

In practice:

- A glass header, a tab bar and a few glass controls on a scrolling screen stay smooth.
- What adds up is the number of glass views whose backdrop changes in the same frame — glass
  over an animation, or glass that scrolls. On mid-range GPUs, keep those to a handful; glass
  elsewhere on the screen doesn't add to it.
- Don't put a glass view inside every item of a long list: each visible item captures and
  redraws on every scroll frame.
- Glass views scrolled out of view don't capture again until they are visible.
- On Android 11 and older the glass is a flat surface and costs nothing extra.

## Limitations

- **Glass does not show other glass views** behind it, unless it sits inside them.
- Inside a container that holds a glass view, branches containing glass are drawn after their
  siblings in the backdrop, so z-order can differ from the screen in that case.
- Content drawn well outside its view's bounds (more than about 8 dp, e.g. a large box shadow)
  may be missing behind glass that the view itself is away from, and so may content that a
  distant view animates towards the glass without moving itself.
- `SurfaceView`-based content (most video players, camera previews, some maps) is not part of the
  view tree's drawing and shows up empty behind the glass. `TextureView` content works.
- A React Native `Modal` is a separate window, so glass inside it only sees the modal's content.

### Android overscroll stretch

Repeatedly scrolling past the edge of a list can leave the sampled backdrop shifted inside a
fixed glass header. This has been reproduced with Android's overscroll stretch effect; the
header itself stays in place while the image inside the glass drifts.

Set `overScrollMode="never"` on the `ScrollView` or `FlatList` behind the glass to avoid this:

```tsx
<ScrollView overScrollMode="never">{content}</ScrollView>
```

This disables Android's edge stretch/glow feedback. Normal scrolling and glass effects,
including `blurGradient`, continue to work. This is a workaround for the backdrop capture
interaction, not native support for overscroll stretch.

## Credits and licenses

This package is licensed under Apache-2.0. It contains code from
[Kyant0/AndroidLiquidGlass](https://github.com/Kyant0/AndroidLiquidGlass) (Apache-2.0) and
[QWEA0/Liquid-Glass-Android](https://github.com/QWEA0/Liquid-Glass-Android) (MIT); see
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
