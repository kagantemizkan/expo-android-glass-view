import type { AndroidGlassViewProps } from 'expo-android-glass-view';
import NativeView from 'expo-android-glass-view/src/NativeAndroidGlassView';
import type * as React from 'react';
import {
  type ColorValue,
  type NativeSyntheticEvent,
  Platform,
  processColor,
  View,
} from 'react-native';

/**
 * The lab's glass view: the library's native view with the experiment props the public
 * `AndroidGlassView` does not expose (effect overrides, shader uniforms, sampling margin, …).
 */

/** Effect overrides (the `effect` lab prop). */
export type BackdropEffectName =
  | 'none'
  | 'blur'
  | 'blur-input'
  | 'offset'
  | 'saturate'
  | 'blur-saturate'
  | 'shader-gradient'
  | 'agsl-invert'
  | 'agsl-coords'
  | 'agsl-magnify'
  | 'agsl-lens'
  | 'agsl-chroma'
  | 'lens-blur'
  | 'agsl-shift'
  | 'blur-then-shift'
  | 'lens-open'
  | 'lens-blur-open'
  | 'liquid'
  | 'liquid-blur';

export type BackdropStatus = {
  effect: string;
  applied: boolean;
  error: string | null;
  supported: boolean;
  mode: 'platform' | 'capture' | 'flat';
  sdkFull: string;
  width: number;
  height: number;
};

export type LabGlassViewProps = Omit<AndroidGlassViewProps, 'tintColor' | 'fallbackColor'> & {
  tintColor?: ColorValue;
  fallbackColor?: ColorValue;
  effect?: BackdropEffectName;
  /** Blur radius in dp (same as blurRadius). */
  radius?: number;
  tileMode?: 'clamp' | 'mirror' | 'repeat' | 'decal';
  offsetX?: number;
  offsetY?: number;
  margin?: number;
  uniforms?: Record<string, number>;
  clip?: boolean;
  refractionHeight?: number;
  amount?: number;
  selfEffect?: 'none' | 'blur';
  strokeColor?: ColorValue;
  onBackdropStatus?: (event: NativeSyntheticEvent<BackdropStatus>) => void;
};

type NativeProps = Omit<LabGlassViewProps, 'tintColor' | 'fallbackColor' | 'strokeColor'> & {
  tintColor?: number | null;
  fallbackColor?: number | null;
  strokeColor?: number | null;
};

const NativeGlass = NativeView as React.ComponentType<NativeProps> | null;

function toNative(color?: ColorValue) {
  const value = color == null ? null : processColor(color);
  return typeof value === 'number' ? value : null;
}

export default function LabGlassView({
  tintColor,
  fallbackColor,
  strokeColor,
  ...rest
}: LabGlassViewProps) {
  if (!NativeGlass) return <View {...rest} />;
  return (
    <NativeGlass
      {...rest}
      tintColor={toNative(tintColor)}
      fallbackColor={toNative(fallbackColor)}
      strokeColor={toNative(strokeColor)}
    />
  );
}
