import { requireNativeView } from 'expo';
import type * as React from 'react';

/**
 * The native glass view, registered once. The public `AndroidGlassView` wraps it; the example's
 * backdrop lab imports it directly (`expo-android-glass-view/src/NativeAndroidGlassView`) to pass
 * experiment props. Not part of the public API.
 */

const NativeAndroidGlassView: React.ComponentType<any> = requireNativeView(
  'ExpoAndroidGlassView',
  'AndroidGlassView'
);

export default NativeAndroidGlassView;
