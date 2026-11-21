import { getBackdropInfo } from 'expo-android-glass-view';
import { Link } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CASES, type LabCase } from '../lab/cases';

const SECTIONS = Array.from(new Set(CASES.map((c) => c.group))).map((group) => ({
  title: group,
  data: CASES.filter((c) => c.group === group),
}));

/** The lab's index: device capabilities, then every case. */
export default function Home() {
  const insets = useSafeAreaInsets();
  const info = getBackdropInfo();
  return (
    <SectionList<LabCase>
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
      sections={SECTIONS}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.info}>
          <Text style={styles.h1}>Backdrop lab</Text>
          <Link href="/showcase" style={styles.showcase}>
            Showcase: every glass component →
          </Link>
          <Text style={styles.mono}>
            SDK {info.sdkFull} ({info.sdkIntFull}){'\n'}
            View.setBackdropRenderEffect: {String(info.supported)}
            {'\n'}
            RenderNode.setBackdropRenderEffect: {String(info.renderNodeSupported)}
          </Text>
        </View>
      }
      renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/case/[id]', params: { id: item.id } }} style={styles.row}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          {'\n'}
          <Text style={styles.rowId}>{item.id}</Text>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111' },
  info: { paddingHorizontal: 16, paddingBottom: 12 },
  h1: { color: '#fff', fontSize: 28, fontWeight: '800' },
  showcase: {
    color: '#0a84ff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
    paddingVertical: 8,
  },
  mono: { color: '#30d158', fontFamily: 'monospace', fontSize: 12, marginTop: 8 },
  section: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  rowTitle: { color: '#fff', fontSize: 15 },
  rowId: { color: '#8e8e93', fontSize: 12 },
});
