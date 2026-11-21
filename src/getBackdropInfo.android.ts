import { requireNativeModule } from 'expo';

import type { BackdropInfo } from './AndroidGlassView.types';

const NativeModule = requireNativeModule<{ getBackdropInfo(): BackdropInfo }>(
  'ExpoAndroidGlassView'
);

export default function getBackdropInfo(): BackdropInfo {
  return NativeModule.getBackdropInfo();
}
