import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { Lang, STRINGS, formatDecimal } from '../i18n';
import { formatTime } from '../physics/egg';
import { colors, font, radius, space } from '../theme';
import { EGG_PATH } from './EggVisual';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 280;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const SCENE = SIZE - 44;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // I förgrunden sköter appens eget larm ljud och vibration.
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface TimerEgg {
  label: string;
  seconds: number;
}

type EggState = 'cooking' | 'due' | 'up';

interface Props {
  /** Sorterade stigande efter koktid. */
  eggs: TimerEgg[];
  waterC: number;
  lang: Lang;
  onClose: () => void;
}

// Larmljud: stigande treklang som loopar tills ägget kvitteras.
const ALARM = require('../../assets/alarm.wav');

export function TimerScreen({ eggs, waterC, lang, onClose }: Props) {
  useKeepAwake();
  const L = STRINGS[lang];
  const alarm = useAudioPlayer(ALARM);
  const total = eggs[eggs.length - 1].seconds;
  const startAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const [states, setStates] = useState<EggState[]>(eggs.map(() => 'cooking'));

  const elapsed = (now - startAt.current) / 1000;
  const done = states.every((s) => s === 'up');
  const dueIndex = states.findIndex((s) => s === 'due');
  const nextIndex = states.findIndex((s) => s === 'cooking');

  // Lokala notiser plingar även om appen hamnar i bakgrunden.
  useEffect(() => {
    (async () => {
      try {
        await Notifications.requestPermissionsAsync();
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('alarm', {
            name: 'Äggtimer',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
          });
        }
        for (const egg of eggs) {
          await Notifications.scheduleNotificationAsync({
            content: { title: L.notifTitle, body: L.notifBody(egg.label), sound: true },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: Math.max(1, egg.seconds),
              channelId: Platform.OS === 'android' ? 'alarm' : undefined,
            },
          });
        }
      } catch {
        // Utan notistillstånd gäller larmet i appen.
      }
    })();
    return () => {
      Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eggs]);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: total * 1000, easing: Easing.linear });
  }, [total, progress]);

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const el = (t - startAt.current) / 1000;
      setStates((prev) =>
        prev.map((s, i) => (s === 'cooking' && el >= eggs[i].seconds ? 'due' : s))
      );
    }, 250);
    return () => clearInterval(id);
  }, [eggs]);

  // Spela larmet även när telefonen står på ljudlöst — en äggklocka måste höras.
  useEffect(() => {
    alarm.loop = true;
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }, [alarm]);

  // Ihållande ljud + vibration så länge något ägg väntar på att tas upp.
  const hasDue = dueIndex >= 0;
  useEffect(() => {
    if (!hasDue) return;
    alarm.seekTo(0).catch(() => {});
    alarm.play();
    const buzz = () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    buzz();
    const id = setInterval(buzz, 1400);
    return () => {
      clearInterval(id);
      alarm.pause();
    };
  }, [hasDue, alarm]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const acknowledge = () => {
    setStates((prev) => {
      const i = prev.findIndex((s) => s === 'due');
      if (i < 0) return prev;
      const nextStates = [...prev];
      nextStates[i] = 'up';
      return nextStates;
    });
  };

  const multi = eggs.length > 1;

  return (
    <View style={styles.container}>
      <Text style={font.label}>{done ? L.finished : hasDue ? L.ready : L.boiling}</Text>

      <View style={styles.ringWrap}>
        <Svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.line} strokeWidth={STROKE} fill="none" />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={colors.yolk}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            animatedProps={ringProps}
            fill="none"
          />
        </Svg>
        <View style={styles.scene}>{done ? <DoneBadge /> : <BoilingScene />}</View>
      </View>

      {done ? (
        <>
          <Text style={styles.time}>{L.ready}</Text>
          <Text style={styles.summary}>{multi ? L.doneRinseN : L.doneRinse1}</Text>
        </>
      ) : hasDue ? (
        <>
          <Text style={styles.dueTime}>{L.takeOut}</Text>
          <Text style={styles.instruction}>{L.isDone(eggs[dueIndex].label)}</Text>
          <Text style={styles.summary}>{L.takeRinse}</Text>
        </>
      ) : (
        <>
          <Text style={styles.time}>
            {formatTime(Math.max(0, Math.ceil(eggs[nextIndex]?.seconds - elapsed || 0)))}
          </Text>
          <Text style={styles.instruction}>
            {multi ? L.nextUp(eggs[nextIndex]?.label ?? '') : L.putIn}
          </Text>
          <Text style={styles.summary}>
            {multi ? `${L.putInAll} · ` : ''}
            {L.waterBoilsAt(formatDecimal(lang, waterC))}
          </Text>
        </>
      )}

      {multi && !done && (
        <View style={styles.rows}>
          {eggs.map((egg, i) => {
            const left = Math.max(0, Math.ceil(egg.seconds - elapsed));
            const s = states[i];
            return (
              <View key={i} style={[styles.rowItem, s === 'due' && styles.rowDue, s === 'up' && styles.rowUp]}>
                <Text style={styles.rowLabel}>{egg.label}</Text>
                <Text style={[styles.rowTime, s === 'due' && styles.rowTimeDue]}>
                  {s === 'up' ? '✓' : s === 'due' ? L.takeOut : formatTime(left)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          done ? styles.buttonPrimary : hasDue ? styles.buttonDue : styles.buttonGhost,
          pressed && { opacity: 0.75 },
        ]}
        onPress={hasDue ? acknowledge : onClose}
      >
        <Text
          style={[
            styles.buttonText,
            done || hasDue ? styles.buttonTextPrimary : styles.buttonTextGhost,
          ]}
        >
          {done ? L.newEggs : hasDue ? L.gotIt : L.cancel}
        </Text>
      </Pressable>
    </View>
  );
}

/** Ägg som guppar i sjudande vatten, med bubblor och vågor. */
function BoilingScene() {
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
  }, [bob]);

  const eggStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -6 + bob.value * 10 },
      { rotate: `${-4 + bob.value * 8}deg` },
    ],
  }));

  return (
    <View style={styles.pot}>
      <Animated.View style={[styles.floatingEgg, eggStyle]}>
        <Svg width={80} height={96} viewBox="0 0 200 240">
          <Defs>
            <RadialGradient id="shell" cx="40%" cy="32%" r="80%">
              <Stop offset="0%" stopColor="#FFFEFB" />
              <Stop offset="100%" stopColor="#EFE7D8" />
            </RadialGradient>
          </Defs>
          <Path d={EGG_PATH} fill="url(#shell)" />
        </Svg>
      </Animated.View>
      <Wave offset={0} duration={5200} opacity={1} height={86} color={colors.water} />
      <Wave offset={160} duration={3600} opacity={0.75} height={72} color={colors.waterDeep} />
      {BUBBLES.map((b, i) => (
        <Bubble key={i} {...b} />
      ))}
    </View>
  );
}

function wavePath(width: number, amp: number): string {
  const seg = 60;
  let d = `M0 ${amp}`;
  for (let x = 0; x < width; x += seg) {
    d += ` Q${x + seg / 4} 0 ${x + seg / 2} ${amp} T${x + seg} ${amp}`;
  }
  return `${d} L${width} 200 L0 200 Z`;
}

function Wave({
  offset,
  duration,
  opacity,
  height,
  color,
}: {
  offset: number;
  duration: number;
  opacity: number;
  height: number;
  color: string;
}) {
  const W = SCENE * 2;
  const shift = useSharedValue(0);
  useEffect(() => {
    shift.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1);
  }, [shift, duration]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -offset - shift.value * 120 }],
  }));

  return (
    <Animated.View style={[styles.wave, { height, opacity }, style]}>
      <Svg width={W + 240} height={height} viewBox={`0 0 ${W + 240} 200`} preserveAspectRatio="none">
        <Path d={wavePath(W + 240, 14)} fill={color} />
      </Svg>
    </Animated.View>
  );
}

const BUBBLES = [
  { x: 0.24, size: 7, duration: 2400, delay: 0 },
  { x: 0.48, size: 5, duration: 1900, delay: 700 },
  { x: 0.66, size: 8, duration: 2800, delay: 300 },
  { x: 0.82, size: 5, duration: 2100, delay: 1200 },
];

function Bubble({ x, size, duration, delay }: (typeof BUBBLES)[number]) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.in(Easing.quad) }), -1)
    );
  }, [t, duration, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -t.value * 58 }],
    opacity: 0.9 - t.value * 0.9,
  }));

  return (
    <Animated.View
      style={[
        styles.bubble,
        { left: x * SCENE, width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

function DoneBadge() {
  const scale = useSharedValue(0.3);
  const halo = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 160 });
    halo.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1);
  }, [scale, halo]);

  const badge = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + halo.value * 0.5 }],
    opacity: 0.35 * (1 - halo.value),
  }));

  return (
    <View style={styles.doneWrap}>
      <Animated.View style={[styles.halo, haloStyle]} />
      <Animated.View style={[styles.badge, badge]}>
        <Svg width={60} height={60} viewBox="0 0 64 64">
          <Path
            d="M16 33 L27 44 L48 22"
            stroke={colors.white}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: space.l,
    gap: space.s + 2,
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scene: {
    position: 'absolute',
    width: SCENE,
    height: SCENE,
    borderRadius: SCENE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pot: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  floatingEgg: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 48,
    zIndex: 1,
  },
  wave: { position: 'absolute', bottom: 0, left: 0, width: SCENE * 2 + 240 },
  bubble: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: '#FFFFFF',
  },
  doneWrap: { alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.yolk,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.yolk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { ...font.timer, fontSize: 60, marginTop: space.xs },
  dueTime: {
    fontSize: 44,
    fontWeight: '600',
    letterSpacing: -1,
    color: colors.yolkDeep,
    marginTop: space.xs,
  },
  instruction: { ...font.body, fontWeight: '600', textAlign: 'center' },
  summary: { ...font.caption, textAlign: 'center', maxWidth: 300, marginTop: -space.xs },
  rows: { width: '100%', maxWidth: 320, gap: 6 },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  rowDue: { borderWidth: 2, borderColor: colors.yolk },
  rowUp: { opacity: 0.55 },
  rowLabel: { fontSize: 14, color: colors.ink },
  rowTime: { fontSize: 14, color: colors.inkSoft, fontVariant: ['tabular-nums'], fontWeight: '500' },
  rowTimeDue: { color: colors.yolkDeep, fontWeight: '700' },
  button: {
    marginTop: space.s,
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: radius.pill,
  },
  buttonPrimary: { backgroundColor: colors.ink },
  buttonDue: {
    backgroundColor: colors.yolk,
    shadowColor: colors.yolkDeep,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonGhost: { borderWidth: 1, borderColor: colors.inkFaint },
  buttonText: { fontSize: 16, fontWeight: '600' },
  buttonTextPrimary: { color: colors.white },
  buttonTextGhost: { color: colors.ink },
});
