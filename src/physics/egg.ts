/**
 * Äggfysik — baserad på Charles D. H. Williams formel (University of Exeter),
 * publicerad i New Scientist (1998). Modellerar ägget som en sfär med jämn
 * värmeledning och beräknar tiden tills gulans mitt når måltemperaturen.
 *
 *   t = K · M^(2/3) · ln( 0.76 · (T_vatten − T_ägg) / (T_vatten − T_gula) )
 *
 *   t        koktid i minuter
 *   M        äggets massa i gram
 *   T_vatten vattnets temperatur (kokpunkten vid aktuell höjd)
 *   T_ägg    äggets starttemperatur
 *   T_gula   måltemperatur i gulans mitt
 *
 * Faktorn 0.76 följer av den sfäriska geometrin. Williams teoretiska
 * konstant (~0.451 min/g^⅔, ur c ≈ 3.7 J/gK, ρ ≈ 1.038 g/cm³,
 * K ≈ 5.4·10⁻³ W/cmK) gav i praktiken för korta tider — äggen blev
 * lösare än avsett. K är därför kalibrerad till 0.590 mot etablerade
 * koktabeller (Serious Eats, RecipeTin Eats m.fl.): ett stort ägg
 * (58 g) från kylen i kokande vatten blir löskokt på 6:00, krämigt på
 * 7:15, fast på 9:30 och hårdkokt på 11:30 — i linje med konsensus.
 * Formelns form är oförändrad, så vikt, starttemperatur och höjd
 * skalar fortfarande fysikaliskt korrekt runt den kalibreringen.
 * Antagande: ägget läggs i redan kokande vatten.
 */
const WILLIAMS_K = 0.59;

export type SizeKey = 's' | 'm' | 'l' | 'xl';

/** EU:s viktklasser för ägg, med typvikt per klass. */
export const SIZES: { key: SizeKey; label: string; grams: number; range: string }[] = [
  { key: 's', label: 'S', grams: 48, range: '< 53 g' },
  { key: 'm', label: 'M', grams: 58, range: '53–63 g' },
  { key: 'l', label: 'L', grams: 68, range: '63–73 g' },
  { key: 'xl', label: 'XL', grams: 78, range: '> 73 g' },
];

export type TempKey = 'fridge' | 'room';

/** Snabbval; exakt temperatur kan sedan finjusteras med reglaget (0–30 °C). */
export const START_TEMPS: { key: TempKey; celsius: number }[] = [
  { key: 'fridge', celsius: 4 },
  { key: 'room', celsius: 20 },
];

export const TEMP_MIN = 0;
export const TEMP_MAX = 30;

/** Reglagets tak: Mount Everests topp, 8 849 m (mätning 2020). */
export const ALT_MAX = 8849;

export type DonenessKey = 'soft' | 'creamy' | 'firm' | 'hard';

/**
 * Måltemperaturer i gulans mitt. Gulan börjar tjockna ~63 °C,
 * är krämig/"jammy" runt 67 °C, mjukt fast ~71 °C och helt fast ~77 °C.
 * (Namnen som visas för användaren ligger i src/i18n.ts.)
 */
export const DONENESS: { key: DonenessKey; yolkC: number }[] = [
  { key: 'soft', yolkC: 63 },
  { key: 'creamy', yolkC: 68 },
  { key: 'firm', yolkC: 75 },
  { key: 'hard', yolkC: 80 },
];

/**
 * Vattnets kokpunkt (°C) vid given höjd över havet.
 * Barometriska formeln ger lufttrycket, Clausius–Clapeyron kokpunkten.
 * ~0,34 °C lägre per 100 m: havsnivå 100 °C, Denver (1600 m) ≈ 94,7 °C,
 * Mount Everest (8849 m) ≈ 71 °C.
 */
export function boilingPointC(altitudeM: number): number {
  const P0 = 101.325; // kPa vid havsnivå
  const p = P0 * Math.pow(1 - 2.25577e-5 * altitudeM, 5.25588);
  const T0 = 373.15; // K
  const R = 8.3145; // J/(mol·K)
  const dHvap = 40660; // J/mol, vattnets ångbildningsentalpi
  const T = 1 / (1 / T0 - (R * Math.log(p / P0)) / dHvap);
  return T - 273.15;
}

export interface CookInput {
  massG: number;
  startTempC: number;
  yolkTargetC: number;
  altitudeM: number;
}

export interface CookResult {
  /** Koktid i sekunder, eller null om måltemperaturen inte kan nås. */
  seconds: number | null;
  waterC: number;
}

/** Williams formel, med höjdkorrigerad vattentemperatur. */
export function cookTime({ massG, startTempC, yolkTargetC, altitudeM }: CookInput): CookResult {
  const waterC = boilingPointC(altitudeM);
  // Gulan kan aldrig bli varmare än vattnet — på extrem höjd är
  // t.ex. ett hårdkokt ägg fysikaliskt omöjligt.
  if (yolkTargetC >= waterC - 1) {
    return { seconds: null, waterC };
  }
  const ratio = (0.76 * (waterC - startTempC)) / (waterC - yolkTargetC);
  if (ratio <= 1) {
    return { seconds: 0, waterC };
  }
  const minutes = WILLIAMS_K * Math.pow(massG, 2 / 3) * Math.log(ratio);
  return { seconds: Math.round(minutes * 60), waterC };
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
