import { requireNativeView } from 'expo';
import type * as React from 'react';

import type { GlassBackdropSourceProps } from './AndroidGlassView.types';

const NativeGlassBackdropSource: React.ComponentType<GlassBackdropSourceProps> = requireNativeView(
  'ExpoAndroidGlassView',
  'GlassBackdropSource'
);

/**
 * Marks what is behind the glass, for devices without the platform backdrop API. Glass views
 * name it in `backdropSource`. Put glass views next to (on top of) the source, not inside it.
 */
export default function GlassBackdropSource(props: GlassBackdropSourceProps) {
  return <NativeGlassBackdropSource collapsable={false} {...props} />;
}
