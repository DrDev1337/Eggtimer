/**
 * Körs med: npm test
 * (node --experimental-strip-types --test src/physics/egg.test.ts)
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boilingPointC, cookTime, formatTime } from './egg.ts';

test('kokpunkt vid havsnivå är 100 °C', () => {
  assert.ok(Math.abs(boilingPointC(0) - 100) < 0.05);
});

test('kokpunkt sjunker med höjden (Denver ~95 °C, Everest ~71 °C)', () => {
  const denver = boilingPointC(1609);
  const everest = boilingPointC(8849);
  assert.ok(denver > 94 && denver < 96, `Denver: ${denver}`);
  assert.ok(everest > 69 && everest < 73, `Everest: ${everest}`);
});

test('M-ägg från kylen, löskokt: ca 4,5 min (Williams formel)', () => {
  const { seconds } = cookTime({ massG: 58, startTempC: 4, yolkTargetC: 63, altitudeM: 0 });
  assert.ok(seconds !== null && seconds > 4 * 60 && seconds < 5 * 60, `fick ${seconds}s`);
});

test('M-ägg från kylen, hårdkokt: ca 8 min', () => {
  const { seconds } = cookTime({ massG: 58, startTempC: 4, yolkTargetC: 77, altitudeM: 0 });
  assert.ok(seconds !== null && seconds > 7 * 60 && seconds < 9 * 60, `fick ${seconds}s`);
});

test('rumsvarmt ägg går snabbare än kylskåpskallt', () => {
  const fridge = cookTime({ massG: 58, startTempC: 4, yolkTargetC: 63, altitudeM: 0 });
  const room = cookTime({ massG: 58, startTempC: 20, yolkTargetC: 63, altitudeM: 0 });
  assert.ok(room.seconds! < fridge.seconds!);
});

test('större ägg tar längre tid', () => {
  const s = cookTime({ massG: 48, startTempC: 4, yolkTargetC: 63, altitudeM: 0 });
  const xl = cookTime({ massG: 78, startTempC: 4, yolkTargetC: 63, altitudeM: 0 });
  assert.ok(xl.seconds! > s.seconds!);
});

test('högre höjd ger längre koktid', () => {
  const sea = cookTime({ massG: 58, startTempC: 4, yolkTargetC: 67, altitudeM: 0 });
  const alps = cookTime({ massG: 58, startTempC: 4, yolkTargetC: 67, altitudeM: 2000 });
  assert.ok(alps.seconds! > sea.seconds!);
});

test('hårdkokt ägg är omöjligt på Mount Everest (vatten ~71 °C)', () => {
  const { seconds } = cookTime({ massG: 58, startTempC: 4, yolkTargetC: 77, altitudeM: 8849 });
  assert.equal(seconds, null);
});

test('formatTime nollutfyller sekunder', () => {
  assert.equal(formatTime(275), '4:35');
  assert.equal(formatTime(480), '8:00');
  assert.equal(formatTime(61), '1:01');
});
