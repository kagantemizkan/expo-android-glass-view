# Third-party notices

This package includes code from the following projects.

## Kyant0/AndroidLiquidGlass (Backdrop)

- Source: https://github.com/Kyant0/AndroidLiquidGlass (commit 65ab177, library version 2.0.1)
- Location in this package:
  - `android/src/main/java/expo/modules/androidglassview/backdrop/` — the Backdrop library
  - `android/src/main/java/expo/modules/androidglassview/components/` — `LiquidButton`, `LiquidToggle`, `LiquidSlider`, `LiquidBottomTabs` (with `LiquidBottomTab`), `DampedDragAnimation`, `InteractiveHighlight` and `DragGestureInspector` from the Backdrop Catalog sample app
- License: Apache License, Version 2.0 — https://www.apache.org/licenses/LICENSE-2.0
- Copyright 2025 Kyant
- Changes to the library: package relocated from `com.kyant.backdrop`, Kotlin Multiplatform `expect`/`actual` merged into Android-only code, dependency on `io.github.kyant0:shapes` removed, Kotlin 2.1 compatible syntax (context parameters replaced by an explicit argument).
- Changes to the sample components: package relocated, made internal, configurable colours, `io.github.kyant0:shapes`' `Capsule` replaced by a rounded-corner capsule, Compose content slots replaced by draw callbacks (React Native children), sized by React Native, larger touch areas (the slider takes drags anywhere and moves the thumb under the finger, a horizontal drag anywhere on the tab bar scrubs the droplet between tabs, the whole toggle takes taps and drags), the tab bar can minimize (shorter and narrower, labels fading out), drag cancellation reported (a cancelled drag no longer toggles the switch), `DampedDragAnimation.moveToValue` added (moves without stretching the glass), `kotlin.time.Clock` replaced by `SystemClock`. Each modified file carries a notice.

## QWEA0/Liquid-Glass-Android (backdrop capture)

- Source: https://github.com/QWEA0/Liquid-Glass-Android (commit 73e2253, version 2.0.10)
- Location in this package: `android/src/main/java/expo/modules/androidglassview/capture/ViewBackdropCapture.kt` (adapted from `BackdropCapture.kt`)
- License: MIT

```
MIT License

Copyright (c) 2025-2026 pandadog

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
