import {
  AndroidGlassView,
  AndroidGlassButton,
  AndroidGlassSlider,
  AndroidGlassToggle,
  AndroidGlassBottomTabs,
  AndroidGlassTab,
  type AndroidGlassViewProps,
} from 'expo-android-glass-view';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Kind = 'Cam' | 'Buton' | 'Slider' | 'Toggle' | 'Tab bar';
type Appearance = 'Temasız' | 'Light' | 'Dark';
const INITIAL = {
  cornerRadius: 64,
  blurRadius: 2,
  refractionHeight: 12,
  refractionAmount: 24,
  chromaticAberration: false,
  depthEffect: false,
  vibrancy: true,
  highlight: true,
  shadow: true,
};
const WALLPAPER = require('../../assets/gallery/glass-wallpaper.svg');
const BACKGROUNDS = [
  WALLPAPER,
  require('../../assets/gallery/15.jpg'),
  require('../../assets/gallery/29.jpg'),
  require('../../assets/gallery/10.jpg'),
];

export default function GlassLab() {
  const safe = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const [tabOverrides, setTabOverrides] = useState(false);
  const [kind, setKind] = useState<Kind>('Cam');
  const [appearance, setAppearance] = useState<Appearance>('Temasız');
  const [values, setValues] = useState(INITIAL);
  const [size, setSize] = useState(240);
  const [ratio, setRatio] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [interactive, setInteractive] = useState(true);
  const [showLabel, setShowLabel] = useState(false);
  const [label, setLabel] = useState('Liquid Glass');
  const [tint, setTint] = useState<string>();
  const [surface, setSurface] = useState<string>();
  const [fallback, setFallback] = useState<string>();
  const [accent, setAccent] = useState<string>();
  const [track, setTrack] = useState<string>();
  const [container, setContainer] = useState<string>();
  const [minimum, setMinimum] = useState(0);
  const [maximum, setMaximum] = useState(100);
  const [value, setValue] = useState(50);
  const [on, setOn] = useState(true);
  const [selected, setSelected] = useState(0);
  const [tabCount, setTabCount] = useState(3);
  const [minimized, setMinimized] = useState(false);
  const [background, setBackground] = useState(0);
  const [imageUri, setImageUri] = useState<string>();
  const [imageScale, setImageScale] = useState(1);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [message, setMessage] = useState('');
  const theme = appearance === 'Temasız' ? undefined : appearance === 'Dark' ? 'dark' : 'light';
  const glass: AndroidGlassViewProps = {
    ...values,
    theme,
    tintColor: tint,
    surfaceColor: surface,
    fallbackColor: fallback,
  };
  const ink = { color: theme === 'dark' ? '#fff' : '#0c2533' };
  const setNumber = (
    key: 'cornerRadius' | 'blurRadius' | 'refractionHeight' | 'refractionAmount',
    n: number
  ) => setValues((v) => ({ ...v, [key]: n }));
  const setTheme = (next: string) => {
    setAppearance(next as Appearance);
    setValues((v) => ({
      ...v,
      blurRadius: next === 'Temasız' ? 2 : 9,
      refractionHeight: next === 'Temasız' ? 12 : 2,
      refractionAmount: next === 'Temasız' ? 24 : 3,
      vibrancy: next === 'Temasız',
    }));
  };
  const reset = () => {
    setValues(INITIAL);
    setTabOverrides(false);
    setAppearance('Temasız');
    setSize(240);
    setRatio(1);
    setOpacity(1);
    setInteractive(true);
    setTint(undefined);
    setSurface(undefined);
    setFallback(undefined);
    setAccent(undefined);
    setTrack(undefined);
    setContainer(undefined);
    setMinimum(0);
    setMaximum(100);
    setValue(50);
    setOn(true);
    setSelected(0);
    setTabCount(3);
    setMinimized(false);
    setShowLabel(false);
    setLabel('Liquid Glass');
    setImageScale(1);
    setMessage('Varsayılan değerlere dönüldü');
  };
  const pick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        legacy: Platform.OS === 'android',
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
    } catch {
      Alert.alert('Resim seçilemedi', 'Fotoğraf seçiciyi yeniden açmayı deneyebilirsin.');
    }
  };
  const exportValues = () =>
    Share.share({
      message: JSON.stringify(
        {
          component: kind,
          ...(kind === 'Cam' || kind === 'Buton' ? glass : {}),
          width: size,
          aspectRatio: ratio,
          opacity,
          ...(kind === 'Buton' ? { interactive, title: label } : {}),
          ...(kind === 'Slider'
            ? {
                minimumValue: minimum,
                maximumValue: maximum,
                value,
                accentColor: accent,
                trackColor: track,
              }
            : {}),
          ...(kind === 'Toggle' ? { value: on, accentColor: accent, trackColor: track } : {}),
          ...(kind === 'Tab bar'
            ? {
                theme,
                selectedIndex: selected,
                minimized,
                accentColor: accent,
                containerColor: container,
                tabCount,
                ...(tabOverrides ? glass : {}),
              }
            : {}),
        },
        null,
        2
      ),
    }).catch(() => setMessage('Paylaşım kapatıldı'));
  const previewHeight = Math.min(size / ratio, height * 0.32);
  const previewWidth = Math.min(size, width - 40);
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={imageUri ? { uri: imageUri } : BACKGROUNDS[background]}
          style={[StyleSheet.absoluteFill, { transform: [{ scale: imageScale }] }]}
          contentFit="cover"
        />
      </View>
      <View style={[styles.header, { paddingTop: safe.top + 6 }]}>
        <Pressable
          accessibilityLabel="Geri"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/controls'))}
          style={styles.headerButton}>
          <Text style={styles.headerText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Glass Lab</Text>
        <Pressable onPress={() => router.push('/glass-tests')} style={styles.headerButton}>
          <Text style={styles.headerTextSmall}>Menü & testler ↗</Text>
        </Pressable>
      </View>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kinds}>
          {(['Cam', 'Buton', 'Slider', 'Toggle', 'Tab bar'] as Kind[]).map((k) => (
            <Pressable
              key={k}
              onPress={() => {
                setKind(k);
                setMessage('');
              }}
              style={[styles.chip, kind === k && styles.selectedChip]}>
              <Text style={{ color: kind === k ? '#fff' : '#102e41', fontWeight: '600' }}>{k}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={styles.preview}>
        {kind === 'Cam' && (
          <AndroidGlassView
            {...glass}
            style={{
              width: previewWidth,
              height: previewHeight,
              opacity,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {showLabel && <Text style={[styles.previewLabel, ink]}>{label}</Text>}
          </AndroidGlassView>
        )}
        {kind === 'Buton' && (
          <AndroidGlassButton
            {...glass}
            interactive={interactive}
            title={label}
            style={{ width: previewWidth, height: Math.min(previewHeight, 120), opacity }}
            onPress={() => setMessage('Butona basıldı')}
          />
        )}
        {kind === 'Slider' && (
          <View style={{ width: width - 64, gap: 12 }}>
            <AndroidGlassSlider
              value={value}
              minimumValue={minimum}
              maximumValue={maximum}
              onValueChange={setValue}
              onSlidingComplete={(v) => setMessage(`Bırakıldı: ${v.toFixed(1)}`)}
              accentColor={accent}
              trackColor={track}
            />
            <Text style={styles.readout}>{value.toFixed(1)}</Text>
          </View>
        )}
        {kind === 'Toggle' && (
          <AndroidGlassToggle
            value={on}
            onValueChange={setOn}
            accentColor={accent}
            trackColor={track}
          />
        )}
        {kind === 'Tab bar' && (
          <AndroidGlassBottomTabs
            {...(tabOverrides ? glass : {})}
            opacity={opacity}
            theme={theme}
            selectedIndex={selected}
            onTabSelected={setSelected}
            minimized={minimized}
            onMinimizedChange={setMinimized}
            accentColor={accent}
            containerColor={container}
            style={{ width: width - 36 }}>
            {Array.from({ length: tabCount }, (_, i) => (
              <AndroidGlassTab
                key={i}
                label={`Tab ${i + 1}`}
                labelStyle={ink}
                icon={<Text style={[{ fontSize: 22 }, ink]}>{['⌂', '♡', '⌕', '☆', '☰'][i]}</Text>}
              />
            ))}
          </AndroidGlassBottomTabs>
        )}
        {!!message && <Text style={styles.toast}>{message}</Text>}
      </View>
      <AndroidGlassView
        theme="light"
        blurRadius={14}
        cornerRadius={30}
        style={[
          styles.settings,
          {
            height: panelExpanded
              ? Math.min(
                  height * 0.43,
                  Math.max(140, (height - keyboardHeight - safe.top - 120) * 0.55)
                )
              : 48,
          },
        ]}>
        <Pressable
          accessibilityLabel="Ayar panelini aç veya kapat"
          onPress={() => setPanelExpanded((v) => !v)}
          style={styles.handle}>
          <View style={styles.handleLine} />
        </Pressable>
        {panelExpanded && (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={styles.settingsContent}>
            {(kind === 'Cam' || kind === 'Buton') && (
              <>
                <NumberControl
                  label="Corner radius"
                  value={values.cornerRadius}
                  min={0}
                  max={150}
                  onChange={(v) => setNumber('cornerRadius', v)}
                />
                <NumberControl
                  label="Blur radius"
                  value={values.blurRadius}
                  min={0}
                  max={60}
                  onChange={(v) => setNumber('blurRadius', v)}
                />
                <NumberControl
                  label="Refraction height"
                  value={values.refractionHeight}
                  min={0}
                  max={100}
                  onChange={(v) => setNumber('refractionHeight', v)}
                />
                <NumberControl
                  label="Refraction amount"
                  value={values.refractionAmount}
                  min={0}
                  max={120}
                  onChange={(v) => setNumber('refractionAmount', v)}
                />
                {(
                  ['chromaticAberration', 'depthEffect', 'vibrancy', 'highlight', 'shadow'] as const
                ).map((key) => (
                  <Flag
                    key={key}
                    label={key}
                    value={values[key]}
                    onChange={(v) => setValues((current) => ({ ...current, [key]: v }))}
                  />
                ))}
                <Text style={styles.section}>Görünüm</Text>
                <Choice
                  values={['Temasız', 'Light', 'Dark']}
                  selected={appearance}
                  onChange={setTheme}
                />
                {kind === 'Buton' && (
                  <Text style={styles.note}>
                    Butonun theme varsayılanı light. Temasız seçim yalnızca GlassView’da doğal camı
                    korur.
                  </Text>
                )}
                <NumberControl
                  label="Genişlik"
                  value={size}
                  min={80}
                  max={Math.floor(width - 40)}
                  onChange={setSize}
                />
                <NumberControl
                  label="En / boy oranı"
                  value={ratio}
                  min={0.5}
                  max={3}
                  step={0.1}
                  onChange={setRatio}
                />
                <NumberControl
                  label="Opacity"
                  value={opacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={setOpacity}
                />
                <Text style={styles.note}>Önizleme ekrana sığacak kadar sınırlandırılır.</Text>
                <ColorControl label="tintColor" value={tint} onChange={setTint} />
                <ColorControl label="surfaceColor" value={surface} onChange={setSurface} />
                <ColorControl label="fallbackColor" value={fallback} onChange={setFallback} />
                <Text style={styles.note}>
                  fallbackColor yalnızca cam efektinin çalışmadığı platformlarda görünür.
                </Text>
                {kind === 'Buton' ? (
                  <Flag label="interactive" value={interactive} onChange={setInteractive} />
                ) : (
                  <Flag label="Önizleme yazısı" value={showLabel} onChange={setShowLabel} />
                )}
                <TextInput
                  accessibilityLabel="Önizleme yazısı"
                  value={label}
                  onChangeText={setLabel}
                  style={styles.textField}
                />
                <Text style={styles.section}>Hazır ayarlar</Text>
                <Choice
                  values={['Doğal', 'Buzlu', 'Mercek', 'Prizma']}
                  selected=""
                  onChange={(p) => {
                    setValues({
                      ...INITIAL,
                      ...(p === 'Buzlu'
                        ? { blurRadius: 24 }
                        : p === 'Mercek'
                          ? { refractionHeight: 28, refractionAmount: 56, depthEffect: true }
                          : p === 'Prizma'
                            ? { refractionAmount: 40, chromaticAberration: true }
                            : {}),
                    });
                    setAppearance('Temasız');
                  }}
                />
              </>
            )}
            {kind === 'Slider' && (
              <>
                <NumberControl
                  label="value"
                  value={value}
                  min={minimum}
                  max={maximum}
                  step={0.1}
                  onChange={setValue}
                />
                <NumberControl
                  label="minimumValue"
                  value={minimum}
                  min={-100}
                  max={maximum - 1}
                  onChange={(v) => {
                    setMinimum(v);
                    setValue((x) => Math.max(x, v));
                  }}
                />
                <NumberControl
                  label="maximumValue"
                  value={maximum}
                  min={minimum + 1}
                  max={200}
                  onChange={(v) => {
                    setMaximum(v);
                    setValue((x) => Math.min(x, v));
                  }}
                />
              </>
            )}
            {kind === 'Toggle' && <Flag label="value" value={on} onChange={setOn} />}
            {(kind === 'Toggle' || kind === 'Slider') && (
              <>
                <Text style={styles.note}>Bu bileşenlere tema uygulanmaz.</Text>
                <ColorControl label="accentColor" value={accent} onChange={setAccent} />
                <ColorControl label="trackColor" value={track} onChange={setTrack} />
              </>
            )}
            {kind === 'Tab bar' && (
              <>
                <Choice
                  values={['Light', 'Dark']}
                  selected={appearance === 'Dark' ? 'Dark' : 'Light'}
                  onChange={setTheme}
                />
                <NumberControl
                  label="Tab sayısı"
                  value={tabCount}
                  min={2}
                  max={5}
                  onChange={(v) => {
                    setTabCount(v);
                    setSelected((i) => Math.min(i, v - 1));
                  }}
                />
                <NumberControl
                  label="selectedIndex"
                  value={selected}
                  min={0}
                  max={tabCount - 1}
                  onChange={setSelected}
                />
                <Flag label="minimized" value={minimized} onChange={setMinimized} />
                <NumberControl
                  label="Opacity"
                  value={opacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={setOpacity}
                />
                <Flag
                  label="Cam değerlerini özelleştir"
                  value={tabOverrides}
                  onChange={(enabled) => {
                    if (enabled)
                      setValues({
                        ...INITIAL,
                        cornerRadius: 32,
                        blurRadius: 9,
                        refractionHeight: 2,
                        refractionAmount: 3,
                        vibrancy: false,
                      });
                    setTabOverrides(enabled);
                  }}
                />
                <Text style={styles.note}>
                  Kapalıyken cam propları gönderilmez. Ayarlar bar yüzeyini etkiler; seçili tabın
                  damlası kendi optiğini korur.
                </Text>
                {tabOverrides && (
                  <>
                    <NumberControl
                      label="cornerRadius"
                      value={values.cornerRadius}
                      min={0}
                      max={150}
                      onChange={(v) => setNumber('cornerRadius', v)}
                    />
                    <NumberControl
                      label="blurRadius"
                      value={values.blurRadius}
                      min={0}
                      max={60}
                      onChange={(v) => setNumber('blurRadius', v)}
                    />
                    <NumberControl
                      label="refractionHeight"
                      value={values.refractionHeight}
                      min={0}
                      max={100}
                      onChange={(v) => setNumber('refractionHeight', v)}
                    />
                    <NumberControl
                      label="refractionAmount"
                      value={values.refractionAmount}
                      min={0}
                      max={120}
                      onChange={(v) => setNumber('refractionAmount', v)}
                    />
                    <Flag
                      label="chromaticAberration"
                      value={values.chromaticAberration}
                      onChange={(v) =>
                        setValues((current) => ({ ...current, chromaticAberration: v }))
                      }
                    />
                    <Flag
                      label="depthEffect"
                      value={values.depthEffect}
                      onChange={(v) => setValues((current) => ({ ...current, depthEffect: v }))}
                    />
                    <Flag
                      label="vibrancy"
                      value={values.vibrancy}
                      onChange={(v) => setValues((current) => ({ ...current, vibrancy: v }))}
                    />
                    <Flag
                      label="highlight"
                      value={values.highlight}
                      onChange={(v) => setValues((current) => ({ ...current, highlight: v }))}
                    />
                    <Flag
                      label="shadow"
                      value={values.shadow}
                      onChange={(v) => setValues((current) => ({ ...current, shadow: v }))}
                    />
                    <ColorControl label="tintColor" value={tint} onChange={setTint} />
                    <ColorControl label="surfaceColor" value={surface} onChange={setSurface} />
                    <ColorControl label="fallbackColor" value={fallback} onChange={setFallback} />
                  </>
                )}

                <ColorControl label="accentColor" value={accent} onChange={setAccent} />
                <ColorControl label="containerColor" value={container} onChange={setContainer} />
              </>
            )}
            <Text style={styles.section}>Arka plan</Text>
            <NumberControl
              label="Resim yakınlaştırma"
              value={imageScale}
              min={1}
              max={3}
              step={0.1}
              onChange={setImageScale}
            />
            <Pressable
              style={styles.secondary}
              onPress={() => {
                setImageUri(undefined);
                setBackground((i) => (i + 1) % BACKGROUNDS.length);
              }}>
              <Text style={styles.settingLabel}>Sonraki örnek arka plan</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={exportValues}>
              <Text style={styles.settingLabel}>Değerleri JSON olarak paylaş</Text>
            </Pressable>
          </ScrollView>
        )}
      </AndroidGlassView>
      <View style={[styles.footer, { paddingBottom: safe.bottom + 10 }]}>
        <Pressable accessibilityLabel="Değerleri sıfırla" onPress={reset} style={styles.reset}>
          <Text style={{ fontSize: 24, color: '#fff' }}>↺</Text>
        </Pressable>
        <AndroidGlassButton
          title="Resim seç"
          tintColor="#008be8"
          onPress={pick}
          style={{ paddingHorizontal: 28 }}
        />
        <Pressable
          accessibilityLabel="Değerleri paylaş"
          onPress={exportValues}
          style={styles.share}>
          <Text style={{ fontSize: 21, color: '#fff' }}>↗</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
function NumberControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(Number(value.toFixed(2)))), [value]);
  const commit = () => {
    const n = Number(draft.replace(',', '.'));
    if (draft.trim() !== '' && Number.isFinite(n)) {
      const next = Number(Math.min(max, Math.max(min, Math.round(n / step) * step)).toFixed(2));
      setDraft(String(next));
      onChange(next);
    } else setDraft(String(value));
  };
  return (
    <View style={styles.control}>
      <View style={styles.labelRow}>
        <Text style={styles.settingLabel}>{label}</Text>
        <TextInput
          accessibilityLabel={`${label} değeri`}
          keyboardType="numbers-and-punctuation"
          selectTextOnFocus
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          style={styles.number}
        />
      </View>
      <AndroidGlassSlider
        accessibilityLabel={label}
        minimumValue={min}
        maximumValue={max}
        value={value}
        onValueChange={(n) => onChange(Number((Math.round(n / step) * step).toFixed(2)))}
      />
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
    <View style={styles.labelRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#008bdf' }} />
    </View>
  );
}
function Choice({
  values,
  selected,
  onChange,
}: {
  values: string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.choices}>
      {values.map((v) => (
        <Pressable
          accessibilityState={{ selected: v === selected }}
          key={v}
          onPress={() => onChange(v)}
          style={[styles.choice, v === selected && { backgroundColor: '#0588d7' }]}>
          <Text style={{ color: v === selected ? 'white' : '#113549' }}>{v}</Text>
        </Pressable>
      ))}
    </View>
  );
}
function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const [hex, setHex] = useState('#0088ff');
  const [alpha, setAlpha] = useState(0.3);
  const valid = /^#[0-9a-f]{6}$/i.test(hex);
  const color = (h: string, a: number) =>
    `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
  return (
    <View style={styles.colorControl}>
      <Flag
        label={label}
        value={value !== undefined}
        onChange={(on) => onChange(on ? color(valid ? hex : '#0088ff', alpha) : undefined)}
      />
      {value !== undefined && (
        <>
          <View style={styles.labelRow}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: value,
                borderWidth: 1,
                borderColor: '#6788',
              }}
            />
            <TextInput
              accessibilityLabel={`${label} hex`}
              autoCapitalize="none"
              value={hex}
              onChangeText={(h) => {
                setHex(h);
                if (/^#[0-9a-f]{6}$/i.test(h)) onChange(color(h, alpha));
              }}
              style={styles.textField}
            />
          </View>
          {!valid && <Text style={styles.note}>#RRGGBB biçiminde 6 haneli renk gir.</Text>}
          <NumberControl
            label="Renk alpha"
            min={0}
            max={1}
            step={0.05}
            value={alpha}
            onChange={(a) => {
              setAlpha(a);
              if (valid) onChange(color(hex, a));
            }}
          />
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#26bacb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  headerButton: { paddingVertical: 5 },
  headerText: { fontSize: 30, color: '#0c2c43' },
  headerTextSmall: { fontSize: 12, color: '#0c2c43', fontWeight: '600' },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0c2c43' },
  kinds: { paddingHorizontal: 16, paddingVertical: 8, gap: 6 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 22,
    backgroundColor: '#ffffff77',
  },
  selectedChip: { backgroundColor: '#007bc3' },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  previewLabel: { fontSize: 18, fontWeight: '600' },
  readout: { textAlign: 'center', fontSize: 22, color: '#fff', fontWeight: '700' },
  toast: {
    position: 'absolute',
    bottom: 6,
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#003b6677',
    padding: 6,
    borderRadius: 9,
  },
  settings: { marginHorizontal: 16, overflow: 'hidden' },
  handle: { height: 24, alignItems: 'center', justifyContent: 'center' },
  handleLine: { height: 4, width: 38, backgroundColor: '#164b6660', borderRadius: 2 },
  settingsContent: { paddingHorizontal: 22, paddingBottom: 24, gap: 12 },
  control: { gap: 1 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 32,
  },
  settingLabel: { fontSize: 14, color: '#102f40', flexShrink: 1 },
  number: {
    fontSize: 13,
    color: '#07517f',
    backgroundColor: '#ffffff50',
    paddingHorizontal: 9,
    paddingVertical: 4,
    minWidth: 54,
    textAlign: 'right',
    borderRadius: 8,
  },
  section: { fontSize: 14, fontWeight: '700', color: '#143e50', marginTop: 10 },
  note: { fontSize: 12, color: '#305b70', lineHeight: 17 },
  textField: {
    flexShrink: 1,
    backgroundColor: '#ffffff66',
    padding: 10,
    borderRadius: 10,
    color: '#102f40',
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choice: { padding: 10, borderRadius: 12, backgroundColor: '#ffffff66' },
  colorControl: { gap: 8 },
  secondary: { padding: 12, borderRadius: 12, backgroundColor: '#ffffff66', alignItems: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  reset: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ed950b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  share: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0087cb',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
