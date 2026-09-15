import { requireNativeView } from 'expo';
import type { ComponentType } from 'react';
import { ScrollView, StyleSheet, type NativeSyntheticEvent, type ViewProps } from 'react-native';

import type { GlassMenuPanelProps } from './AndroidGlassMenu.types';

const NativePanel: ComponentType<
  ViewProps & {
    itemsJson: string;
    expanded: boolean;
    dark: boolean;
    originX: number;
    originY: number;
    rowHeight: number;
    backRequest: number;
    customHeight?: number;
    onItemSelected: (event: NativeSyntheticEvent<{ id: string }>) => void;
    onNavigate: (event: NativeSyntheticEvent<{ depth: number }>) => void;
    onDismissRequest: () => void;
    onClosed: () => void;
  }
> = requireNativeView('ExpoAndroidGlassView', 'AndroidGlassMenuPanel');

export default function GlassMenuPanel({
  items,
  children,
  customHeight = 0,
  onSelect,
  onNavigate,
  ...props
}: GlassMenuPanelProps) {
  return (
    <NativePanel
      {...props}
      style={styles.fill}
      customHeight={customHeight}
      itemsJson={JSON.stringify(items)}
      onItemSelected={(event) => onSelect(event.nativeEvent.id)}
      onNavigate={(event) => onNavigate(event.nativeEvent.depth)}>
      {children != null && (
        <ScrollView
          collapsable={false}
          pointerEvents={props.expanded ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: customHeight,
            borderRadius: 30,
            overflow: 'hidden',
          }}
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      )}
    </NativePanel>
  );
}
const styles = StyleSheet.create({ fill: { flex: 1 } });
