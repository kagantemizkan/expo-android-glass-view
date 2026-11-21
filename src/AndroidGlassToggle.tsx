import * as React from 'react';
import { Switch } from 'react-native';

import type { AndroidGlassToggleProps } from './AndroidGlassView.types';

// iOS and web: the platform switch with the same API.
export default function AndroidGlassToggle({
  value,
  onValueChange,
  accentColor,
  trackColor,
  ...rest
}: AndroidGlassToggleProps) {
  const [own, setOwn] = React.useState(false);
  return (
    <Switch
      {...rest}
      value={value ?? own}
      trackColor={{ true: accentColor ?? '#34C759', false: trackColor }}
      onValueChange={(next) => {
        setOwn(next);
        onValueChange?.(next);
      }}
    />
  );
}
