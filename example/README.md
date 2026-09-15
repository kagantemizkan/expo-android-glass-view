# Android Glass example

The Expo Router demo from `android-glass-view-example-app` now lives here. Home,
Controls, Gallery, Pokémon List and Details use this repository's local module.
The example targets the 0.1.10 API.

```sh
npm install
cd example
npm install
npx expo run:android --device
```

A development build is required; Expo Go does not include the native glass views.
The app uses the package `expo.modules.androidglassview.example`.
Its `expoglassviewexample` URL scheme is separate from the original external demo,
so both apps can remain installed without opening the wrong one from a link.
Metro resolves `expo-android-glass-view` locally, and native autolinking includes
`../android`. After native changes, rebuild with `expo run:android`.

For a USB-only Metro connection, run `adb reverse tcp:8081 tcp:8081`, then start
`NODE_OPTIONS=--dns-result-order=ipv4first npx expo start --localhost`. This keeps
the server on this computer and uses IPv4 for the USB reverse connection.

## Menu device check

Open **Gallery → the round sort button beside Arşiv**. This screen uses the four
Turkish rows and photographic tiles from the supplied reference. The copied colour
gallery is retained at `/color-gallery`, also linked below the photo grid. Check:

- The panel opens from the trigger with an expanding lens and settles into glass.
- The photographic tiles remain fixed behind it while the glass changes size.
- Drag across rows, then release to choose; release outside to cancel.
- Recent/capture-date ordering updates the checkmark on the next opening.
- Filter/display chevrons grow a front surface while the parent fades behind it.
- Tap the submenu title, exposed parent, or Android Back to collapse it.
- Filter checks and display controls update without closing the menu.
- Separators cannot be selected; disabled/destructive examples remain in the colour gallery.
- A stationary press does not move the menu. Pull down from the touch point: the
  glass narrows, lengthens and moves down while its right edge stays anchored.
  Release outside a row: it briefly overshoots and settles back without closing.
- The highlight springs between whole-row snap targets, stays fixed within a row, and disappears in gaps and padding.
- Outside press and Android Back close it without navigating away.
- Repeated open/close and selection do not leave an invisible touch blocker.
- Large font sizes and TalkBack allow access to every item.

The native menu supports nested item arrays, two-line labels, overlap/below placement
and both light/dark surfaces. The reference screen intentionally uses dark glass.
The native spring animation follows Android's animator duration scale.

The motion tracks are based on the supplied 30 fps iOS recording: a short pinch,
downward travel beyond the final centre, independent width/height settling, delayed
and refracted text, and an earlier text fade during closing. Closing also changes
from an oval into a droplet pulled toward the source button. The root surface uses
a fixed drawing layer with inverse backdrop scaling to avoid resizing its texture
on every frame. The dark material's
RGB transfer was fitted against background/glass pixel pairs from the recording.
Apple describes the source-button morph and material transitions in
[Build a UIKit app with the new design](https://developer.apple.com/videos/play/wwdc2025/284/).

## Cam test laboratuvarı

Open **Controls → Cam test laboratuvarı** (also linked in Gallery). The `/glass-lab` editor
keeps its preview settings local. Its **Menü & testler** link opens `/glass-tests`, with
View/Button effects, toggle/slider interactions, tab selection/minimization and nested menus.
The advanced suite's Light/Dark selector is shared with Gallery.

Gallery uses twelve bundled sample photos from Picsum; photo credits are in `assets/gallery/credits.json`. Tap for full-screen preview, or use Select to select photos. Empty media filters show a recoverable empty state.

## Interactive glass editor

`/glass-lab` now opens a fixed live preview above a translucent, scrollable settings panel. It supports View, Button, Slider, Toggle and BottomTabs previews; numeric sliders and direct input; RGB hex and alpha; appearance selection; presets; image picking and zoom; reset and JSON sharing. GlassView starts without a theme. Toggle and Slider have no theme controls. `Menü & testler` opens the preserved full interaction suite at `/glass-tests`, including custom React menu content.

For BottomTabs, **Cam değerlerini özelleştir** enables optional glass props. Turn it off to
verify the default material; opacity can be tested independently. Effect controls modify the
bar surface, while the selection droplet retains its own optics. Check both setting an override
and removing it, including `0` for blur/refraction and `false` for highlight/shadow.
