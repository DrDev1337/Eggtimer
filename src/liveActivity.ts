import * as LA from 'expo-live-activity';
import { Platform } from 'react-native';
import { colors } from './theme';

/**
 * Live Activity — visar en självtickande nedräkning i Dynamic Island och på
 * låsskärmen (iOS 16.2+). Widgeten kommer från expo-live-activity; här ligger
 * bara ett tunt, plattformssäkert lager runt start/uppdatera/stoppa.
 */
const CONFIG: LA.LiveActivityConfig = {
  timerType: 'circular', // ekar appens förloppsring
  backgroundColor: colors.bg,
  titleColor: colors.ink,
  subtitleColor: colors.inkSoft,
  progressViewTint: colors.yolk,
  progressViewLabelColor: colors.ink,
};

const supported = Platform.OS === 'ios';

/** Startar aktiviteten. doneAtMs = epok-ms när ägget är klart (iOS tickar själv). */
export function startEggActivity(title: string, subtitle: string, doneAtMs: number): string | null {
  if (!supported) return null;
  try {
    return LA.startActivity({ title, subtitle, progressBar: { date: doneAtMs } }, CONFIG) ?? null;
  } catch {
    return null;
  }
}

export function updateEggActivity(
  id: string | null,
  title: string,
  subtitle: string,
  doneAtMs?: number
): void {
  if (!supported || !id) return;
  try {
    LA.updateActivity(id, {
      title,
      subtitle,
      ...(doneAtMs ? { progressBar: { date: doneAtMs } } : {}),
    });
  } catch {
    // Aktiviteten kan redan ha avslutats av systemet — ignorera.
  }
}

export function stopEggActivity(id: string | null, title: string): void {
  if (!supported || !id) return;
  try {
    LA.stopActivity(id, { title });
  } catch {
    // ignorera
  }
}
