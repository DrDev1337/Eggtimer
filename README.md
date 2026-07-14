# Äggtimern 🥚

Den ultimata äggklockan — en minimalistisk mobilapp (Expo/React Native, iOS + Android) som
räknar ut den exakta koktiden utifrån äggets vikt, starttemperatur, önskad konsistens och
höjden över havet. Ägget förutsätts läggas i redan kokande vatten.

| Inställningar | Hårdkokt XL | Timer | Klart |
| --- | --- | --- | --- |
| ![Inställningar](docs/setup.png) | ![Hårdkokt XL](docs/setup-hard-xl.png) | ![Timer](docs/timer.png) | ![Klart](docs/done.png) |

## Funktioner

- **Vikt** — förinställda EU-klasser (S < 53 g, M 53–63 g, L 63–73 g, XL > 73 g) eller
  exakt vikt med reglage, 40–90 g.
- **Starttemperatur** — kylskåpskallt (4 °C) eller rumsvarmt (20 °C).
- **Konsistens** — löskokt, krämig, fast eller hårdkokt, med levande förhandsvisning av
  gulan i äggets tvärsnitt.
- **Höjd över havet** — reglage eller via position: appen slår upp exakt markhöjd i
  Open-Meteos höjddatabas (stabilare än rå GPS-höjd). Vattnets faktiska kokpunkt räknas
  ut och förlänger koktiden. Blir önskad konsistens fysikaliskt omöjlig (gulan kan aldrig
  bli varmare än vattnet) varnar appen.
- **Flera ägg samtidigt** — lägg alla ägg i kastrullen på en gång; appen larmar när varje
  ägg ska tas upp, i tur och ordning.
- **Larm som inte ger sig** — ihållande ljud- och vibrationslarm tills ägget kvitteras som
  upptaget. Mobilappen skickar lokala notiser även i bakgrunden; webbversionen håller
  skärmen vaken med Wake Lock.
- **Minns dina val** — vikt, konsistens, temperatur och höjd sparas mellan starter.
- **Timer** — animerad förloppsring, ägg som guppar i sjudande vatten och tydligt
  klart-läge. Nedräkningen utgår från klockslag, så den drabbas inte av drift om appen
  hamnar i bakgrunden.

## Fysiken

Koktiden beräknas med Charles D. H. Williams formel (University of Exeter, publicerad via
New Scientist 1998), som modellerar ägget som en sfär med jämn värmeledning:

```
t = K · M^(2/3) · ln( 0,76 · (T_vatten − T_ägg) / (T_vatten − T_gula) )
```

- `t` — koktid i minuter
- `M` — äggets massa i gram
- `T_vatten` — vattnets temperatur (kokpunkten vid aktuell höjd)
- `T_ägg` — äggets starttemperatur
- `T_gula` — måltemperatur i gulans mitt

Faktorn 0,76 följer av den sfäriska geometrin. Williams teoretiska konstant (~0,451 min/g^⅔,
härledd ur värmekapacitet ≈ 3,7 J/g·K, densitet ≈ 1,038 g/cm³, värmeledningsförmåga
≈ 5,4·10⁻³ W/cm·K) gav i praktiktester **för korta tider** — äggen blev lösare än avsett.
Konstanten `K` är därför kalibrerad till **0,590** mot etablerade koktabeller (Serious Eats,
RecipeTin Eats m.fl.). Formelns form är oförändrad, så vikt, starttemperatur och höjd skalar
fortfarande fysikaliskt korrekt runt kalibreringen.

**Konsistens = gulans temperatur.** Appens fyra lägen motsvarar måltemperaturer i gulans mitt:
löskokt 63 °C, krämig 68 °C, fast 75 °C och hårdkokt 80 °C. Ett stort ägg (58 g) ur kylen
i kokande vatten blir då löskokt på **6:00**, krämigt på **7:15**, fast på **9:30** och
hårdkokt på **11:30** — i linje med konsensus i koktabellerna nedan.

**Höjden över havet** sänker kokpunkten med ungefär 1 °C per 300 m. Appen beräknar
lufttrycket med barometriska formeln och kokpunkten med Clausius–Clapeyrons ekvation:
havsnivå 100 °C, Denver (1 609 m) ≈ 95 °C, Mount Everest (8 849 m) ≈ 71 °C — där är ett
hårdkokt ägg fysikaliskt omöjligt, vilket appen upptäcker och förklarar.

Hela modellen ligger i [`src/physics/egg.ts`](src/physics/egg.ts) med enhetstester i
[`src/physics/egg.test.ts`](src/physics/egg.test.ts).

### Källor

- [The Science of Boiling an Egg — C. D. H. Williams, University of Exeter](https://newton.ex.ac.uk/teaching/cdhw/egg/)
- [Towards the perfect soft boiled egg — Khymos](https://khymos.org/2009/04/09/towards-the-perfect-soft-boiled-egg/)
- [The Egg Calculator — ChefSteps](https://www.chefsteps.com/activities/the-egg-calculator)
- [Sous Vide Egg Guide — Anova Culinary](https://anovaculinary.com/pages/sous-vide-egg-guide)
- [How Long to Boil Eggs: Timing Chart — Fond Kitchen](https://fond.kitchen/blog/how-long-to-boil-eggs/) (kalibrering)
- [How to Boil Eggs — RecipeTin Eats](https://www.recipetineats.com/how-to-boil-eggs/) (kalibrering)
- [Boiling Point at Altitude — Omni Calculator](https://www.omnicalculator.com/chemistry/boiling-point-altitude)
- [High Altitude Cooking — USDA FSIS](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/high-altitude-cooking)
- [High Elevation Hard-Cooked Eggs — Colorado State University Extension](https://extension.colostate.edu/resource/high-altitude-hard-cooked-eggs/)

## Testa direkt

Webbversionen är en installerbar PWA: **https://drdev1337.github.io/Eggtimer/** —
öppna på mobilen och välj "Lägg till på hemskärmen" så beter den sig som en app,
med egen ikon och offline-stöd. Källan ligger i [`web/`](web/).

## Kom igång

```bash
npm install
npm start        # Expo dev server — skanna QR-koden med Expo Go
npm run ios      # iOS-simulator
npm run android  # Android-emulator
npm run web      # webbläsare
npm test         # enhetstester för fysikmodulen
```

## Struktur

```
App.tsx                        Inställningsskärm och appens tillstånd
src/physics/egg.ts             Williams formel, kokpunkt vid höjd, konstanter
src/theme.ts                   Färger, typografi, spacing
src/components/EggVisual.tsx   Animerat tvärsnitt av ägget
src/components/Segmented.tsx   Segmenterad väljare med fjädrande indikator
src/components/Slider.tsx      Minimal slider (PanResponder, funkar på webb + native)
src/components/TimerScreen.tsx Nedräkning: förloppsring, guppande ägg, klart-läge
```
