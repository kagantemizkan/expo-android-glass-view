import type { BackdropInfo } from './AndroidGlassView.types';

export default function getBackdropInfo(): BackdropInfo {
  return { supported: false, renderNodeSupported: false, sdkFull: '0.0', sdkIntFull: 0 };
}
