import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from '../theme';

const STEPS: { title: string; text: string }[] = [
  {
    title: 'Ställ in ditt ägg',
    text: '— vikt, kylskåpskallt eller rumsvarmt, önskad konsistens och din höjd över havet.',
  },
  {
    title: 'Koka upp vattnet.',
    text: 'Tiden gäller ägg som läggs i vatten som redan kokar — inte kallt vatten.',
  },
  {
    title: 'Tryck Starta och lägg ner ägget',
    text: 'försiktigt i vattnet, direkt. Använd gärna en sked.',
  },
  {
    title: 'När timern ringer:',
    text: 'spola ägget under kallt vatten så stannar tillagningen.',
  },
];

interface Props {
  visible: boolean;
  /** Första starten: visa "Påminn mig inte igen". */
  firstRun: boolean;
  onClose: (dontRemind: boolean) => void;
}

/** Instruktioner — visas automatiskt vid första starten och via ⓘ-knappen. */
export function InfoModal({ visible, firstRun, onClose }: Props) {
  const [dontRemind, setDontRemind] = useState(true);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <Pressable style={styles.backdrop} onPress={() => onClose(firstRun && dontRemind)}>
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Så kokar du det perfekta ägget</Text>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepN}>
                  <Text style={styles.stepNText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>
                  <Text style={styles.stepTitle}>{s.title}</Text> {s.text}
                </Text>
              </View>
            ))}
            <Text style={styles.fine}>
              Tiden räknas ut med Williams formel från University of Exeter — därför frågar appen
              om vikt, temperatur och höjd över havet.
            </Text>
            {firstRun && (
              <Pressable style={styles.remember} onPress={() => setDontRemind(!dontRemind)}>
                <View style={[styles.checkbox, dontRemind && styles.checkboxOn]}>
                  {dontRemind && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Påminn mig inte igen</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.85 }]}
              onPress={() => onClose(firstRun && dontRemind)}
            >
              <Text style={styles.closeText}>Nu kör vi</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(33, 29, 25, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.m,
  },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.l - 4,
    maxWidth: 380,
    width: '100%',
    maxHeight: '86%',
  },
  inner: { padding: space.m + 4, gap: 14 },
  title: { fontSize: 19, fontWeight: '700', color: colors.ink, letterSpacing: 0.2 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepN: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.yolk,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.ink },
  stepTitle: { fontWeight: '600' },
  fine: { fontSize: 12, lineHeight: 18, color: colors.inkSoft },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.yolk, borderColor: colors.yolk },
  checkmark: { color: colors.white, fontSize: 13, fontWeight: '700', lineHeight: 15 },
  rememberText: { fontSize: 13, color: colors.inkSoft },
  closeButton: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 2,
  },
  closeText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
