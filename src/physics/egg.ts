/**
 * Äggfysik — baserad på Charles D. H. Williams formel (University of Exeter),
 * publicerad i New Scientist (1998). Modellerar ägget som en sfär med jämn
 * värmeledning och beräknar tiden tills gulans mitt når måltemperaturen.
 *
 *   t = 0.451 · M^(2/3) · ln( 0.76 · (T_vatten − T_ägg) / (T_vatten − T_gula) )
 *
 *   t        koktid i minuter
 *   M        äggets massa i gram
 *   T_vatten vattnets temperatur (kokpunkten vid aktuell höjd)
 *   T_ägg    äggets starttemperatur
 *   T_gula   måltemperatur i gulans mitt
 *
 * Konstanten 0.451 min/g^(2/3) följer av äggets termiska egenskaper
 * (c ≈ 3.7 J/gK, ρ ≈ 1.038 g/cm³, K ≈ 5.4·10⁻³ W/cmK) och 0.76 av
 * den sfäriska geometrin. Antagande: ägget läggs i redan kokande vatten.
 */

export type SizeKey = 's' | 'm' | 'l' | 'xl';

/** EU:s viktklasser för ägg, med typvikt per klass. */
export const SIZES: { key: SizeKey; label: string; grams: number; range: string }[] = [
  { key: 's', label: 'S', grams: 48, range: '< 53 g' },
  { key: 'm', label: 'M', grams: 58, range: '53–63 g' },
  { key: 'l', label: 'L', grams: 68, range: '63–73 g' },
  { key: 'xl', label: 'XL', grams: 78, range: '> 73 g' },
];

export type TempKey = 'fridge' | 'room';

export const START_TEMPS: { key: TempKey; label: string; celsius: number }[] = [
  { key: 'fridge', label: 'Kylskåpskallt', celsius: 4 },
  { key: 'room', label: 'Rumsvarmt', celsius: 20 },
];

export type DonenessKey = 'soft' | 'creamy' | 'firm' | 'hard';

/**
 * Måltemperaturer i gulans mitt. Gulan börjar tjockna ~63 °C,
 * är krämig/"jammy" runt 67 °C, mjukt fast ~71 °C och helt fast ~77 °C.
 */
export const DONENESS: {
  key: DonenessKey;
  label: string;
  description: string;
  yolkC: number;
}[] = [
  { key: 'soft', label: 'Löskokt', description: 'Rinnande gula', yolkC: 63 },
  { key: 'creamy', label: 'Krämig', description: 'Tjock, gyllene kräm', yolkC: 67 },
  { key: 'firm', label: 'Fast', description: 'Fast men fuktig gula', yolkC: 71 },
  { key: 'hard', label: 'Hårdkokt', description: 'Helt genomkokt', yolkC: 77 },
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
  const minutes = 0.451 * Math.pow(massG, 2 / 3) * Math.log(ratio);
  return { seconds: Math.round(minutes * 60), waterC };
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
