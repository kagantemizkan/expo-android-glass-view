import { useGlobalSearchParams } from 'expo-router';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

/**
 * A fixed (never scrolling) backdrop for comparing glass across platforms: one photo at a fixed
 * size in points, centred horizontally and placed relative to the glass's vertical centre, so
 * both platforms show the same pixels behind the glass. Pick the photo with `?photo=12|15|17`.
 */
export const PHOTO_WIDTH = 440;
export const PHOTO_HEIGHT = (PHOTO_WIDTH * 1100) / 900;

const PHOTOS: Record<string, number> = {
  '12': require('../../assets/gallery/12.jpg'), // sand above dark rocks
  '15': require('../../assets/gallery/15.jpg'), // waterfall, busy rocks
  '17': require('../../assets/gallery/17.jpg'), // green grass and path
};

/** Fraction of the photo's height that sits on the glass's centre. */
const ANCHOR = 0.62;

export default function BarBackdrop({ barCenterY }: { barCenterY: number }) {
  const { width } = useWindowDimensions();
  const { photo } = useGlobalSearchParams<{ photo?: string }>();
  return (
    <View style={styles.root}>
      <Image
        source={PHOTOS[photo ?? '12'] ?? PHOTOS['12']}
        style={[
          styles.photo,
          { left: (width - PHOTO_WIDTH) / 2, top: barCenterY - PHOTO_HEIGHT * ANCHOR },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#808080' },
  photo: { position: 'absolute', width: PHOTO_WIDTH, height: PHOTO_HEIGHT },
});
