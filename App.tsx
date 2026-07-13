import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { EggVisual } from './src/components/EggVisual';
import { deviceLang, formatDecimal, Lang, STRINGS } from './src/i18n';
import { InfoModal } from './src/components/InfoModal';
import { Segmented } from './src/components/Segmented';
import { Slider } from './src/components/Slider';
import { TimerScreen, TimerEgg } from './src/components/TimerScreen';
import {
  cookTime,
  DONENESS,
  DonenessKey,
  formatTime,
  SIZES,
  SizeKey,
  START_TEMPS,
  TempKey,
} from './src/physics/egg';
import { colors, font, radius, space } from './src/theme';

const INTRO_KEY = 'aggtimern-intro-seen';
const STATE_KEY = 'aggtimern-state';
const MAX_EGGS = 6;

interface EggConfig {
  doneness: DonenessKey;
  grams: number;
  temp: TempKey;
}

const DEFAULT_EGG: EggConfig = { doneness: 'creamy', grams: 58, temp: 'fridge' };

const sizeLabel = (g: number) => SIZES.find((s) => s.grams === g)?.label ?? `${g} g`;

/** Position → exakt markhöjd via Open-Meteos höjddatabas (GPS-höjd är skakig). */
async function elevationFromCoords(lat: number, lon: number): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`,
      { signal: controller.signal }
    );
    if (!r.ok) throw new Error(`http ${r.status}`);
    const j = await r.json();
    const e = Array.isArray(j.elevation) ? j.elevation[0] : null;
    if (typeof e !== 'number') throw new Error('no elevation');
    return e;
  } finally {
    clearTimeout(timeout);
  }
}

export default function App() {
  const [screen, setScreen] = useState<'setup' | 'timer'>('setup');
  const [eggs, setEggs] = useState<EggConfig[]>([{ ...DEFAULT_EGG }]);
  const [active, setActive] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const [lang, setLang] = useState<Lang>(deviceLang());
  const loaded = useRef(false);
  const L = STRINGS[lang];
  const eggName = (e: EggConfig) => `${L.donenessName[e.doneness]} ${sizeLabel(e.grams)}`;
  const { height: windowH } = useWindowDimensions();
  const compact = windowH < 760;

  // Läs sparat läge + om introduktionen ska visas.
  useEffect(() => {
    (async () => {
      try {
        const [seen, raw] = await Promise.all([
          AsyncStorage.getItem(INTRO_KEY),
          AsyncStorage.getItem(STATE_KEY),
        ]);
        if (!seen) {
          setFirstRun(true);
          setShowInfo(true);
        }
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved.eggs) && saved.eggs.length) {
            const restored = (saved.eggs as EggConfig[])
              .slice(0, MAX_EGGS)
              .filter(
                (e) =>
                  DONENESS.some((d) => d.key === e.doneness) &&
                  START_TEMPS.some((t) => t.key === e.temp)
              )
              .map((e) => ({ ...e, grams: Math.min(90, Math.max(40, Math.round(e.grams) || 58)) }));
            if (restored.length) {
              setEggs(restored);
              setActive(Math.min(restored.length - 1, Math.max(0, saved.active | 0)));
            }
          }
          setAltitude(Math.min(4500, Math.max(0, saved.alt | 0)));
          if (saved.lang === 'sv' || saved.lang === 'en') setLang(saved.lang);
        }
      } catch {
        // Trasig lagring — kör standardinställningar.
      } finally {
        loaded.current = true;
      }
    })();
  }, []);

  // Minns inställningarna mellan starter.
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STATE_KEY, JSON.stringify({ eggs, active, alt: altitude, lang })).catch(
      () => {}
    );
  }, [eggs, active, altitude, lang]);

  const closeInfo = (dontRemind: boolean) => {
    setShowInfo(false);
    setFirstRun(false);
    if (dontRemind) AsyncStorage.setItem(INTRO_KEY, '1').catch(() => {});
  };

  const egg = eggs[active];
  const sizeKey = SIZES.find((s) => s.grams === egg.grams)?.key;
  const selectedDoneness = DONENESS.find((d) => d.key === egg.doneness)!;

  const updateEgg = (patch: Partial<EggConfig>) =>
    setEggs((prev) => prev.map((e, i) => (i === active ? { ...e, ...patch } : e)));

  const results = useMemo(
    () =>
      eggs.map((e) => ({
        egg: e,
        d: DONENESS.find((d) => d.key === e.doneness)!,
        ...cookTime({
          massG: e.grams,
          startTempC: START_TEMPS.find((t) => t.key === e.temp)!.celsius,
          yolkTargetC: DONENESS.find((d) => d.key === e.doneness)!.yolkC,
          altitudeM: altitude,
        }),
      })),
    [eggs, altitude]
  );
  const broken = results.find((r) => r.seconds === null);
  const times = results.map((r) => r.seconds ?? 0).sort((a, b) => a - b);
  const waterC = results[0].waterC;

  const useGps = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(L.errDenied);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let alt: number | null = null;
      try {
        alt = await elevationFromCoords(pos.coords.latitude, pos.coords.longitude);
      } catch {
        alt = pos.coords.altitude; // reservplan: GPS-höjden rakt av
      }
      if (alt == null) {
        setLocationError(L.errNoAlt);
        return;
      }
      setAltitude(Math.min(4500, Math.max(0, Math.round(alt / 5) * 5)));
    } catch {
      setLocationError(L.errNoPos);
    } finally {
      setLocating(false);
    }
  };

  if (screen === 'timer' && !broken) {
    const timerEggs: TimerEgg[] = results
      .map((r) => ({ label: eggName(r.egg), seconds: r.seconds! }))
      .sort((a, b) => a.seconds - b.seconds);
    return (
      <>
        <StatusBar style="dark" />
        <TimerScreen eggs={timerEggs} waterC={waterC} lang={lang} onClose={() => setScreen('setup')} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Pressable
            style={styles.langButton}
            onPress={() => setLang(lang === 'sv' ? 'en' : 'sv')}
            accessibilityLabel="Byt språk / switch language"
          >
            <Text style={styles.langText}>{L.otherLang}</Text>
          </Pressable>
          <Text style={styles.wordmark}>{L.wordmark}</Text>
          <Pressable
            style={styles.infoButton}
            onPress={() => setShowInfo(true)}
            accessibilityLabel="Visa instruktioner"
          >
            <Text style={styles.infoText}>i</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600)} style={styles.eggWrap}>
          <EggVisual doneness={egg.doneness} grams={egg.grams} width={compact ? 98 : 152} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(600)} style={styles.section}>
          <Text style={font.label}>{L.eggsInPot}</Text>
          <View style={styles.chips}>
            {eggs.map((e, i) => (
              <Pressable
                key={i}
                style={[styles.chip, i === active && styles.chipOn]}
                onPress={() => setActive(i)}
              >
                <Text style={[styles.chipText, i === active && styles.chipTextOn]}>
                  {eggName(e)}
                </Text>
                {eggs.length > 1 && (
                  <Pressable
                    hitSlop={8}
                    style={[styles.chipX, i === active && styles.chipXOn]}
                    accessibilityLabel="Ta bort ägget"
                    onPress={() => {
                      setEggs((prev) => prev.filter((_, j) => j !== i));
                      setActive((a) => Math.min(a > i ? a - 1 : a, eggs.length - 2));
                    }}
                  >
                    <Text style={styles.chipXText}>×</Text>
                  </Pressable>
                )}
              </Pressable>
            ))}
            {eggs.length < MAX_EGGS && (
              <Pressable
                style={[styles.chip, styles.chipAdd]}
                onPress={() => {
                  setEggs((prev) => [...prev, { ...egg }]);
                  setActive(eggs.length);
                }}
              >
                <Text style={styles.chipAddText}>{L.addEgg}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(600)} style={[styles.section, styles.divided]}>
          <Text style={font.label}>{L.doneness}</Text>
          <Segmented
            options={DONENESS.map((d) => ({ key: d.key, label: L.donenessName[d.key] }))}
            value={egg.doneness}
            onChange={(k) => updateEgg({ doneness: k })}
          />
          <Text style={styles.hint}>
            {L.yolkCenter(L.donenessDesc[egg.doneness], selectedDoneness.yolkC)}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(600)} style={[styles.section, styles.divided]}>
          <View style={styles.rowBetween}>
            <Text style={font.label}>{L.weight}</Text>
            <Text style={styles.value}>{egg.grams} g</Text>
          </View>
          <Segmented
            options={SIZES.map((s) => ({ key: s.key, label: s.label }))}
            value={sizeKey ?? ('' as SizeKey)}
            onChange={(k) => updateEgg({ grams: SIZES.find((s) => s.key === k)!.grams })}
          />
          <Slider min={40} max={90} step={1} value={egg.grams} onChange={(g) => updateEgg({ grams: g })} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(600)} style={[styles.section, styles.divided]}>
          <Text style={font.label}>{L.startTemp}</Text>
          <Segmented
            options={START_TEMPS.map((t) => ({
              key: t.key,
              label: L.tempName[t.key],
              sub: `${t.celsius} °C`,
            }))}
            value={egg.temp}
            onChange={(k) => updateEgg({ temp: k })}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={[styles.section, styles.divided]}>
          <View style={styles.rowBetween}>
            <Text style={font.label}>{L.altitude}</Text>
            <Pressable style={styles.gpsButton} onPress={useGps} disabled={locating}>
              {locating ? (
                <ActivityIndicator size="small" color={colors.yolkDeep} />
              ) : (
                <Text style={styles.gpsText}>{L.useLocation}</Text>
              )}
            </Pressable>
          </View>
          <Slider min={0} max={4500} step={50} value={altitude} onChange={setAltitude} />
          <Text style={font.caption}>{L.boilInfo(altitude, formatDecimal(lang, waterC))}</Text>
          {locationError && <Text style={styles.error}>{locationError}</Text>}
        </Animated.View>
      </ScrollView>

      <InfoModal visible={showInfo} firstRun={firstRun} lang={lang} onClose={closeInfo} />

      <Animated.View layout={LinearTransition} style={styles.footer}>
        {broken ? (
          <Text style={styles.warning}>
            {L.warning(eggName(broken.egg), altitude, broken.waterC.toFixed(0), broken.d.yolkC)}
          </Text>
        ) : (
          <>
            <View>
              <Text style={font.label}>{L.cookTime}</Text>
              <Text style={styles.footerTime}>{formatTime(times[times.length - 1])}</Text>
              {eggs.length > 1 && (
                <Text style={styles.multiNote}>
                  {L.multiNote(eggs.length, formatTime(times[0]))}
                </Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.85 }]}
              onPress={() => setScreen('timer')}
            >
              <Text style={styles.startText}>{L.start}</Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: space.m,
    paddingTop: Platform.OS === 'android' ? space.xl : space.s,
    paddingBottom: 136,
    gap: 14,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  wordmark: {
    ...font.label,
    textAlign: 'center',
    color: colors.ink,
    letterSpacing: 4,
  },
  infoButton: {
    position: 'absolute',
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.inkSoft,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  langButton: {
    position: 'absolute',
    left: 0,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.inkSoft },
  eggWrap: { alignItems: 'center', marginVertical: -6 },
  section: { gap: 8 },
  scrollCompact: { gap: 8, paddingBottom: 124 },
  divided: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 9 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { ...font.caption, textAlign: 'center' },
  value: { ...font.body, fontVariant: ['tabular-nums'], color: colors.inkSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  chipOn: {
    backgroundColor: colors.card,
    borderColor: colors.card,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.inkSoft },
  chipTextOn: { color: colors.ink, fontWeight: '600' },
  chipX: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipXOn: { backgroundColor: colors.bg },
  chipXText: { fontSize: 11, color: colors.inkSoft, lineHeight: 14 },
  chipAdd: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: colors.inkFaint,
  },
  chipAddText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  gpsButton: {
    borderWidth: 1.5,
    borderColor: colors.yolk,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  gpsText: { fontSize: 12, fontWeight: '600', color: colors.yolkDeep },
  error: { ...font.caption, color: colors.danger },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.m,
    paddingVertical: space.s + 4,
    paddingBottom: Platform.OS === 'ios' ? space.l : space.s + 4,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  footerTime: {
    fontSize: 34,
    fontWeight: '200',
    letterSpacing: -1,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  multiNote: { fontSize: 12, color: colors.inkSoft },
  startButton: {
    backgroundColor: colors.yolk,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: colors.yolkDeep,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  startText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  warning: { ...font.caption, color: colors.danger, flex: 1 },
});
