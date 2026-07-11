import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { DonenessKey } from '../physics/egg';
import { colors } from '../theme';

/**
 * Gulans beteende per fasthet: färg, glans, hur mycket den dallrar
 * (wobble) och hur mycket den sjunker ihop av sin egen vikt (sag).
 * En lös gula är blank, dallrig och utflytande; en hårdkokt är blek,
 * matt och ligger blickstilla.
 */
const YOLK: Record<
  DonenessKey,
  { center: string; edge: string; shine: number; wobble: number; sagX: number; sagY: number }
> = {
  soft: { center: '#F58A1F', edge: '#FFC25E', shine: 0.5, wobble: 0.055, sagX: 1.14, sagY: 0.88 },
  creamy: { center: '#F49B2E', edge: '#FCCB6E', shine: 0.32, wobble: 0.032, sagX: 1.07, sagY: 0.94 },
  firm: { center: '#F5B23F', edge: '#FBD787', shine: 0.14, wobble: 0.012, sagX: 1.02, sagY: 0.98 },
  hard: { center: '#F0C464', edge: '#F7E3AC', shine: 0, wobble: 0, sagX: 1, sagY: 1 },
};

export const EGG_PATH =
  'M100 14 C145 14 172 70 172 130 C172 185 140 226 100 226 C60 226 28 185 28 130 C28 70 55 14 100 14 Z';

// Äggets ritstorlek och gulans läge i samma skala.
const W = 152;
const H = 182;
const SCALE = W / 200;
const YOLK_R = 54 * SCALE;
const YOLK_CX = 100 * SCALE;
const YOLK_CY = 142 * SCALE;
const YOLK_BOX = YOLK_R * 2 + 16;

interface Props {
  doneness: DonenessKey;
  grams: number;
}

/** Tvärsnitt av ett ägg — gulan dallrar efter vald fasthet, storleken följer vikten. */
export function EggVisual({ doneness, grams }: Props) {
  const look = YOLK[doneness];
  // 40–90 g mappas till 86–108 % storlek.
  const sizeScale = 0.86 + ((grams - 40) / 50) * 0.22;

  const scale = useSharedValue(sizeScale);
  useEffect(() => {
    scale.value = withSpring(sizeScale, { damping: 14, stiffness: 180 });
  }, [sizeScale, scale]);

  // Evig dallervåg −1…1; amplituden styrs av fastheten.
  const wob = useSharedValue(0);
  useEffect(() => {
    wob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 620, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [wob]);

  const amp = useSharedValue(look.wobble);
  const sagX = useSharedValue(look.sagX);
  const sagY = useSharedValue(look.sagY);
  const pop = useSharedValue(1);
  useEffect(() => {
    amp.value = withTiming(look.wobble, { duration: 400 });
    sagX.value = withSpring(look.sagX, { damping: 11, stiffness: 160 });
    sagY.value = withSpring(look.sagY, { damping: 11, stiffness: 160 });
    pop.value = withSequence(
      withTiming(0.92, { duration: 90 }),
      withSpring(1, { damping: 9, stiffness: 240 })
    );
  }, [doneness, amp, sagX, sagY, pop, look]);

  const outer = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const yolkStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pop.value },
      { scaleX: sagX.value * (1 + amp.value * wob.value) },
      { scaleY: sagY.value * (1 - amp.value * wob.value) },
    ],
  }));

  return (
    <Animated.View style={outer}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H} viewBox="0 0 200 240">
          <Defs>
            <RadialGradient id="eggwhite" cx="50%" cy="42%" r="70%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#F4EEE2" />
            </RadialGradient>
          </Defs>
          <Path d={EGG_PATH} fill="url(#eggwhite)" stroke={colors.line} strokeWidth={3} />
        </Svg>
        <Animated.View style={[styles.yolk, yolkStyle]}>
          <Svg width={YOLK_BOX} height={YOLK_BOX} viewBox={`0 0 ${YOLK_BOX} ${YOLK_BOX}`}>
            <Defs>
              <RadialGradient id="yolkfill" cx="42%" cy="38%" r="72%">
                <Stop offset="0%" stopColor={look.edge} />
                <Stop offset="100%" stopColor={look.center} />
              </RadialGradient>
            </Defs>
            <Circle cx={YOLK_BOX / 2} cy={YOLK_BOX / 2} r={YOLK_R} fill="url(#yolkfill)" />
            {look.shine > 0 && (
              <Ellipse
                cx={YOLK_BOX / 2 - 12}
                cy={YOLK_BOX / 2 - 14}
                rx={13}
                ry={8}
                fill="#FFFFFF"
                opacity={look.shine}
                transform={`rotate(-24 ${YOLK_BOX / 2 - 12} ${YOLK_BOX / 2 - 14})`}
              />
            )}
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  yolk: {
    position: 'absolute',
    left: YOLK_CX - YOLK_BOX / 2,
    top: YOLK_CY - YOLK_BOX / 2,
    width: YOLK_BOX,
    height: YOLK_BOX,
  },
});
