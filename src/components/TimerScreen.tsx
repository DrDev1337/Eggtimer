import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { formatTime } from '../physics/egg';
import { colors, font, radius, space } from '../theme';
import { EGG_PATH } from './EggVisual';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 300;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const SCENE = SIZE - 44;

interface Props {
  totalSeconds: number;
  summary: string;
  waterC: number;
  onClose: () => void;
}

export function TimerScreen({ totalSeconds, summary, waterC, onClose }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [done, setDone] = useState(false);
  const endAt = useRef(Date.now() + totalSeconds * 1000);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: totalSeconds * 1000,
      easing: Easing.linear,
    });
  }, [totalSeconds, progress]);

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        setDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View style={styles.container}>
      <Text style={font.label}>{done ? 'Färdigt' : 'Kokar'}</Text>

      <View style={styles.ringWrap}>
        <Svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={colors.line}
            strokeWidth={STROKE}
            fill="none"
          />
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
          <Text style={styles.time}>Klart!</Text>
          <Text style={styles.summary}>
            Spola ägget under kallt vatten så stannar tillagningen.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.time}>{formatTime(remaining)}</Text>
          <Text style={styles.instruction}>Lägg ägget i det kokande vattnet nu.</Text>
          <Text style={styles.summary}>
            {summary} · vattnet kokar vid {waterC.toFixed(1).replace('.', ',')} °C
          </Text>
        </>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          done ? styles.buttonPrimary : styles.buttonGhost,
          pressed && { opacity: 0.7 },
        ]}
        onPress={onClose}
      >
        <Text style={[styles.buttonText, done ? styles.buttonTextPrimary : styles.buttonTextGhost]}>
          {done ? 'Nytt ägg' : 'Avbryt'}
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
        <Svg width={86} height={104} viewBox="0 0 200 240">
          <Defs>
            <RadialGradient id="shell" cx="40%" cy="32%" r="80%">
              <Stop offset="0%" stopColor="#FFFEFB" />
              <Stop offset="100%" stopColor="#EFE7D8" />
            </RadialGradient>
          </Defs>
          <Path d={EGG_PATH} fill="url(#shell)" />
        </Svg>
      </Animated.View>
      <Wave offset={0} duration={5200} opacity={1} height={92} color={colors.water} />
      <Wave offset={160} duration={3600} opacity={0.75} height={78} color={colors.waterDeep} />
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
    transform: [{ translateY: -t.value * 62 }],
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
        <Svg width={64} height={64} viewBox="0 0 64 64">
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
    gap: space.m,
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
    bottom: 52,
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
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.yolk,
  },
  badge: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.yolk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { ...font.timer, marginTop: space.s },
  instruction: { ...font.body, fontWeight: '600', textAlign: 'center' },
  summary: { ...font.caption, textAlign: 'center', maxWidth: 280, marginTop: -space.s },
  button: {
    marginTop: space.m,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: radius.pill,
  },
  buttonPrimary: { backgroundColor: colors.ink },
  buttonGhost: { borderWidth: 1, borderColor: colors.inkFaint },
  buttonText: { fontSize: 16, fontWeight: '600' },
  buttonTextPrimary: { color: colors.white },
  buttonTextGhost: { color: colors.ink },
});
