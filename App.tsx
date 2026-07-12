import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { EggVisual } from './src/components/EggVisual';
import { Segmented } from './src/components/Segmented';
import { Slider } from './src/components/Slider';
import { TimerScreen } from './src/components/TimerScreen';
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

export default function App() {
  const [screen, setScreen] = useState<'setup' | 'timer'>('setup');
  const [doneness, setDoneness] = useState<DonenessKey>('creamy');
  const [grams, setGrams] = useState(58);
  const [temp, setTemp] = useState<TempKey>('fridge');
  const [altitude, setAltitude] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const sizeKey = SIZES.find((s) => s.grams === grams)?.key;
  const selectedDoneness = DONENESS.find((d) => d.key === doneness)!;
  const startTemp = START_TEMPS.find((t) => t.key === temp)!;

  const result = useMemo(
    () =>
      cookTime({
        massG: grams,
        startTempC: startTemp.celsius,
        yolkTargetC: selectedDoneness.yolkC,
        altitudeM: altitude,
      }),
    [grams, startTemp, selectedDoneness, altitude]
  );

  const useGps = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Platsåtkomst nekades — dra i reglaget i stället.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (pos.coords.altitude == null) {
        setLocationError('Ingen höjddata från GPS:en — dra i reglaget i stället.');
        return;
      }
      setAltitude(Math.max(0, Math.round(pos.coords.altitude / 10) * 10));
    } catch {
      setLocationError('Kunde inte hämta position — dra i reglaget i stället.');
    } finally {
      setLocating(false);
    }
  };

  if (screen === 'timer' && result.seconds) {
    return (
      <>
        <StatusBar style="dark" />
        <TimerScreen
          totalSeconds={result.seconds}
          summary={`${selectedDoneness.label} · ${grams} g · ${startTemp.label.toLowerCase()}`}
          waterC={result.waterC}
          onClose={() => setScreen('setup')}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Text style={styles.wordmark}>ÄGGTIMERN</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600)} style={styles.eggWrap}>
          <EggVisual doneness={doneness} grams={grams} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.section}>
          <Text style={font.label}>Konsistens</Text>
          <Segmented options={DONENESS} value={doneness} onChange={setDoneness} />
          <Text style={styles.hint}>
            {selectedDoneness.description} · {selectedDoneness.yolkC} °C i gulans mitt
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={font.label}>Vikt</Text>
            <Text style={styles.value}>{grams} g</Text>
          </View>
          <Segmented
            options={SIZES.map((s) => ({ key: s.key, label: s.label }))}
            value={sizeKey ?? ('' as SizeKey)}
            onChange={(k) => setGrams(SIZES.find((s) => s.key === k)!.grams)}
          />
          <Slider min={40} max={90} step={1} value={grams} onChange={setGrams} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(600)} style={styles.section}>
          <Text style={font.label}>Starttemperatur</Text>
          <Segmented
            options={START_TEMPS.map((t) => ({
              key: t.key,
              label: t.label,
              sub: `${t.celsius} °C`,
            }))}
            value={temp}
            onChange={setTemp}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(600)} style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={font.label}>Höjd över havet</Text>
            <Text style={styles.value}>{altitude} m</Text>
          </View>
          <Slider min={0} max={4500} step={50} value={altitude} onChange={setAltitude} />
          <View style={styles.rowBetween}>
            <Text style={font.caption}>
              Vattnet kokar vid {result.waterC.toFixed(1).replace('.', ',')} °C
            </Text>
            <Pressable style={styles.gpsButton} onPress={useGps} disabled={locating}>
              {locating ? (
                <ActivityIndicator size="small" color={colors.yolkDeep} />
              ) : (
                <Text style={styles.gpsText}>Använd min position</Text>
              )}
            </Pressable>
          </View>
          {locationError && <Text style={styles.error}>{locationError}</Text>}
        </Animated.View>
      </ScrollView>

      <Animated.View layout={LinearTransition} style={styles.footer}>
        {result.seconds === null ? (
          <Text style={styles.warning}>
            På {altitude} m kokar vattnet vid {result.waterC.toFixed(0)} °C — gulan kan aldrig nå{' '}
            {selectedDoneness.yolkC} °C. Välj en lösare konsistens.
          </Text>
        ) : (
          <>
            <View>
              <Text style={font.label}>Koktid i kokande vatten</Text>
              <Text style={styles.footerTime}>{formatTime(result.seconds)}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.85 }]}
              onPress={() => setScreen('timer')}
            >
              <Text style={styles.startText}>Starta</Text>
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
    paddingBottom: 104,
    gap: 18,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  wordmark: {
    ...font.label,
    textAlign: 'center',
    color: colors.ink,
    letterSpacing: 4,
  },
  eggWrap: { alignItems: 'center', marginVertical: -2 },
  section: { gap: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { ...font.caption, textAlign: 'center' },
  value: { ...font.body, fontVariant: ['tabular-nums'], color: colors.inkSoft },
  gpsButton: {
    borderWidth: 1.5,
    borderColor: colors.yolk,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
    minWidth: 110,
    alignItems: 'center',
  },
  gpsText: { fontSize: 13, fontWeight: '600', color: colors.yolkDeep },
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
    paddingVertical: space.s + 2,
    paddingBottom: Platform.OS === 'ios' ? space.l : space.s + 2,
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
