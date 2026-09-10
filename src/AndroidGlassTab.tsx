import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AndroidGlassTabProps } from './AndroidGlassComponents.types';

/**
 * An icon over a label, like Kyant's LiquidBottomTab. Use as a child of AndroidGlassBottomTabs.
 * The icon gets a view of its own: a minimized tab bar keeps each tab's first child and fades the
 * rest (the label) out.
 */
export default function AndroidGlassTab({ icon, label, labelStyle }: AndroidGlassTabProps) {
  return (
    <>
      {icon != null ? <View collapsable={false}>{icon}</View> : null}
      {label != null ? (
        <Text numberOfLines={1} style={[styles.label, labelStyle]}>
          {label}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: '#000000',
  },
});
