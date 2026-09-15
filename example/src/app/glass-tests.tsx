import {
  AndroidGlassBottomTabs,
  AndroidGlassButton,
  AndroidGlassMenu,
  AndroidGlassSlider,
  AndroidGlassTab,
  AndroidGlassToggle,
  AndroidGlassView,
  type AndroidGlassMenuItem,
  type AndroidGlassViewProps,
} from 'expo-android-glass-view';
import { useGlassAppearance } from '@/components/GlassAppearance';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGES = ['Bileşenler', 'Efektler', 'Tab bar', 'Menü'] as const;

export default function GlassLab() {
  const { mode } = useLocalSearchParams<{mode?: string}>();
  const insets = useSafeAreaInsets();
  const { theme, setTheme } = useGlassAppearance();
  const [page, setPage] = useState<(typeof PAGES)[number]>(mode === 'custom' ? 'Menü' : 'Bileşenler');
  const [background, setBackground] = useState('Renkli');
  const [enabled, setEnabled] = useState(true);
  const [value, setValue] = useState(0.45);
  const [event, setEvent] = useState('Hazır');
  const [selected, setSelected] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [viewThemed, setViewThemed] = useState(false);
  const [interactive, setInteractive] = useState(true);
  const [customRange, setCustomRange] = useState(false);
  const [customMenu, setCustomMenu] = useState(mode === 'custom');
  const [customCount, setCustomCount] = useState(0);
  const [longMenu, setLongMenu] = useState(false);
  const [accent, setAccent] = useState(false);
  const [container, setContainer] = useState(false);
  const [overrides, setOverrides] = useState<Partial<AndroidGlassViewProps>>({});
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [below, setBelow] = useState(false);
  const [wide, setWide] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const anchor = useRef<View>(null);
  const ink = { color: theme === 'dark' ? '#fff' : '#15191f' };
  const viewInk = viewThemed
    ? ink
    : { color: background === 'Koyu' || background === 'Fotoğraf' ? '#fff' : '#15191f' };
  const items: AndroidGlassMenuItem[] = [
    { id: 'sort', title: 'Sıralama', checked: true },
    {
      id: 'filter',
      title: 'Filtrele',
      children: [
        { id: 'all', title: 'Tümü', checked: !favorite, keepsMenuPresented: true },
        {
          id: 'favorite',
          title: 'Favoriler',
          checked: favorite,
          icon: 'heart',
          compact: true,
          sectionTitle: 'Filtreler',
          separator: true,
          keepsMenuPresented: true,
        },
        {
          id: 'nested',
          title: 'Diğer seçenekler',
          children: [{ id: 'deep', title: 'Üçüncü seviye' }],
        },
      ],
    },
    { id: 'multiline', title: 'İki satırlı\nmenü seçeneği', separator: true },
    { id: 'disabled', title: 'Devre dışı seçenek', disabled: true },
    { id: 'delete', title: 'Sil (yalnızca test)', destructive: true },
  ];
  const tabs = (extra: Partial<React.ComponentProps<typeof AndroidGlassBottomTabs>> = {}) => (
    <AndroidGlassBottomTabs
      theme={theme}
      selectedIndex={selected}
      onTabSelected={(index) => {
        setSelected(index);
        setEvent(`Tab seçildi: ${index + 1}`);
      }}
      minimized={minimized}
      onMinimizedChange={setMinimized}
      accentColor={accent ? '#e533a0' : undefined}
      containerColor={container ? 'rgba(255,170,20,0.3)' : undefined}
      {...extra}>
      {['Ev', 'Ara', 'Kaydet'].map((label, i) => (
        <AndroidGlassTab
          key={label}
          icon={<Text style={[{ fontSize: 21 }, ink]}>{['⌂', '⌕', '♡'][i]}</Text>}
          label={label}
          labelStyle={ink}
        />
      ))}
    </AndroidGlassBottomTabs>
  );
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>‹ Geri</Text>
        </Pressable>
        <Text style={styles.title}>Cam test laboratuvarı</Text>
      </View>
      <Choices
        values={['Light', 'Dark']}
        selected={theme === 'dark' ? 'Dark' : 'Light'}
        onSelect={(v) => setTheme(v === 'Dark' ? 'dark' : 'light')}
      />
      <Flag label="GlassView’a tema uygula" value={viewThemed} onChange={setViewThemed} />
      <Choices values={[...PAGES]} selected={page} onSelect={(v) => setPage(v as typeof page)} />
      <Choices
        values={['Renkli', 'Fotoğraf', 'Açık', 'Koyu']}
        selected={background}
        onSelect={setBackground}
      />
      <ScrollView
        key={page}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
        <View
          style={[
            styles.stage,
            { backgroundColor: background === 'Koyu' ? '#191d27' : '#e8e9ed' },
          ]}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {background === 'Fotoğraf' ? (
              <Image source={require('../../assets/gallery/15.jpg')} style={styles.photo} />
            ) : null}
            {background === 'Renkli' ? (
              <View style={styles.stripes}>
                {['#7098ee', '#e791b5', '#ecbf67', '#69bba9'].map((color) => (
                  <View key={color} style={{ flex: 1, backgroundColor: color }} />
                ))}
              </View>
            ) : null}
          </View>
          {page === 'Bileşenler' && (
            <>
              <AndroidGlassView theme={viewThemed ? theme : undefined} style={styles.panel}>
                <Text style={[styles.label, viewInk]}>
                  {viewThemed ? 'GlassView · tema uygulanıyor' : 'GlassView · temasız varsayılan'}
                </Text>
              </AndroidGlassView>
              <AndroidGlassButton
                theme={theme}
                interactive={interactive}
                titleStyle={ink}
                title="Bas ve sürükle"
                onPress={() => setEvent('Butona basıldı')}
              />
              <View style={styles.row}>
                <Text style={[styles.label, ink]}>Toggle {enabled ? 'açık' : 'kapalı'}</Text>
                <AndroidGlassToggle
                  accentColor={accent ? '#e533a0' : undefined}
                  trackColor={container ? '#98b8de' : undefined}
                  value={enabled}
                  onValueChange={(v) => {
                    setEnabled(v);
                    setEvent(`Toggle: ${v}`);
                  }}
                />
              </View>
              <AndroidGlassSlider
                accentColor={accent ? '#e533a0' : undefined}
                trackColor={container ? '#98b8de' : undefined}
                minimumValue={customRange ? -50 : 0}
                maximumValue={customRange ? 50 : 1}
                value={value}
                onValueChange={setValue}
                onSlidingComplete={(v) => setEvent(`Slider bırakıldı: ${Number(v.toFixed(2))}`)}
              />
              <Text style={[styles.label, ink]}>
                Slider: {value.toFixed(2)} ({customRange ? '−50…50' : '0…1'})
              </Text>
              {tabs()}
            </>
          )}
          {page === 'Efektler' && (
            <>
              <AndroidGlassView
                theme={viewThemed ? theme : undefined}
                {...overrides}
                style={[styles.panel, { height: 115 }]}>
                <Text style={[styles.label, viewInk]}>Özel ayarlı GlassView</Text>
              </AndroidGlassView>
              <AndroidGlassButton
                theme={theme}
                {...overrides}
                titleStyle={ink}
                title="Aynı ayarlarla buton"
                onPress={() => setEvent('Özel ayarlı buton')}
              />
            </>
          )}
          {page === 'Tab bar' && (
            <>
              {tabs()}
              <Text style={[styles.label, ink]}>
                Seçili tab: {selected + 1} · {minimized ? 'Küçük' : 'Büyük'}
              </Text>
            </>
          )}
          {page === 'Menü' && (
            <>
              <View
                ref={anchor}
                collapsable={false}
                style={{ alignSelf: 'flex-end', opacity: hidden ? 0 : 1 }}>
                <AndroidGlassButton
                  theme={theme}
                  titleStyle={ink}
                  title="Menüyü aç"
                  onPress={() => {
                    setHidden(true);
                    setVisible(true);
                  }}
                />
              </View>
              <Text style={[styles.label, ink]}>
                Satırlar arasında sürükle; boşluğa bırak; alt menü aç; Android geri tuşunu dene.
              </Text>
            </>
          )}
        </View>
        {page === 'Bileşenler' && (
          <>
            <Flag
              label="Buton basma / sürükleme animasyonu"
              value={interactive}
              onChange={setInteractive}
            />
            <Flag label="Toggle / slider özel accent rengi" value={accent} onChange={setAccent} />
            <Flag
              label="Toggle / slider özel track rengi"
              value={container}
              onChange={setContainer}
            />
            <Flag
              label="Slider aralığı −50…50"
              value={customRange}
              onChange={(v) => {
                setCustomRange(v);
                setValue(v ? 0 : 0.45);
              }}
            />
            <Pressable
              style={styles.action}
              onPress={() => {
                setValue(0.45);
                setEnabled(true);
                setSelected(0);
                setEvent('Değerler sıfırlandı');
              }}>
              <Text>Sıfırla</Text>
            </Pressable>
          </>
        )}
        {page === 'Efektler' && (
          <>
            <Text style={styles.caption}>
              GlassView ve Button üzerinde mevcut efektleri canlı değiştir. Kapatınca varsayılan
              ayara döner.
            </Text>
            <Flag
              label="Blur 18"
              value={overrides.blurRadius === 18}
              onChange={(v) => setOverrides({ ...overrides, blurRadius: v ? 18 : undefined })}
            />
            <Flag
              label="Blur kapalı (0)"
              value={overrides.blurRadius === 0}
              onChange={(v) => setOverrides({ ...overrides, blurRadius: v ? 0 : undefined })}
            />
            <Flag
              label="Güçlü kırılma (24 / 40)"
              value={overrides.refractionAmount === 40}
              onChange={(v) =>
                setOverrides({
                  ...overrides,
                  refractionHeight: v ? 24 : undefined,
                  refractionAmount: v ? 40 : undefined,
                })
              }
            />
            {(['chromaticAberration', 'depthEffect'] as const).map((prop) => (
              <Flag
                key={prop}
                label={prop}
                value={!!overrides[prop]}
                onChange={(v) => setOverrides({ ...overrides, [prop]: v || undefined })}
              />
            ))}
            <Flag
              label="Vibrancy kapalı"
              value={overrides.vibrancy === false}
              onChange={(v) => setOverrides({ ...overrides, vibrancy: v ? false : undefined })}
            />
            <Flag
              label="Kenar ve gölge kapalı"
              value={overrides.shadow === false}
              onChange={(v) =>
                setOverrides({
                  ...overrides,
                  shadow: v ? false : undefined,
                  highlight: v ? false : undefined,
                })
              }
            />
            <Flag
              label="Pembe tintColor"
              value={!!overrides.tintColor}
              onChange={(v) =>
                setOverrides({ ...overrides, tintColor: v ? 'rgba(255,60,130,0.35)' : undefined })
              }
            />
            <Flag
              label="Mavi surfaceColor"
              value={!!overrides.surfaceColor}
              onChange={(v) =>
                setOverrides({
                  ...overrides,
                  surfaceColor: v ? 'rgba(50,100,255,0.25)' : undefined,
                })
              }
            />
            <Flag
              label="Köşe yarıçapı 8"
              value={overrides.cornerRadius === 8}
              onChange={(v) => setOverrides({ ...overrides, cornerRadius: v ? 8 : undefined })}
            />
            <Pressable style={styles.action} onPress={() => setOverrides({})}>
              <Text>Tüm override’ları temizle</Text>
            </Pressable>
          </>
        )}
        {page === 'Tab bar' && (
          <>
            <Flag label="İkon / yazı rengi (accentColor)" value={accent} onChange={setAccent} />
            <Flag label="Bar rengi (containerColor)" value={container} onChange={setContainer} />
            <Flag
              label="Küçült — dokununca tekrar açılır"
              value={minimized}
              onChange={setMinimized}
            />
            <Pressable style={styles.action} onPress={() => setSelected((selected + 1) % 3)}>
              <Text>JS üzerinden sonraki tabı seç</Text>
            </Pressable>
            <Text style={styles.hint}>
              Bara dokun, aktif camı sürükle, küçültüp tekrar aç. Renk ayarları mevcut accentColor
              ve containerColor prop’larını kullanır.
            </Text>
          </>
        )}
        {page === 'Menü' && (
          <>
            <Choices
              values={['Light', 'Dark']}
              selected={theme === 'dark' ? 'Dark' : 'Light'}
              onSelect={(v) => setTheme(v === 'Dark' ? 'dark' : 'light')}
            />
            <Flag label="Uzun menü / kenardan kaydırma" value={longMenu} onChange={setLongMenu} />
            <Flag
              label="Özel React içerik (resim, switch, slider)"
              value={customMenu}
              onChange={setCustomMenu}
            />
            <Flag label="Butonun altında aç" value={below} onChange={setBelow} />
            <Flag label="Geniş menü (300 dp)" value={wide} onChange={setWide} />
            <Text style={styles.hint}>
              Favoriler menüyü kapatmadan değişir. Sil seçeneği test mesajı üretir, hiçbir veri
              silmez.
            </Text>
          </>
        )}
        <Text accessibilityLiveRegion="polite" style={styles.event}>
          {event}
        </Text>
      </ScrollView>
      <AndroidGlassMenu
        visible={visible}
        anchorRef={anchor}
        theme={theme}
        items={
          longMenu
            ? [
                ...items,
                ...Array.from({ length: 16 }, (_, i) => ({
                  id: `extra-${i}`,
                  title: `Ek seçenek ${i + 1}`,
                })),
              ]
            : items
        }
        contentHeight={340}
        children={
          customMenu ? (
            <View style={{ gap: 14 }}>
              <Image
                source={require('../../assets/gallery/15.jpg')}
                style={{ width: '100%', height: 90, borderRadius: 16 }}
              />
              <Text style={[styles.title, ink]}>React içerik</Text>
              <Text style={ink}>Bu alan gerçek React componentlerinden oluşuyor.</Text>
              <View style={styles.row}>
                <Text style={ink}>Bildirimler</Text>
                <Switch value={enabled} onValueChange={setEnabled} />
              </View>
              <AndroidGlassSlider
                value={value}
                minimumValue={customRange ? -50 : 0}
                maximumValue={customRange ? 50 : 1}
                onValueChange={setValue}
              />
              <Text style={ink}>
                Değer: {value.toFixed(2)} · Tıklama: {customCount}
              </Text>
              <Pressable style={styles.action} onPress={() => setCustomCount((count) => count + 1)}>
                <Text>Sayacı artır</Text>
              </Pressable>
              <Pressable style={styles.action} onPress={() => setVisible(false)}>
                <Text>Menüyü kapat</Text>
              </Pressable>
            </View>
          ) : undefined
        }
        width={wide ? 300 : 250}
        placement={below ? 'below' : 'overlap'}
        onDismiss={() => setVisible(false)}
        onDismissed={() => setHidden(false)}
        onSelect={(id) => {
          setEvent(`Menü: ${id}`);
          if (id === 'favorite') setFavorite(true);
          if (id === 'all') setFavorite(false);
        }}
      />
    </View>
  );
}
function Choices({
  values,
  selected,
  onSelect,
}: {
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.choices}>
      {values.map((value) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: value === selected }}
          key={value}
          onPress={() => onSelect(value)}
          style={[styles.choice, value === selected && styles.chosen]}>
          <Text style={{ color: value === selected ? '#fff' : '#242b33', fontSize: 12 }}>
            {value}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function Flag({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={{ flex: 1 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f5f7' },
  header: { padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  link: { color: '#1269ce', fontSize: 16 },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  choice: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#e4e6eb',
  },
  chosen: { backgroundColor: '#242b33' },
  hint: { fontSize: 12, color: '#626976', lineHeight: 18, paddingHorizontal: 12 },
  stage: { padding: 18, gap: 20, borderRadius: 24, minHeight: 180 },
  stripes: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%', borderRadius: 24 },
  panel: { padding: 20, minHeight: 70, justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#17212c' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  caption: { fontSize: 14, fontWeight: '600' },
  action: { padding: 15, borderRadius: 12, backgroundColor: '#e3e8ef', alignItems: 'center' },
  event: { padding: 14, backgroundColor: '#e6edf6', borderRadius: 12, color: '#263e60' },
  compare: { padding: 12, backgroundColor: '#95bed4', borderRadius: 20 },
  compareTile: { flex: 1, height: 70, alignItems: 'center', justifyContent: 'center' },
});
