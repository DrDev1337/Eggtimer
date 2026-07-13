import { getLocales } from 'expo-localization';
import { DonenessKey, TempKey } from './physics/egg';

export type Lang = 'sv' | 'en';

/** Telefonens språk styr förvalet; svenska för svenska enheter, annars engelska. */
export function deviceLang(): Lang {
  try {
    return getLocales()[0]?.languageCode === 'sv' ? 'sv' : 'en';
  } catch {
    return 'sv';
  }
}

export interface Strings {
  wordmark: string;
  eggsInPot: string;
  addEgg: string;
  doneness: string;
  weight: string;
  startTemp: string;
  altitude: string;
  donenessName: Record<DonenessKey, string>;
  donenessDesc: Record<DonenessKey, string>;
  yolkCenter: (desc: string, c: number) => string;
  tempName: Record<TempKey, string>;
  useLocation: string;
  boilInfo: (m: number, c: string) => string;
  cookTime: string;
  multiNote: (n: number, t: string) => string;
  warning: (name: string, alt: number, w: string, y: number) => string;
  start: string;
  boiling: string;
  ready: string;
  finished: string;
  takeOut: string;
  putIn: string;
  putInAll: string;
  waterBoilsAt: (c: string) => string;
  nextUp: (l: string) => string;
  isDone: (l: string) => string;
  takeRinse: string;
  gotIt: string;
  cancel: string;
  newEggs: string;
  doneRinse1: string;
  doneRinseN: string;
  notifTitle: string;
  notifBody: (l: string) => string;
  errDenied: string;
  errNoAlt: string;
  errNoPos: string;
  introTitle: string;
  steps: [string, string][];
  introFine: string;
  dontRemind: string;
  letsGo: string;
  otherLang: string;
}

export const STRINGS: Record<Lang, Strings> = {
  sv: {
    wordmark: 'ÄGGTIMERN',
    eggsInPot: 'Ägg i kastrullen',
    addEgg: '+ Lägg till ägg',
    doneness: 'Konsistens',
    weight: 'Vikt',
    startTemp: 'Starttemperatur',
    altitude: 'Höjd över havet',
    donenessName: { soft: 'Löskokt', creamy: 'Krämig', firm: 'Fast', hard: 'Hårdkokt' },
    donenessDesc: {
      soft: 'Rinnande gula',
      creamy: 'Tjock, gyllene kräm',
      firm: 'Fast men fuktig gula',
      hard: 'Helt genomkokt',
    },
    yolkCenter: (desc, c) => `${desc} · ${c} °C i gulans mitt`,
    tempName: { fridge: 'Kylskåpskallt', room: 'Rumsvarmt' },
    useLocation: 'Använd min position',
    boilInfo: (m, c) => `${m} m över havet · vattnet kokar vid ${c} °C`,
    cookTime: 'Koktid i kokande vatten',
    multiNote: (n, t) => `${n} ägg · första klart ${t}`,
    warning: (name, alt, w, y) =>
      `${name}: på ${alt} m kokar vattnet vid ${w} °C — gulan kan aldrig nå ${y} °C. Välj en lösare konsistens.`,
    start: 'Starta',
    boiling: 'Kokar',
    ready: 'Klart!',
    finished: 'Färdigt',
    takeOut: 'Ta upp!',
    putIn: 'Lägg ägget i det kokande vattnet nu.',
    putInAll: 'Lägg ner alla äggen samtidigt',
    waterBoilsAt: (c) => `vattnet kokar vid ${c} °C`,
    nextUp: (l) => `Näst upp: ${l}`,
    isDone: (l) => `${l} är färdigt`,
    takeRinse: 'Ta upp det och spola kallt.',
    gotIt: 'Upptaget ✓',
    cancel: 'Avbryt',
    newEggs: 'Nya ägg',
    doneRinse1: 'Spola ägget under kallt vatten så stannar tillagningen.',
    doneRinseN: 'Alla ägg upptagna. Spola dem under kallt vatten så stannar tillagningen.',
    notifTitle: 'Äggtimern',
    notifBody: (l) => `Ta upp: ${l}!`,
    errDenied: 'Platsåtkomst nekades — dra i reglaget i stället.',
    errNoAlt: 'Ingen höjddata gick att hämta — dra i reglaget i stället.',
    errNoPos: 'Kunde inte hämta position — dra i reglaget i stället.',
    introTitle: 'Så kokar du det perfekta ägget',
    steps: [
      [
        'Ställ in dina ägg',
        ' — vikt, kylskåpskallt eller rumsvarmt, önskad konsistens och din höjd över havet. Lägg till fler ägg med + om ni är flera.',
      ],
      ['Koka upp vattnet.', ' Tiden gäller ägg som läggs i vatten som redan kokar — inte kallt vatten.'],
      ['Tryck Starta och lägg ner alla ägg samtidigt', ', försiktigt. Använd gärna en sked.'],
      [
        'Larmet ringer när varje ägg är klart',
        ' — ta upp det och spola det under kallt vatten så stannar tillagningen.',
      ],
    ],
    introFine:
      'Tiden räknas ut med Williams formel från University of Exeter — därför frågar appen om vikt, temperatur och höjd över havet.',
    dontRemind: 'Påminn mig inte igen',
    letsGo: 'Nu kör vi',
    otherLang: 'EN',
  },
  en: {
    wordmark: 'EGG TIMER',
    eggsInPot: 'Eggs in the pot',
    addEgg: '+ Add egg',
    doneness: 'Doneness',
    weight: 'Weight',
    startTemp: 'Starting temperature',
    altitude: 'Altitude',
    donenessName: { soft: 'Soft', creamy: 'Jammy', firm: 'Firm', hard: 'Hard' },
    donenessDesc: {
      soft: 'Runny yolk',
      creamy: 'Thick golden custard',
      firm: 'Set but moist yolk',
      hard: 'Cooked through',
    },
    yolkCenter: (desc, c) => `${desc} · ${c} °C at the yolk centre`,
    tempName: { fridge: 'Fridge-cold', room: 'Room temp' },
    useLocation: 'Use my location',
    boilInfo: (m, c) => `${m} m above sea level · water boils at ${c} °C`,
    cookTime: 'Cook time in boiling water',
    multiNote: (n, t) => `${n} eggs · first ready in ${t}`,
    warning: (name, alt, w, y) =>
      `${name}: at ${alt} m water boils at ${w} °C — the yolk can never reach ${y} °C. Choose a softer doneness.`,
    start: 'Start',
    boiling: 'Boiling',
    ready: 'Ready!',
    finished: 'Done',
    takeOut: 'Take out!',
    putIn: 'Put the egg into the boiling water now.',
    putInAll: 'Put all the eggs in at the same time',
    waterBoilsAt: (c) => `water boils at ${c} °C`,
    nextUp: (l) => `Next up: ${l}`,
    isDone: (l) => `${l} is ready`,
    takeRinse: 'Take it out and rinse it cold.',
    gotIt: 'Got it ✓',
    cancel: 'Cancel',
    newEggs: 'New eggs',
    doneRinse1: 'Rinse the egg under cold water to stop the cooking.',
    doneRinseN: 'All eggs out. Rinse them under cold water to stop the cooking.',
    notifTitle: 'Egg Timer',
    notifBody: (l) => `Take out: ${l}!`,
    errDenied: 'Location access denied — use the slider instead.',
    errNoAlt: 'Could not fetch altitude data — use the slider instead.',
    errNoPos: 'Could not get your location — use the slider instead.',
    introTitle: 'How to boil the perfect egg',
    steps: [
      [
        'Set up your eggs',
        ' — weight, fridge-cold or room temperature, desired doneness and your altitude. Add more eggs with + if you are cooking for several.',
      ],
      [
        'Bring the water to a boil.',
        ' The time applies to eggs lowered into already boiling water — not cold water.',
      ],
      ['Press Start and lower all the eggs at once', ', gently. A spoon helps.'],
      [
        'The alarm rings as each egg gets ready',
        ' — take it out and rinse it under cold water to stop the cooking.',
      ],
    ],
    introFine:
      'The time is computed with the Williams formula from the University of Exeter — that is why the app asks about weight, temperature and altitude.',
    dontRemind: "Don't remind me again",
    letsGo: "Let's go",
    otherLang: 'SV',
  },
};

/** Decimaltal med rätt avskiljare för språket. */
export const formatDecimal = (lang: Lang, n: number, d = 1) =>
  n.toFixed(d).replace('.', lang === 'sv' ? ',' : '.');
