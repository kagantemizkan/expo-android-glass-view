# Third-party notices

This package includes code from the following projects.

## Kyant0/AndroidLiquidGlass (press and drag behaviour)

- Source: https://github.com/Kyant0/AndroidLiquidGlass (commit 65ab177, library version 2.0.1)
- Location in this package: `AndroidGlassView.kt` (interactive press), `PressInteraction.kt`, `GlassThumb.kt`, `AndroidGlassToggle.kt`, `AndroidGlassSlider.kt` and `AndroidGlassTabs.kt` under `android/src/main/java/expo/modules/androidglassview/`
- What is used: the behaviour of the Backdrop Catalog sample components `LiquidButton`, `InteractiveHighlight`, `DampedDragAnimation`, `LiquidToggle`, `LiquidSlider` and `LiquidBottomTabs` (sizes, spring and stretch values, the press highlight), rewritten for Android views without Jetpack Compose. Each file names the component it follows.
- License: Apache License, Version 2.0 — https://www.apache.org/licenses/LICENSE-2.0
- Copyright 2025 Kyant

## arya3d/liquid-glass-webgpu (liquid glass shader)

- Source: https://github.com/arya3d/liquid-glass-webgpu
- Location in this package: `android/src/main/java/expo/modules/androidglassview/LiquidGlassShader.kt` (ported from `src/glassPassShader.ts`)
- Changes: WGSL translated to AGSL for `RenderEffect.createRuntimeShaderEffect`; the page texture is the view's backdrop sampled in view pixels; the glass fills the view; the look values are uniforms with the upstream values as defaults; the mask output is dropped.
- License: MIT

```
MIT License

Copyright (c) 2026 arya3d

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
