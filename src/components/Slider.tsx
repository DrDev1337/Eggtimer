import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

const KNOB = 26;

/** Minimal slider byggd på PanResponder — fungerar på iOS, Android och webb. */
export function Slider({ min, max, step, value, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const stateRef = useRef({ width: 0, startValue: value });
  stateRef.current.width = width;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const snap = (v: number) => clamp(Math.round(v / step) * step);

  const latest = useRef(value);
  latest.current = value;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        stateRef.current.startValue = latest.current;
      },
      onPanResponderMove: (_e, g) => {
        const w = stateRef.current.width - KNOB;
        if (w <= 0) return;
        const delta = (g.dx / w) * (max - min);
        onChange(snap(stateRef.current.startValue + delta));
      },
    })
  ).current;

  const ratio = (clamp(value) - min) / (max - min);
  const x = ratio * Math.max(0, width - KNOB);

  return (
    <View
      style={styles.container}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      <View style={styles.track} />
      <View style={[styles.fill, { width: x + KNOB / 2 }]} />
      <View style={[styles.knob, { transform: [{ translateX: x }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 40, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.yolk,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
