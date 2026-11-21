import { Image, ScrollView, StyleSheet } from 'react-native';

const PHOTOS = [
  require('../../assets/gallery/10.jpg'),
  require('../../assets/gallery/11.jpg'),
  require('../../assets/gallery/12.jpg'),
  require('../../assets/gallery/13.jpg'),
  require('../../assets/gallery/14.jpg'),
  require('../../assets/gallery/15.jpg'),
];

/** The showcase's scrolling photos, for the native tab bar reference. */
export default function PhotoBackground() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {PHOTOS.map((source, i) => (
        <Image key={i} source={source} style={styles.photo} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 140 },
  photo: { width: '100%', height: 340 },
});
