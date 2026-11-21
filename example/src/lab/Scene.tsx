import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Scene as SceneName } from './cases';

const PHOTOS = [
  require('../../assets/gallery/10.jpg'),
  require('../../assets/gallery/11.jpg'),
  require('../../assets/gallery/12.jpg'),
  require('../../assets/gallery/13.jpg'),
  require('../../assets/gallery/14.jpg'),
  require('../../assets/gallery/15.jpg'),
];

const STRIPE_COLORS = ['#ff2d55', '#ffffff', '#007aff', '#000000', '#ffcc00', '#34c759'];

/** What scrolls behind the glass. */
export default function Scene({ name }: { name: SceneName }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {name === 'photos' &&
        PHOTOS.map((source, index) => <Image key={index} source={source} style={styles.photo} />)}
      {name === 'stripes' &&
        Array.from({ length: 60 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.stripe,
              { backgroundColor: STRIPE_COLORS[index % STRIPE_COLORS.length] },
            ]}>
            {index % 4 === 0 && (
              <View style={styles.bars}>
                {Array.from({ length: 12 }, (_, bar) => (
                  <View key={bar} style={[styles.bar, bar % 2 === 0 && styles.barDark]} />
                ))}
              </View>
            )}
          </View>
        ))}
      {name === 'text' &&
        Array.from({ length: 30 }, (_, index) => (
          <Text key={index} style={styles.text}>
            Backdrop {index}
          </Text>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 120 },
  photo: { width: '100%', height: 320, marginBottom: 12 },
  stripe: { height: 28 },
  bars: { flex: 1, flexDirection: 'row' },
  bar: { flex: 1, backgroundColor: '#fff' },
  barDark: { backgroundColor: '#111' },
  text: { color: '#fff', fontSize: 44, fontWeight: '800', paddingHorizontal: 16 },
});
