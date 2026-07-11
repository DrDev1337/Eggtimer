import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, radius } from '../theme';

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
  sub?: string;
}

interface Props<K extends string> {
  options: SegmentOption<K>[];
  value: K;
  onChange: (key: K) => void;
}

const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };

export function Segmented<K extends string>({ options, value, onChange }: Props<K>) {
  const [width, setWidth] = useState(0);
  const index = options.findIndex((o) => o.key === value);
  const segW = width > 0 ? (width - PAD * 2) / options.length : 0;

  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(Math.max(0, index) * segW, SPRING) }],
    width: segW,
    opacity: segW > 0 && index >= 0 ? 1 : 0,
  }));

  return (
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.indicator, indicator]} />
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} style={styles.segment} onPress={() => onChange(o.key)}>
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
            {o.sub ? (
              <Text style={[styles.sub, active && styles.subActive]}>{o.sub}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const PAD = 4;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.line,
    borderRadius: radius.m,
    padding: PAD,
  },
  indicator: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    backgroundColor: colors.card,
    borderRadius: radius.m - PAD,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 1,
  },
  label: { fontSize: 14, fontWeight: '500', color: colors.inkSoft },
  labelActive: { color: colors.ink, fontWeight: '600' },
  sub: { fontSize: 10, color: colors.inkFaint },
  subActive: { color: colors.inkSoft },
});
