import type { ReactNode } from 'react';
import type { ColorValue, StyleProp, TextStyle, ViewProps } from 'react-native';

import type { AndroidGlassViewProps } from './AndroidGlassView.types';

/**
 * Accepts every `AndroidGlassView` glass prop. `cornerRadius` defaults to a capsule.
 * Children (label, icon, …) are drawn inside the glass and follow its press deformation; they
 * are decorative, so don't put interactive elements in a button.
 */
export type AndroidGlassButtonProps = AndroidGlassViewProps & {
  /** Called when the button is tapped. */
  onPress?: () => void;
  /** Convenience label, rendered before the children. */
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
  /**
   * Press and drag feedback: the glass stretches towards the finger and a highlight follows it.
   * Default true.
   */
  interactive?: boolean;
};

export type AndroidGlassToggleProps = ViewProps & {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  /** Track colour when on. Default iOS green. */
  accentColor?: ColorValue;
  /** Track colour when off. */
  trackColor?: ColorValue;
};

export type AndroidGlassSliderProps = ViewProps & {
  value?: number;
  /** Default 0. */
  minimumValue?: number;
  /** Default 1. */
  maximumValue?: number;
  /** Called continuously while the thumb is dragged. */
  onValueChange?: (value: number) => void;
  /** Called once when the finger is lifted, or after a tap on the track. */
  onSlidingComplete?: (value: number) => void;
  /** Colour of the filled part of the track. Default system blue. */
  accentColor?: ColorValue;
  trackColor?: ColorValue;
};

export type AndroidGlassBottomTabsProps = ViewProps & {
  /** Index of the selected tab. */
  selectedIndex?: number;
  /** Called when the user taps a tab or drops the droplet on one. */
  onTabSelected?: (index: number) => void;
  /**
   * Minimizes the bar (an addition of this package): it gets shorter and narrower, each tab keeps
   * only its first child (the icon) and the rest (the label) fades out. Animated natively. Inside a
   * `MinimizeOnScrollProvider`, leave it out: the bar follows the provider. Android only.
   */
  minimized?: boolean;
  /**
   * Called with `false` when the user expands the minimized bar by touching it. With
   * `useMinimizeOnScroll`, pass its `setMinimized`; inside a `MinimizeOnScrollProvider` it isn't
   * needed.
   */
  onMinimizedChange?: (minimized: boolean) => void;
  /** Colour the selected tab's content takes under the droplet. Default system blue. */
  accentColor?: ColorValue;
  /** Colour of the glass bar. */
  containerColor?: ColorValue;
  /** One child per tab, e.g. `AndroidGlassTab`. Tabs get equal widths. */
  children?: ReactNode;
};

export type AndroidGlassTabProps = {
  icon?: ReactNode;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
};
