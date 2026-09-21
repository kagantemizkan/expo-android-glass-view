import { requireNativeView } from 'expo';
import { useMemo, type ComponentType } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';

import type { GlassMenuPanelProps } from './AndroidGlassMenu.types';
import { serializeMenuItems } from './menuItemSerialization';

const NativePanel: ComponentType<
  ViewProps & {
    itemsJson: string;
    expanded: boolean;
    dark: boolean;
    shadow: boolean;
    shadowOpacity: number | null;
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
  const { itemsJson, icons } = useMemo(() => serializeMenuItems(items), [items]);

  return (
    <NativePanel
      {...props}
      style={styles.fill}
      shadow={props.shadow ?? true}
      shadowOpacity={props.shadowOpacity ?? null}
      customHeight={customHeight}
      itemsJson={itemsJson}
      onItemSelected={(event) => onSelect(event.nativeEvent.id)}
      onNavigate={(event) => onNavigate(event.nativeEvent.depth)}>
      {children == null &&
        icons.map((icon, index) => (
          <View
            key={index}
            collapsable={false}
            pointerEvents="none"
            accessible={false}
            style={styles.icon}>
            {icon}
          </View>
        ))}
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
const styles = StyleSheet.create({
  fill: { flex: 1 },
  icon: { position: 'absolute', left: 0, top: 0, width: 20, height: 20 },
});
