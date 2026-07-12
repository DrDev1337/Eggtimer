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
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { DonenessKey } from '../physics/egg';
import { colors } from '../theme';

export const EGG_PATH =
  'M100 14 C145 14 172 70 172 130 C172 185 140 226 100 226 C60 226 28 185 28 130 C28 70 55 14 100 14 Z';

/** Utrunnen gula i det löskokta ägget. */
const SPILL_PATH =
  'M64 148 C57 182 68 204 86 209 C96 212 110 211 120 205 C135 197 142 174 136 148 Z';

/** Dallret: löskokt skakar mest, hårdkokt ligger still. */
const WOBBLE: Record<DonenessKey, { amp: number; sagX: number; sagY: number }> = {
  soft: { amp: 0.03, sagX: 1.06, sagY: 0.96 },
  creamy: { amp: 0.018, sagX: 1.03, sagY: 0.98 },
  firm: { amp: 0.007, sagX: 1.01, sagY: 0.995 },
  hard: { amp: 0, sagX: 1, sagY: 1 },
};

const W = 152;
const H = 182;

interface Props {
  doneness: DonenessKey;
  grams: number;
}

/**
 * Tvärsnitt av ett ägg, ritat som konsistensen faktiskt ser ut:
 * löskokt med blank gula som runnit ut, krämig med smält kärna,
 * fast men fuktig, hårdkokt blek och matt.
 */
export function EggVisual({ doneness, grams }: Props) {
  // 40–90 g mappas till 86–108 % storlek.
  const sizeScale = 0.86 + ((grams - 40) / 50) * 0.22;
  const look = WOBBLE[doneness];

  const scale = useSharedValue(sizeScale);
  useEffect(() => {
    scale.value = withSpring(sizeScale, { damping: 14, stiffness: 180 });
  }, [sizeScale, scale]);

  const wob = useSharedValue(0);
  const ooze = useSharedValue(0);
  useEffect(() => {
    wob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 700, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    ooze.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [wob, ooze]);

  const amp = useSharedValue(look.amp);
  const sagX = useSharedValue(look.sagX);
  const sagY = useSharedValue(look.sagY);
  const pop = useSharedValue(1);
  useEffect(() => {
    amp.value = withTiming(look.amp, { duration: 400 });
    sagX.value = withSpring(look.sagX, { damping: 11, stiffness: 160 });
    sagY.value = withSpring(look.sagY, { damping: 11, stiffness: 160 });
    pop.value = withSequence(
      withTiming(0.94, { duration: 90 }),
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
  const oozeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ooze.value * 2.5 }],
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
        <Animated.View style={[StyleSheet.absoluteFill, yolkStyle]}>
          {doneness === 'soft' && (
            <Animated.View style={[StyleSheet.absoluteFill, oozeStyle]}>
              <Svg width={W} height={H} viewBox="0 0 200 240">
                <Defs>
                  <LinearGradient id="spill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#EF820E" />
                    <Stop offset="100%" stopColor="#FCA33C" />
                  </LinearGradient>
                </Defs>
                <Path d={SPILL_PATH} fill="url(#spill)" />
                <Ellipse
                  cx={112}
                  cy={192}
                  rx={10}
                  ry={4.5}
                  fill="#FFFFFF"
                  opacity={0.26}
                  transform="rotate(-14 112 192)"
                />
              </Svg>
            </Animated.View>
          )}
          <Svg width={W} height={H} viewBox="0 0 200 240">
            <Defs>
              <RadialGradient id="ySoft" cx="40%" cy="34%" r="75%">
                <Stop offset="0%" stopColor="#FFB648" />
                <Stop offset="70%" stopColor="#F68A14" />
                <Stop offset="100%" stopColor="#E87607" />
              </RadialGradient>
              <RadialGradient id="yCreamy" cx="42%" cy="36%" r="74%">
                <Stop offset="0%" stopColor="#FBC866" />
                <Stop offset="100%" stopColor="#F0932B" />
              </RadialGradient>
              <RadialGradient id="yCore" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#E87D13" />
                <Stop offset="75%" stopColor="#EC8C20" />
                <Stop offset="100%" stopColor="#F0932B" />
              </RadialGradient>
              <RadialGradient id="yFirm" cx="44%" cy="38%" r="72%">
                <Stop offset="0%" stopColor="#FBDA8B" />
                <Stop offset="100%" stopColor="#F2AE40" />
              </RadialGradient>
              <RadialGradient id="yHard" cx="46%" cy="42%" r="70%">
                <Stop offset="0%" stopColor="#F6E4AB" />
                <Stop offset="100%" stopColor="#EEC964" />
              </RadialGradient>
            </Defs>

            {doneness === 'soft' && (
              <>
                <Circle cx={100} cy={126} r={48} fill="url(#ySoft)" />
                <Ellipse
                  cx={84}
                  cy={106}
                  rx={15}
                  ry={9.5}
                  fill="#FFFFFF"
                  opacity={0.55}
                  transform="rotate(-22 84 106)"
                />
                <Ellipse
                  cx={116}
                  cy={146}
                  rx={7}
                  ry={4}
                  fill="#FFFFFF"
                  opacity={0.22}
                  transform="rotate(28 116 146)"
                />
              </>
            )}
            {doneness === 'creamy' && (
              <>
                <Circle cx={100} cy={127} r={48} fill="url(#yCreamy)" />
                <Circle cx={101} cy={133} r={27} fill="url(#yCore)" />
                <Ellipse
                  cx={85}
                  cy={108}
                  rx={13}
                  ry={8}
                  fill="#FFFFFF"
                  opacity={0.32}
                  transform="rotate(-22 85 108)"
                />
              </>
            )}
            {doneness === 'firm' && (
              <>
                <Circle cx={100} cy={127} r={48} fill="url(#yFirm)" />
                <Ellipse
                  cx={86}
                  cy={110}
                  rx={12}
                  ry={7}
                  fill="#FFFFFF"
                  opacity={0.14}
                  transform="rotate(-22 86 110)"
                />
              </>
            )}
            {doneness === 'hard' && (
              <>
                <Circle cx={100} cy={127} r={48} fill="url(#yHard)" />
                <Circle cx={86} cy={118} r={2.4} fill="#F9EDC4" opacity={0.5} />
                <Circle cx={108} cy={104} r={1.9} fill="#F9EDC4" opacity={0.45} />
                <Circle cx={115} cy={140} r={2.6} fill="#F9EDC4" opacity={0.4} />
                <Circle cx={94} cy={150} r={2} fill="#F9EDC4" opacity={0.45} />
                <Circle cx={76} cy={136} r={1.7} fill="#F9EDC4" opacity={0.4} />
              </>
            )}
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
