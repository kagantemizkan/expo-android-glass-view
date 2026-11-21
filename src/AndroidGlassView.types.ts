import type * as React from 'react';
import type { ColorValue, ViewProps } from 'react-native';

/** Default colours of the glass components. Default `light`, independent of the system theme. */
export type GlassTheme = 'light' | 'dark';

/**
 * Glass presets matching iOS 26 Liquid Glass (and expo-glass-effect's `glassEffectStyle`):
 * - `regular`: frosted, a surface tint that adapts to what is behind, a soft shadow.
 * - `clear`: lightly blurred, almost no tint; the backdrop stays visible.
 */
export type GlassEffectStyle = 'regular' | 'clear';

export type AndroidGlassViewProps = ViewProps & {
  /** Corner radius in dp. Use a large value (e.g. 999) for a capsule. */
  cornerRadius?: number;
  /** Default `regular`. */
  glassEffectStyle?: GlassEffectStyle;
  /** Blur under the glass, in dp. Default from `glassEffectStyle` (regular 5.2, clear 2.5). */
  blurRadius?: number;
  /**
   * Liquid glass lens: the backdrop bends at the rim, with a colour split, Fresnel and a highlight.
   * Default true; false gives plain blur and tint.
   */
  refraction?: boolean;
  /**
   * Surface colour of the glass; its alpha is how strongly it covers the backdrop. Default from
   * `glassEffectStyle` and `theme` (regular: translucent white, or dark grey in the dark theme).
   */
  tintColor?: ColorValue;
  /**
   * Shown instead of the glass where there is no backdrop to show: below Android 13, or below
   * Android 17 QPR (SDK 37.2) without a `backdropSource`. Default from `theme`.
   */
  fallbackColor?: ColorValue;
  theme?: GlassTheme;
  /**
   * Name of the `GlassBackdropSource` behind this glass. Needed below SDK 37.2, where the platform
   * does not supply the backdrop; ignored where it does.
   */
  backdropSource?: string;
  /**
   * Pressable glass: swells, leans and stretches towards the finger, lights up under it, and
   * springs back on release.
   */
  interactive?: boolean;
  /** Fired when a press on an `interactive` glass ends inside it. */
  onPress?: () => void;
};

export type AndroidGlassTabsProps = Omit<
  AndroidGlassViewProps,
  'interactive' | 'onPress' | 'children'
> & {
  /** The selected tab. Without it, the bar keeps the user's selection. */
  selectedIndex?: number;
  /** Fired when the user taps a tab or drops the droplet on one. */
  onTabSelected?: (index: number) => void;
  /** Colour the selected tab takes under the droplet. Default from `theme`. */
  accentColor?: ColorValue;
  /** One child per tab; tabs get equal widths. */
  children?: React.ReactNode;
};

export type AndroidGlassToggleProps = ViewProps & {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  theme?: GlassTheme;
  /** Track colour when on. Default from `theme` (iOS green). */
  accentColor?: ColorValue;
  /** Track colour when off. Default from `theme`. */
  trackColor?: ColorValue;
  /** `GlassBackdropSource` the pressed thumb bends below SDK 37.2. */
  backdropSource?: string;
};

export type AndroidGlassSliderProps = ViewProps & {
  value?: number;
  /** Default 0. */
  minimumValue?: number;
  /** Default 1. */
  maximumValue?: number;
  /** Called continuously while the user slides. */
  onValueChange?: (value: number) => void;
  /** Called once when the finger lifts. */
  onSlidingComplete?: (value: number) => void;
  theme?: GlassTheme;
  /** Colour of the filled part of the track. Default from `theme`. */
  accentColor?: ColorValue;
  /** Default from `theme`. */
  trackColor?: ColorValue;
  /** `GlassBackdropSource` the pressed thumb bends below SDK 37.2. */
  backdropSource?: string;
};

export type GlassBackdropSourceProps = ViewProps & {
  /** The name glass views use in `backdropSource`. */
  name: string;
};

export type BackdropInfo = {
  /** This device has the platform backdrop API (SDK 37.2+). */
  supported: boolean;
  renderNodeSupported: boolean;
  /** e.g. "37.2". */
  sdkFull: string;
  sdkIntFull: number;
};
