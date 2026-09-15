import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { GlassMenuPanelProps } from './AndroidGlassMenu.types';
import { menuItemHeight } from './menuLayout';

export default function GlassMenuPanel({
  items: rootItems,
  children,
  expanded,
  dark,
  rowHeight,
  onSelect,
  backRequest,
  onNavigate,
  onClosed,
}: GlassMenuPanelProps) {
  const { fontScale } = useWindowDimensions();
  const [path, setPath] = useState<string[]>([]);
  let items = rootItems;
  for (const id of path) items = items.find((item) => item.id === id)?.children ?? items;
  useEffect(() => onNavigate(path.length), [path, onNavigate]);
  const [handledBackRequest, setHandledBackRequest] = useState(backRequest);
  if (handledBackRequest !== backRequest) {
    setHandledBackRequest(backRequest);
    setPath(path.slice(0, -1));
  }
  if (!expanded && path.length) setPath([]);
  useEffect(() => {
    if (!expanded) onClosed();
  }, [expanded, onClosed]);
  if (children != null)
    return (
      <ScrollView
        pointerEvents={expanded ? 'auto' : 'none'}
        style={[styles.panel, { backgroundColor: dark ? '#292d32' : '#f2f2f2' }]}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    );
  return (
    <ScrollView style={[styles.panel, { backgroundColor: dark ? '#292d32' : '#f2f2f2' }]}>
      {path.length > 0 && (
        <Pressable onPress={() => setPath((value) => value.slice(0, -1))} style={styles.row}>
          <Text style={{ color: dark ? 'white' : '#17191d', paddingVertical: 16 }}>‹ Back</Text>
        </Pressable>
      )}
      {items.map((item) => (
        <View key={item.id}>
          {item.separator && <View style={styles.separator} />}
          {item.sectionTitle && (
            <Text
              style={{
                color: dark ? '#ffffff88' : '#00000088',
                paddingLeft: 36,
                height: 30 * fontScale,
                fontSize: 13,
                textAlignVertical: 'center',
              }}>
              {item.sectionTitle}
            </Text>
          )}
          <Pressable
            disabled={item.disabled}
            accessibilityRole="menuitem"
            accessibilityState={{ disabled: !!item.disabled, selected: !!item.checked }}
            onPress={() =>
              item.children?.length ? setPath([...path, item.id]) : onSelect(item.id)
            }
            style={({ pressed }) => [
              styles.row,
              {
                minHeight: menuItemHeight(item, rowHeight, fontScale),
                opacity: item.disabled ? 0.4 : 1,
                backgroundColor: pressed ? (dark ? '#ffffff22' : '#00000011') : 'transparent',
              },
            ]}>
            <Text style={{ color: dark ? 'white' : '#17191d', width: 24 }}>
              {item.checked ? '✓' : ''}
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 17,
                color: item.destructive ? '#e5484d' : dark ? 'white' : '#17191d',
              }}>
              {item.title}
            </Text>
            {!!item.children?.length && (
              <Text style={{ color: dark ? 'white' : '#17191d', fontSize: 20, paddingLeft: 12 }}>
                ›
              </Text>
            )}
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  panel: { borderRadius: 32, padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 16 },
  separator: { height: 1, marginVertical: 5.5, marginHorizontal: 16, backgroundColor: '#88888844' },
});
