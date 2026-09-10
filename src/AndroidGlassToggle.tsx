import * as React from 'react';
import { Switch } from 'react-native';

import type { AndroidGlassToggleProps } from './AndroidGlassComponents.types';

/** iOS and web fallback: the platform switch with the same API. */
export default function AndroidGlassToggle({
  value,
  onValueChange,
  accentColor,
  trackColor,
  ...rest
}: AndroidGlassToggleProps) {
  return (
    <Switch
      {...rest}
      value={value ?? false}
      onValueChange={onValueChange}
      trackColor={{ false: trackColor ?? undefined, true: accentColor ?? '#34C759' }}
    />
  );
}
