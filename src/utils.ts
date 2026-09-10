import { type ColorValue, processColor } from 'react-native';

export type NativeColor = number | null;

/** Converts a React Native colour to the ARGB int the native views expect. */
export function toNativeColor(color: ColorValue | undefined): NativeColor {
  if (color == null) return null;
  const processed = processColor(color);
  return typeof processed === 'number' ? processed : null;
}
