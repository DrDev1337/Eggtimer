/** Minimalistisk, varm palett — äggskal, kol och äggula. */
export const colors = {
  bg: '#F7F3EC',
  card: '#FFFFFF',
  ink: '#211D19',
  inkSoft: '#988F85',
  inkFaint: '#C4BCB1',
  line: '#EAE3D8',
  yolk: '#F2A03D',
  yolkDeep: '#E07A2F',
  yolkSoft: '#FBD9A5',
  white: '#FFFDF8',
  water: '#DDEDF2',
  waterDeep: '#B8D8E3',
  danger: '#C4553B',
};

export const font = {
  /** Stora, lätta siffror för tidsvisning. */
  timer: { fontSize: 72, fontWeight: '200' as const, letterSpacing: -2, color: colors.ink },
  h1: { fontSize: 24, fontWeight: '600' as const, letterSpacing: 0.2, color: colors.ink },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    color: colors.inkSoft,
  },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.ink },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.inkSoft },
};

export const space = { xs: 6, s: 12, m: 20, l: 28, xl: 40 };
export const radius = { s: 12, m: 18, l: 28, pill: 999 };
