import type { ColorValue, ViewProps } from 'react-native';

export type AndroidGlassViewProps = ViewProps & {
  /**
   * Corner radius of the glass shape, in dp. Falls back to `style.borderRadius`, then 24.
   * Use a large value (e.g. 999) for a capsule.
   */
  cornerRadius?: number;
  /** Backdrop blur radius in dp. Default 2. `0` disables the blur. */
  blurRadius?: number;
  /** Width of the refracting rim in dp. Default 12. `0` disables refraction. */
  refractionHeight?: number;
  /** How far content is bent at the rim, in dp. Default 24. */
  refractionAmount?: number;
  /** Split the refraction per colour channel for a prism fringe. Default false. */
  chromaticAberration?: boolean;
  /** Stronger, depth-like bending towards the rim. Default false. */
  depthEffect?: boolean;
  /** Boost the saturation of what is behind the glass. Default true. */
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
