import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { DonenessKey } from '../physics/egg';
import { colors } from '../theme';

/** Gulans utseende per fasthet: färg i mitten, färg i kanten, glans. */
const YOLK_STYLE: Record<DonenessKey, { center: string; edge: string; shine: number }> = {
  soft: { center: '#F58A1F', edge: '#FFC25E', shine: 0.5 },
  creamy: { center: '#F49B2E', edge: '#FCCB6E', shine: 0.32 },
  firm: { center: '#F5B23F', edge: '#FBD787', shine: 0.14 },
  hard: { center: '#F0C464', edge: '#F7E3AC', shine: 0 },
};

export const EGG_PATH =
  'M100 14 C145 14 172 70 172 130 C172 185 140 226 100 226 C60 226 28 185 28 130 C28 70 55 14 100 14 Z';

interface Props {
  doneness: DonenessKey;
  grams: number;
}

/** Tvärsnitt av ett ägg — gulan speglar vald fasthet, storleken vikten. */
export function EggVisual({ doneness, grams }: Props) {
  const style = YOLK_STYLE[doneness];
  // 40–90 g mappas till 86–108 % storlek.
  const sizeScale = 0.86 + ((grams - 40) / 50) * 0.22;

  const pop = useSharedValue(1);
  useEffect(() => {
    pop.value = withSequence(
      withTiming(0.94, { duration: 90 }),
      withSpring(1, { damping: 9, stiffness: 240 })
    );
  }, [doneness, pop]);

  const scale = useSharedValue(sizeScale);
  useEffect(() => {
    scale.value = withSpring(sizeScale, { damping: 14, stiffness: 180 });
  }, [sizeScale, scale]);

  const outer = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const yolkPop = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View style={outer}>
      <Animated.View style={yolkPop}>
        <Svg width={190} height={228} viewBox="0 0 200 240">
          <Defs>
            <RadialGradient id="yolk" cx="42%" cy="38%" r="72%">
              <Stop offset="0%" stopColor={style.edge} />
              <Stop offset="100%" stopColor={style.center} />
            </RadialGradient>
            <RadialGradient id="white" cx="50%" cy="42%" r="70%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#F4EEE2" />
            </RadialGradient>
          </Defs>
          <Path d={EGG_PATH} fill="url(#white)" stroke={colors.line} strokeWidth={2.5} />
          <Circle cx={100} cy={142} r={54} fill="url(#yolk)" />
          {style.shine > 0 && (
            <Ellipse
              cx={82}
              cy={122}
              rx={20}
              ry={13}
              fill="#FFFFFF"
              opacity={style.shine}
              transform="rotate(-24 82 122)"
            />
          )}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
