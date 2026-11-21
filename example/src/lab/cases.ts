import type { LabGlassViewProps } from './LabGlassView';

export type Scene = 'photos' | 'stripes' | 'text';

/** How the glass is placed / animated in a case. */
export type Variant =
  | 'single'
  | 'tabs'
  | 'controls'
  | 'controls-scroll'
  | 'compare'
  | 'margin'
  | 'nested'
  | 'animated'
  | 'opacity'
  | 'toggle'
  | 'edge';

export type LabCase = {
  id: string;
  group: string;
  title: string;
  /** What this case tries to find out. */
  question: string;
  scene: Scene;
  variant?: Variant;
  props: LabGlassViewProps;
  /** For `compare`: which iOS glass style the Android glass is held against. */
  compare?: { glassStyle: 'regular' | 'clear'; dark?: boolean };
  /** Leave the glass without a backdrop source (shows the fallback colour below SDK 37.2). */
  noSource?: boolean;
  /** Glass size in dp (default 280×180). */
  size?: { width: number; height: number };
};

const R = 32; // corner radius of the glass in most cases
const PILL = { width: 300, height: 120 }; // upstream demo proportions (width 1.0, height 0.4)

export const CASES: LabCase[] = [
  // 1. Baseline
  {
    id: 'none',
    group: 'Baseline',
    title: 'effect: none',
    question: 'With no backdrop effect, is the view fully transparent (only border + label)?',
    scene: 'photos',
    props: { effect: 'none', cornerRadius: R },
  },

  // 2. Blur radius
  ...[4, 16, 32, 64, 150].map((radius) => ({
    id: `blur-${radius}`,
    group: 'Blur radius',
    title: `blur ${radius}dp`,
    question: `Does the backdrop blur, and how strong is ${radius}dp? Does it follow while scrolling?`,
    scene: 'photos' as const,
    props: { effect: 'blur' as const, radius, cornerRadius: R },
  })),
  {
    id: 'blur-input',
    group: 'Blur radius',
    title: 'blur 32dp (4-arg, with input)',
    question: 'The docs name the 4-argument createBlurEffect(r, r, input, tile). Same as 3-arg?',
    scene: 'photos',
    props: { effect: 'blur-input', radius: 32, cornerRadius: R },
  },

  // 3. Edges: does the blur see pixels outside the view's bounds?
  ...(['clamp', 'mirror', 'repeat', 'decal'] as const).map((tileMode) => ({
    id: `tile-${tileMode}`,
    group: 'Edges / tile mode',
    title: `blur 40dp, tile ${tileMode}`,
    question:
      'High-contrast stripes. If the edges look identical for every tile mode, the blur reads real pixels from outside the bounds; if they differ, the backdrop is cut at the bounds.',
    scene: 'stripes' as const,
    props: { effect: 'blur' as const, radius: 40, tileMode, cornerRadius: 0 },
  })),
  {
    id: 'offset',
    group: 'Edges / tile mode',
    title: 'offset 60dp, 60dp',
    question:
      'Shifts the backdrop by 60dp. Do the top/left 60dp show real content from outside the view, or are they empty?',
    scene: 'stripes',
    props: { effect: 'offset', offsetX: 60, offsetY: 60, cornerRadius: 0 },
  },

  {
    id: 'agsl-shift',
    group: 'Edges / tile mode',
    title: 'AGSL shift 60dp (compare with offset)',
    question:
      'The same 60dp shift as `offset`, but sampled in a runtime shader. Real content in the top/left 60dp, or black?',
    scene: 'stripes',
    props: { effect: 'agsl-shift', amount: 60, cornerRadius: 0 },
  },
  {
    id: 'blur-then-shift',
    group: 'Edges / tile mode',
    title: 'blur 16, then AGSL shift 60dp',
    question: 'After a blur, can a shader read the blurred backdrop outside the bounds?',
    scene: 'stripes',
    props: { effect: 'blur-then-shift', radius: 16, amount: 60, cornerRadius: 0 },
  },

  // 4. Other RenderEffect types
  {
    id: 'saturate',
    group: 'Effect types',
    title: 'color filter (saturation 2.2)',
    question: 'Does a ColorFilter effect work as a backdrop effect?',
    scene: 'photos',
    props: { effect: 'saturate', cornerRadius: R },
  },
  {
    id: 'blur-saturate',
    group: 'Effect types',
    title: 'chain: blur 24 + saturation (vibrancy)',
    question: 'Does createChainEffect work as a backdrop effect?',
    scene: 'photos',
    props: { effect: 'blur-saturate', radius: 24, cornerRadius: R },
  },
  {
    id: 'shader-gradient',
    group: 'Effect types',
    title: 'shader effect (gradient)',
    question: 'createShaderEffect ignores its input: does it just paint the gradient?',
    scene: 'photos',
    props: { effect: 'shader-gradient', cornerRadius: R },
  },

  // 5. AGSL runtime shaders: the key question for refraction
  {
    id: 'agsl-invert',
    group: 'AGSL runtime shader',
    title: 'AGSL invert',
    question: 'Does createRuntimeShaderEffect run on the backdrop at all? (colors inverted)',
    scene: 'photos',
    props: { effect: 'agsl-invert', cornerRadius: R },
  },
  {
    id: 'agsl-coords',
    group: 'AGSL runtime shader',
    title: 'AGSL coordinates',
    question:
      'Which coordinate space does the shader get? Red = x/width, green = y/height, blue lines every 50px. Black corner top-left = origin at the view.',
    scene: 'photos',
    props: { effect: 'agsl-coords', cornerRadius: R },
  },
  {
    id: 'agsl-magnify',
    group: 'AGSL runtime shader',
    title: 'AGSL magnify ×1.6',
    question: 'Can the shader sample the backdrop at other coordinates (inside the bounds)?',
    scene: 'photos',
    props: { effect: 'agsl-magnify', amount: 0.6, cornerRadius: R },
  },
  {
    id: 'agsl-lens',
    group: 'AGSL runtime shader',
    title: 'AGSL lens rim (24dp rim, 30dp bend)',
    question:
      'Rim refraction samples up to 30dp OUTSIDE the view. Is there content at the rim, or a transparent/smeared edge?',
    scene: 'stripes',
    props: { effect: 'agsl-lens', refractionHeight: 24, amount: 30, cornerRadius: R },
  },
  {
    id: 'lens-margin',
    group: 'AGSL runtime shader',
    title: 'AGSL lens with 40dp sampling margin',
    question:
      'Workaround: the view is 40dp larger on every side and clipped to the inner rounded rect. Does the rim now bend real content in?',
    scene: 'stripes',
    variant: 'margin',
    props: { effect: 'agsl-lens', refractionHeight: 24, amount: 30, cornerRadius: R, margin: 40 },
  },
  {
    id: 'lens-blur-margin',
    group: 'AGSL runtime shader',
    title: 'blur 12 → lens, 40dp margin',
    question: 'The full glass pipeline with sampling room.',
    scene: 'photos',
    variant: 'margin',
    props: {
      effect: 'lens-blur',
      radius: 12,
      refractionHeight: 24,
      amount: 30,
      cornerRadius: R,
      margin: 40,
    },
  },
  {
    id: 'lens-open',
    group: 'AGSL runtime shader',
    title: 'lens, 40dp margin, no clip (shader draws the shape)',
    question:
      'No outline clip; outside the shape the shader returns the backdrop unchanged. Does the rim bend real content in now?',
    scene: 'stripes',
    variant: 'margin',
    props: {
      effect: 'lens-open',
      refractionHeight: 24,
      amount: 30,
      cornerRadius: R,
      margin: 40,
      clip: false,
    },
  },
  {
    id: 'lens-blur-open',
    group: 'AGSL runtime shader',
    title: 'blur → lens over original, 40dp margin, no clip',
    question:
      'Blend the masked blur+lens over the untouched backdrop: a full glass with real rim content?',
    scene: 'stripes',
    variant: 'margin',
    props: {
      effect: 'lens-blur-open',
      radius: 12,
      refractionHeight: 24,
      amount: 30,
      cornerRadius: R,
      margin: 40,
      clip: false,
    },
  },
  {
    id: 'agsl-chroma',
    group: 'AGSL runtime shader',
    title: 'AGSL chromatic aberration',
    question: 'Multiple samples per pixel with different offsets.',
    scene: 'stripes',
    props: { effect: 'agsl-chroma', amount: 40, cornerRadius: R },
  },
  {
    id: 'lens-blur',
    group: 'AGSL runtime shader',
    title: 'chain: blur 12 → lens',
    question: 'The full glass pipeline in one backdrop effect: blur, then refract.',
    scene: 'photos',
    props: { effect: 'lens-blur', radius: 12, refractionHeight: 24, amount: 30, cornerRadius: R },
  },

  // 6. Liquid glass: arya3d/liquid-glass-webgpu ported to AGSL
  {
    id: 'liquid-text',
    group: 'Liquid glass (arya3d port)',
    title: 'pill over text (upstream demo setup)',
    question: 'The upstream look as-is: lens bend, rainbow rim, Fresnel, edge ring, specular.',
    scene: 'text',
    size: PILL,
    props: { effect: 'liquid', cornerRadius: 45 },
  },
  {
    id: 'liquid-photos',
    group: 'Liquid glass (arya3d port)',
    title: 'pill over photos',
    question: 'Same glass over a photo.',
    scene: 'photos',
    size: PILL,
    props: { effect: 'liquid', cornerRadius: 45 },
  },
  {
    id: 'liquid-stripes',
    group: 'Liquid glass (arya3d port)',
    title: 'pill over stripes',
    question: 'High contrast: shows the bend profile and the colour split clearly.',
    scene: 'stripes',
    size: PILL,
    props: { effect: 'liquid', cornerRadius: 45 },
  },
  {
    id: 'liquid-card',
    group: 'Liquid glass (arya3d port)',
    title: 'card 280×180, radius 32',
    question: 'A less round shape: does the lens still read well?',
    scene: 'photos',
    props: { effect: 'liquid', cornerRadius: R },
  },
  {
    id: 'liquid-blur',
    group: 'Liquid glass (arya3d port)',
    title: 'pill over blur 3dp',
    question: 'The same glass over a lightly blurred backdrop.',
    scene: 'photos',
    size: PILL,
    props: { effect: 'liquid-blur', radius: 3, cornerRadius: 45 },
  },
  {
    id: 'liquid-strong',
    group: 'Liquid glass (arya3d port)',
    title: 'pill, stronger bend and dispersion',
    question: 'lensRefraction 0.45, dispersion 0.03: how the uniforms move the look.',
    scene: 'stripes',
    size: PILL,
    props: {
      effect: 'liquid',
      cornerRadius: 45,
      uniforms: { lensRefraction: 0.45, dispersion: 0.03 },
    },
  },
  {
    id: 'liquid-animated',
    group: 'Liquid glass (arya3d port)',
    title: 'moving pill over text',
    question: 'Glass moving and scaling with the native driver.',
    scene: 'text',
    variant: 'animated',
    size: PILL,
    props: { effect: 'liquid', cornerRadius: 45 },
  },

  // 7. Pressable liquid glass (LiquidButton behaviour on the foundation)
  {
    id: 'press-pill',
    group: 'Pressable liquid glass',
    title: 'pressable pill over photos',
    question:
      'Press: swells by 4dp and lights up under the finger. Drag: leans and stretches. Release: springs back, onPress fires.',
    scene: 'photos',
    size: { width: 200, height: 72 },
    props: { effect: 'liquid', cornerRadius: 36, interactive: true },
  },
  {
    id: 'press-card',
    group: 'Pressable liquid glass',
    title: 'pressable card over stripes',
    question: 'The same on a wider, less round shape over high contrast.',
    scene: 'stripes',
    size: { width: 280, height: 140 },
    props: { effect: 'liquid', cornerRadius: 32, interactive: true },
  },
  {
    id: 'press-round',
    group: 'Pressable liquid glass',
    title: 'pressable round button over text',
    question: 'A 72dp circle (icon button size).',
    scene: 'text',
    size: { width: 72, height: 72 },
    props: { effect: 'liquid', cornerRadius: 36, interactive: true },
  },

  // 8. Tab bar (LiquidBottomTabs behaviour on the foundation)
  {
    id: 'tabs-photos',
    group: 'Tab bar',
    title: 'liquid glass tab bar over photos',
    question:
      'Tap a tab: the droplet jumps (swells on the way). Drag the droplet or scrub the bar: it follows the finger, stretches with speed, the tab under it turns accent blue.',
    scene: 'photos',
    variant: 'tabs',
    props: {},
  },
  {
    id: 'tabs-text',
    group: 'Tab bar',
    title: 'tab bar over text',
    question: 'The same bar over high-contrast text.',
    scene: 'text',
    variant: 'tabs',
    props: {},
  },

  // 9. Toggle and slider (LiquidToggle / LiquidSlider behaviour on the foundation)
  {
    id: 'controls-photos',
    group: 'Toggle and slider',
    title: 'toggles and sliders over a photo',
    question:
      'Tap a toggle: it flips, the thumb swells into a lens on the way. Drag a thumb: it follows, stretches with speed, refracts the track.',
    scene: 'photos',
    variant: 'controls',
    props: {},
  },

  {
    id: 'controls-scroll',
    group: 'Toggle and slider',
    title: 'toggle and slider inside a ScrollView',
    question:
      'Drag a slider sideways: the page must not scroll. Drag it up/down: the page scrolls and the slider goes back to where it was.',
    scene: 'photos',
    variant: 'controls-scroll',
    props: {},
  },
  {
    id: 'fallback',
    group: 'Toggle and slider',
    title: 'glass without a backdrop source',
    question:
      'Below SDK 37.2 the glass has nothing to show: the fallback colour (theme light) stands in.',
    scene: 'photos',
    noSource: true,
    props: { cornerRadius: 32 },
  },

  {
    id: 'compare-photos-regular',
    group: 'iOS vs Android',
    title: 'iOS regular glass vs ours, over photos',
    question: 'Same size and scene on both platforms: tint, brightness, blur, rim, shadow.',
    scene: 'photos',
    variant: 'compare',
    compare: { glassStyle: 'regular' },
    props: {},
  },
  {
    id: 'compare-photos-clear',
    group: 'iOS vs Android',
    title: 'iOS clear glass vs ours, over photos',
    question: 'Same size and scene on both platforms: tint, brightness, blur, rim, shadow.',
    scene: 'photos',
    variant: 'compare',
    compare: { glassStyle: 'clear' },
    props: {},
  },
  {
    id: 'compare-stripes-regular',
    group: 'iOS vs Android',
    title: 'iOS regular glass vs ours, over stripes',
    question: 'Same size and scene on both platforms: tint, brightness, blur, rim, shadow.',
    scene: 'stripes',
    variant: 'compare',
    compare: { glassStyle: 'regular' },
    props: {},
  },
  {
    id: 'compare-stripes-clear',
    group: 'iOS vs Android',
    title: 'iOS clear glass vs ours, over stripes',
    question: 'Same size and scene on both platforms: tint, brightness, blur, rim, shadow.',
    scene: 'stripes',
    variant: 'compare',
    compare: { glassStyle: 'clear' },
    props: {},
  },
  {
    id: 'compare-text-regular',
    group: 'iOS vs Android',
    title: 'iOS regular glass vs ours, over text',
    question: 'Same size and scene on both platforms: tint, brightness, blur, rim, shadow.',
    scene: 'text',
    variant: 'compare',
    compare: { glassStyle: 'regular' },
    props: {},
  },
  {
    id: 'compare-text-clear',
    group: 'iOS vs Android',
    title: 'iOS clear glass vs ours, over text',
    question: 'Same size and scene on both platforms: tint, brightness, blur, rim, shadow.',
    scene: 'text',
    variant: 'compare',
    compare: { glassStyle: 'clear' },
    props: {},
  },
  {
    id: 'compare-photos-dark',
    group: 'iOS vs Android',
    title: 'iOS regular glass (dark) vs ours (theme dark), over photos',
    question: 'The dark appearance on both platforms.',
    scene: 'photos',
    variant: 'compare',
    compare: { glassStyle: 'regular', dark: true },
    props: {},
  },

  // 10. Shape, tint, own effect
  {
    id: 'clip-on',
    group: 'Shape and layering',
    title: 'blur 24, rounded 48dp, clip on',
    question: 'Does the backdrop follow the rounded outline when clipToOutline is on?',
    scene: 'stripes',
    props: { effect: 'blur', radius: 24, cornerRadius: 48, clip: true },
  },
  {
    id: 'clip-off',
    group: 'Shape and layering',
    title: 'blur 24, rounded 48dp, clip off',
    question: 'Without clipToOutline: square blur, or still rounded?',
    scene: 'stripes',
    props: { effect: 'blur', radius: 24, cornerRadius: 48, clip: false },
  },
  {
    id: 'tint',
    group: 'Shape and layering',
    title: 'blur 24 + white tint 25%',
    question: 'Is the background drawn on top of the processed backdrop (frosted look)?',
    scene: 'photos',
    props: { effect: 'blur', radius: 24, cornerRadius: R, tintColor: 'rgba(255,255,255,0.25)' },
  },
  {
    id: 'self-blur',
    group: 'Shape and layering',
    title: 'own setRenderEffect blur (no backdrop)',
    question: 'Contrast: the old API blurs the view itself (its label), not what is behind.',
    scene: 'photos',
    props: { effect: 'none', selfEffect: 'blur', radius: 6, cornerRadius: R },
  },
  {
    id: 'both',
    group: 'Shape and layering',
    title: 'backdrop blur 24 + own blur 6',
    question: 'Do both effects combine?',
    scene: 'photos',
    props: { effect: 'blur', selfEffect: 'blur', radius: 24, cornerRadius: R },
  },

  // 11. Composition / motion
  {
    id: 'nested',
    group: 'Composition',
    title: 'two overlapping glass views',
    question: 'Does the upper glass see (blur) the lower glass, or skip it?',
    scene: 'photos',
    variant: 'nested',
    props: { effect: 'blur', radius: 16, cornerRadius: R, tintColor: 'rgba(255,255,255,0.15)' },
  },
  {
    id: 'animated',
    group: 'Composition',
    title: 'moving + scaling glass (native driver)',
    question: 'Does the backdrop follow a transform animated on the RenderThread?',
    scene: 'stripes',
    variant: 'animated',
    props: { effect: 'blur', radius: 20, cornerRadius: R },
  },
  {
    id: 'opacity',
    group: 'Composition',
    title: 'blur 32 at opacity 0.5',
    question: 'Does view opacity fade the processed backdrop too?',
    scene: 'photos',
    variant: 'opacity',
    props: { effect: 'blur', radius: 32, cornerRadius: R },
  },
  {
    id: 'toggle',
    group: 'Composition',
    title: 'effect on/off every second',
    question: 'Does passing null clear the effect cleanly, and can it be set again?',
    scene: 'photos',
    variant: 'toggle',
    props: { effect: 'blur', radius: 32, cornerRadius: R },
  },
  {
    id: 'edge',
    group: 'Composition',
    title: 'glass half off-screen',
    question: 'Glass partly outside the window: crash, clipping, or edge artefacts?',
    scene: 'stripes',
    variant: 'edge',
    props: { effect: 'agsl-lens', refractionHeight: 24, amount: 30, cornerRadius: R },
  },
];

export const findCase = (id: string) => CASES.find((c) => c.id === id);
