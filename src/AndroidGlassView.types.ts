import type { ColorValue, ViewProps } from 'react-native';

export type GlassTheme = 'light' | 'dark';

export type AndroidGlassViewProps = ViewProps & {
  /** Optional glass appearance. Omit to keep the original untinted glass; no automatic light/dark theme. */
  theme?: GlassTheme;
  /**
   * Corner radius of the glass shape, in dp. Falls back to `style.borderRadius`, then 24.
   * Use a large value (e.g. 999) for a capsule.
   */
  cornerRadius?: number;
  /** Backdrop blur radius in dp. Default 2 without a theme, 9 with a theme. `0` disables the blur. */
  blurRadius?: number;
  /** Android 13+: linearly reduce blur from blurRadius at the top to zero at the bottom.
   * Omit for uniform blur. Android 12 uses uniform blur; older Android/iOS/web use plain fallbacks.
   */
  blurGradient?: 'top-to-bottom';
  /** Width of the refracting rim in dp. Default 12 without a theme, 2 with a theme. `0` disables refraction. */
  refractionHeight?: number;
  /** How far content is bent at the rim, in dp. Default 24 without a theme, 3 with a theme. */
  refractionAmount?: number;
  /** Split the refraction per colour channel for a prism fringe. Default false. */
  chromaticAberration?: boolean;
  /** Stronger, depth-like bending towards the rim. Default false. */
  depthEffect?: boolean;
  /** Boost backdrop saturation. Default true without a theme, false with a theme. */
  vibrancy?: boolean;
  /** Specular highlight along the rim. Default true. */
  highlight?: boolean;
  /** Soft drop shadow around the shape. Default true. */
  shadow?: boolean;
  /** Colour tint mixed into the glass. */
  tintColor?: ColorValue;
  /** Flat colour painted over the glass, on top of the refraction. */
  surfaceColor?: ColorValue;
  /**
   * Surface colour used where the effect cannot run: Android 11 and older, iOS and web.
   * Default `rgba(255, 255, 255, 0.7)`.
   */
  fallbackColor?: ColorValue;
};
