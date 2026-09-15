import Ionicons from '@expo/vector-icons/Ionicons';
import {
  AndroidGlassButton,
  AndroidGlassView,
  AndroidGlassMenu,
  type AndroidGlassMenuItem,
  useMinimizeOnScrollHandler,
} from 'expo-android-glass-view';
import { useGlassAppearance } from '@/components/GlassAppearance';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PHOTOS = [
  {
    id: '10',
    source: require('../../../assets/gallery/10.jpg'),
    favorite: true,
    edited: true,
    shared: true,
    album: true,
  },
  {
    id: '11',
    source: require('../../../assets/gallery/11.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '12',
    source: require('../../../assets/gallery/12.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: true,
  },
  {
    id: '13',
    source: require('../../../assets/gallery/13.jpg'),
    favorite: true,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '14',
    source: require('../../../assets/gallery/14.jpg'),
    favorite: false,
    edited: true,
    shared: false,
    album: true,
  },
  {
    id: '15',
    source: require('../../../assets/gallery/15.jpg'),
    favorite: false,
    edited: false,
    shared: true,
    album: false,
  },
  {
    id: '16',
    source: require('../../../assets/gallery/16.jpg'),
    favorite: true,
    edited: false,
    shared: false,
    album: true,
  },
  {
    id: '17',
    source: require('../../../assets/gallery/17.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '18',
    source: require('../../../assets/gallery/18.jpg'),
    favorite: false,
    edited: true,
    shared: false,
    album: true,
  },
  {
    id: '19',
    source: require('../../../assets/gallery/19.jpg'),
    favorite: true,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '28',
    source: require('../../../assets/gallery/28.jpg'),
    favorite: false,
    edited: false,
    shared: true,
    album: true,
  },
  {
    id: '29',
    source: require('../../../assets/gallery/29.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '30',
    source: require('../../../assets/gallery/30.jpg'),
    favorite: false,
    edited: true,
    shared: true,
    album: true,
  },
  {
    id: '31',
    source: require('../../../assets/gallery/31.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '32',
    source: require('../../../assets/gallery/32.jpg'),
    favorite: true,
    edited: false,
    shared: false,
    album: true,
  },
  {
    id: '33',
    source: require('../../../assets/gallery/33.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '34',
    source: require('../../../assets/gallery/34.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: true,
  },
  {
    id: '35',
    source: require('../../../assets/gallery/35.jpg'),
    favorite: false,
    edited: true,
    shared: false,
    album: false,
  },
  {
    id: '36',
    source: require('../../../assets/gallery/36.jpg'),
    favorite: true,
    edited: false,
    shared: true,
    album: true,
  },
  {
    id: '37',
    source: require('../../../assets/gallery/37.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '38',
    source: require('../../../assets/gallery/38.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: true,
  },
  {
    id: '39',
    source: require('../../../assets/gallery/39.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '40',
    source: require('../../../assets/gallery/40.jpg'),
    favorite: true,
    edited: true,
    shared: false,
    album: true,
  },
  {
    id: '41',
    source: require('../../../assets/gallery/41.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '42',
    source: require('../../../assets/gallery/42.jpg'),
    favorite: false,
    edited: false,
    shared: true,
    album: true,
  },
  {
    id: '43',
    source: require('../../../assets/gallery/43.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
  {
    id: '44',
    source: require('../../../assets/gallery/44.jpg'),
    favorite: true,
    edited: false,
    shared: false,
    album: true,
  },
  {
    id: '45',
    source: require('../../../assets/gallery/45.jpg'),
    favorite: false,
    edited: true,
    shared: false,
    album: false,
  },
  {
    id: '46',
    source: require('../../../assets/gallery/46.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: true,
  },
  {
    id: '47',
    source: require('../../../assets/gallery/47.jpg'),
    favorite: false,
    edited: false,
    shared: false,
    album: false,
  },
];

export default function Gallery() {
  const { theme, setTheme } = useGlassAppearance();
  const { width } = useWindowDimensions();
  useFocusEffect(
    useCallback(() => {
      setTheme('dark');
    }, [setTheme])
  );
  const insets = useSafeAreaInsets();
  const anchor = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [sort, setSort] = useState('taken');
  const [triggerHidden, setTriggerHidden] = useState(false);
  const [showScreenshots, setShowScreenshots] = useState(true);
  const [showShared, setShowShared] = useState(true);
  const [aspect, setAspect] = useState(false);
  const [filter, setFilter] = useState('all');
  const [columns, setColumns] = useState(3);
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [preview, setPreview] = useState<(typeof PHOTOS)[number] | null>(null);
  const onScroll = useMinimizeOnScrollHandler();
  const items: AndroidGlassMenuItem[] = [
    { id: 'recent', title: 'Sort by Recently\nAdded', checked: sort === 'recent' },
    { id: 'taken', title: 'Sort by Date\nCaptured', checked: sort === 'taken' },
    {
      id: 'filter',
      title: 'Filter',
      separator: true,
      children: [
        {
          id: 'all',
          title: 'All Items',
          icon: 'grid',
          checked: filter === 'all',
          keepsMenuPresented: true,
        },
        {
          id: 'favorites',
          title: 'Favorites',
          icon: 'heart',
          compact: true,
          separator: true,
          checked: filter === 'favorites',
          keepsMenuPresented: true,
        },
        {
          id: 'edited',
          title: 'Edited',
          icon: 'adjustments',
          compact: true,
          checked: filter === 'edited',
          keepsMenuPresented: true,
        },
        {
          id: 'photos',
          title: 'Photos',
          icon: 'photo',
          compact: true,
          checked: filter === 'photos',
          keepsMenuPresented: true,
        },
        {
          id: 'videos',
          title: 'Videos',
          icon: 'video',
          compact: true,
          checked: filter === 'videos',
          keepsMenuPresented: true,
        },
        {
          id: 'screenshots',
          title: 'Screenshots',
          icon: 'screenshot',
          compact: true,
          checked: filter === 'screenshots',
          keepsMenuPresented: true,
        },
        {
          id: 'unfiled',
          title: 'Not in an Album',
          icon: 'album',
          compact: true,
          checked: filter === 'unfiled',
          keepsMenuPresented: true,
        },
      ],
    },
    {
      id: 'display',
      title: 'View Options',
      children: [
        {
          id: 'appearance',
          title: theme === 'dark' ? 'Switch to Light' : 'Switch to Dark',
          keepsMenuPresented: true,
        },
        {
          id: 'zoom-in',
          title: 'Zoom In',
          icon: 'zoom-in',
          compact: true,
          keepsMenuPresented: true,
        },
        {
          id: 'zoom-out',
          title: 'Zoom Out',
          icon: 'zoom-out',
          compact: true,
          keepsMenuPresented: true,
        },
        {
          id: 'aspect',
          title: 'Aspect Ratio Grid',
          icon: 'aspect',
          checked: aspect,
          keepsMenuPresented: true,
        },
        {
          id: 'show-screenshots',
          title: 'Screenshots',
          icon: 'screenshot',
          sectionTitle: 'Show:',
          separator: true,
          compact: true,
          checked: showScreenshots,
          keepsMenuPresented: true,
        },
        {
          id: 'shared',
          title: 'Shared with You',
          icon: 'people',
          checked: showShared,
          keepsMenuPresented: true,
        },
      ],
    },
  ];
  const photos = PHOTOS.filter((photo) => {
    if (photo.shared && !showShared) return false;
    if (filter === 'favorites') return photo.favorite;
    if (filter === 'edited') return photo.edited;
    if (filter === 'videos' || filter === 'screenshots') return false;
    if (filter === 'unfiled') return !photo.album;
    return true;
  }).sort((a, b) => (sort === 'taken' ? Number(a.id) - Number(b.id) : Number(b.id) - Number(a.id)));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom: insets.bottom + 110,
        }}>
        <View style={styles.grid}>
          {photos.map((photo, index) => (
            <Pressable
              accessibilityLabel={`Photo ${photo.id}${selection.includes(photo.id) ? ', selected' : ''}`}
              onPress={() =>
                selecting
                  ? setSelection((current) =>
                      current.includes(photo.id)
                        ? current.filter((id) => id !== photo.id)
                        : [...current, photo.id]
                    )
                  : setPreview(photo)
              }
              key={photo.id}
              style={{
                width: width / columns,
                height: (width / columns) * (aspect ? 1.35 : 1),
                borderRightWidth: (index + 1) % columns === 0 ? 0 : 1,
                borderBottomWidth: 1,
                borderColor: '#000',
              }}>
              <Image source={photo.source} style={styles.photo} />
              {photo.favorite && (
                <Ionicons name="heart" size={13} color="#fff" style={styles.favorite} />
              )}
              {selecting && (
                <View
                  style={[
                    styles.selectionCircle,
                    selection.includes(photo.id) && { backgroundColor: '#1685ef' },
                  ]}>
                  <Text style={{ color: '#fff', textAlign: 'center' }}>
                    {selection.includes(photo.id) ? '✓' : ''}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
        {photos.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No Photos</Text>
            <Text style={styles.emptyText}>Choose another filter or show all photos.</Text>
            <AndroidGlassButton
              theme={theme}
              title="Show All Photos"
              titleStyle={{ color: theme === 'dark' ? '#fff' : '#151515' }}
              onPress={() => {
                setFilter('all');
                setShowShared(true);
              }}
            />
          </View>
        )}
        <View style={styles.collectionFooter}>
          <Text style={styles.count}>{photos.length} Photos</Text>
          <Text style={styles.collectionDate}>September 15, 2026</Text>
        </View>
      </ScrollView>
      <AndroidGlassView
        pointerEvents="none"
        cornerRadius={0}
        blurRadius={5}
        blurGradient="top-to-bottom"
        refractionHeight={0}
        refractionAmount={0}
        vibrancy={false}
        highlight={false}
        shadow={false}
        style={[styles.headerShade, { height: insets.top + 100 }]}>
        <View pointerEvents="box-none" style={[styles.header, { top: insets.top + 18 }]}>
          <Text style={styles.title}>Library</Text>
          <View style={styles.actions}>
            <View ref={anchor} collapsable={false} style={{ opacity: triggerHidden ? 0 : 1 }}>
              <AndroidGlassButton
                theme={theme}
                onPress={() => {
                  setTriggerHidden(true);
                  setVisible(true);
                }}
                accessibilityLabel="Sort and filter"
                style={styles.roundButton}>
                <View pointerEvents="none" style={styles.sortIcon}>
                  <View
                    style={[
                      styles.sortLine,
                      { backgroundColor: theme === 'dark' ? '#fff' : '#151515', width: 16 },
                    ]}
                  />
                  <View
                    style={[
                      styles.sortLine,
                      { backgroundColor: theme === 'dark' ? '#fff' : '#151515', width: 12 },
                    ]}
                  />
                  <View
                    style={[
                      styles.sortLine,
                      { backgroundColor: theme === 'dark' ? '#fff' : '#151515', width: 8 },
                    ]}
                  />
                </View>
              </AndroidGlassButton>
            </View>
            <AndroidGlassButton
              theme={theme}
              title={selecting ? 'Done' : 'Select'}
              titleStyle={[styles.selectTitle, { color: theme === 'dark' ? '#fff' : '#151515' }]}
              onPress={() =>
                setSelecting((value) => {
                  if (value) setSelection([]);
                  return !value;
                })
              }
              style={styles.selectButton}
            />
          </View>
        </View>
        <View pointerEvents="none" style={[styles.subtitleRow, { top: insets.top + 56 }]}>
          <Text style={styles.subtitle}>
            {selecting ? `${selection.length} photos selected` : 'September 15, 2026'}
          </Text>
        </View>
      </AndroidGlassView>
      <AndroidGlassMenu
        visible={visible}
        anchorRef={anchor}
        items={items}
        theme={theme}
        sourceIcon="sort"
        onDismissed={() => setTriggerHidden(false)}
        width={(width * 456) / 720}
        placement="overlap"
        insets={{ top: insets.top + 8, bottom: insets.bottom + 8 }}
        onDismiss={() => {
          setVisible(false);
        }}
        onSelect={(id) => {
          if (id === 'appearance') setTheme(theme === 'dark' ? 'light' : 'dark');
          else if (id === 'recent' || id === 'taken') setSort(id);
          else if (id === 'zoom-in') setColumns((value) => Math.max(2, value - 1));
          else if (id === 'zoom-out') setColumns((value) => Math.min(6, value + 1));
          else if (id === 'aspect') setAspect((value) => !value);
          else if (id === 'show-screenshots') setShowScreenshots((value) => !value);
          else if (id === 'shared') setShowShared((value) => !value);
          else setFilter(id);
        }}
      />
      <Modal
        visible={preview !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setPreview(null)}>
        <View style={styles.viewer}>
          {preview && (
            <Image source={preview.source} resizeMode="contain" style={StyleSheet.absoluteFill} />
          )}
          <View style={[styles.viewerTop, { paddingTop: insets.top + 12 }]}>
            <AndroidGlassButton
              theme={theme}
              title="Close"
              titleStyle={{ color: theme === 'dark' ? '#fff' : '#151515' }}
              onPress={() => setPreview(null)}
            />
            <Text style={{ color: '#fff' }}>Photo {preview?.id}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: '#080b10' },
  viewerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  favorite: {
    position: 'absolute',
    left: 9,
    bottom: 7,
    color: '#fff',
    textShadowColor: '#0008',
    textShadowRadius: 3,
  },
  collectionFooter: { alignItems: 'center', paddingTop: 26, paddingBottom: 24, gap: 5 },
  count: { color: '#f4f4f4', textAlign: 'center', fontSize: 16, fontWeight: '500' },
  collectionDate: { color: '#8e8e93', fontSize: 13 },
  empty: { padding: 32, gap: 16, minHeight: 250, justifyContent: 'center' },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '600' },
  emptyText: { color: '#aab5c4', lineHeight: 22 },
  root: { flex: 1, backgroundColor: '#000' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  photo: { width: '100%', height: '100%' },
  headerShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  header: {
    position: 'absolute',
    height: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.7,
    transform: [{ translateY: -3 }],
  },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  roundButton: { width: 52, height: 38, paddingHorizontal: 0 },
  selectButton: { width: 66, height: 38, paddingHorizontal: 0 },
  selectTitle: { color: '#fff', fontSize: 17 },
  sortIcon: { gap: 3, alignItems: 'center' },
  sortLine: { height: 1.5, borderRadius: 1, backgroundColor: '#f7f8fa' },
  subtitleRow: { position: 'absolute', left: 16, right: 8 },
  subtitle: { color: '#fff', fontSize: 14, fontWeight: '500' },
  selectionCircle: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: '#0003',
  },
});
