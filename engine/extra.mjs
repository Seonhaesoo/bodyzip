/* 추가 계산 — 걸음 수(만보) 칼로리, 수면 주기, 아이 예상 키(중간 부모 키), 혈중알코올농도(위드마크), 다이어트 기간, 나이별 권장 칼로리 */
import { burn } from './kcal.mjs';
import { weeksFor } from './body.mjs';

/* ---------- 걸음 수 ---------- */
export const STRIDE = (cm) => Math.round(cm * 0.415) / 100;          /* 보폭(m) ≈ 키 × 0.415 */
export function steps(n, kg = 60, cm = 170) {
  const stride = STRIDE(cm);
  const km = Math.round(n * stride / 100) / 10;
  const minutes = Math.round(km / 4 * 60);                              /* 시속 4km 보통 걷기 */
  const kcal = burn(3.0, kg, minutes);
  return { steps: n, stride, km, minutes, kcal };
}

/* ---------- 수면 주기 (90분 × n + 잠드는 데 15분) ---------- */
export const CYCLE_MIN = 90, FALL_ASLEEP = 15;
const hm = (min) => { const m = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
export function bedtimes(wakeHH, wakeMM = 0) {
  const wake = wakeHH * 60 + wakeMM;
  return [6, 5, 4, 3].map((n) => ({ cycles: n, hours: n * 1.5, time: hm(wake - n * CYCLE_MIN - FALL_ASLEEP) }));
}
export function waketimes(bedHH, bedMM = 0) {
  const bed = bedHH * 60 + bedMM + FALL_ASLEEP;
  return [6, 5, 4, 3].map((n) => ({ cycles: n, hours: n * 1.5, time: hm(bed + n * CYCLE_MIN) }));
}

/* ---------- 아이 예상 키 — 중간 부모 키(Tanner) ---------- */
export function childHeight(father, mother) {
  const boy = Math.round((father + mother + 13) / 2 * 10) / 10;
  const girl = Math.round((father + mother - 13) / 2 * 10) / 10;
  return { boy, girl, range: 8.5 };                                     /* ±8.5cm (약 95% 범위) */
}

/* ---------- 혈중알코올농도 — 위드마크 ---------- */
export const DRINKS = [
  { key: 'soju', label: '소주 1병 (360ml · 16.5%)', ml: 360, abv: 0.165 },
  { key: 'soju-shot', label: '소주 1잔 (50ml)', ml: 50, abv: 0.165 },
  { key: 'beer', label: '맥주 500ml (4.5%)', ml: 500, abv: 0.045 },
  { key: 'beer-can', label: '맥주 1캔 (355ml)', ml: 355, abv: 0.045 },
  { key: 'makgeolli', label: '막걸리 1병 (750ml · 6%)', ml: 750, abv: 0.06 },
  { key: 'wine', label: '와인 1잔 (150ml · 13%)', ml: 150, abv: 0.13 },
  { key: 'whisky', label: '위스키 1잔 (30ml · 40%)', ml: 30, abv: 0.40 },
];
export const alcoholGrams = (ml, abv) => ml * abv * 0.7894;
/* grams: 마신 알코올(g) · kg · sex · hours: 마지막 잔을 마신 뒤 지난 시간. 흡수 ABSORB_H 뒤부터 0.015%p/시간 분해 (경찰 역추산도 음주 종료 30~90분 뒤부터) */
export const ABSORB_H = 1.5;
export function bac(grams, kg, sex = 'm', hours = 0) {
  const r = sex === 'f' ? 0.55 : 0.68;
  const peak = grams / (kg * r * 1000) * 100 * 0.9;                      /* 흡수율 90% 가정 */
  const now = Math.max(0, peak - 0.015 * Math.max(0, hours - ABSORB_H));
  const soberHours = peak / 0.015 + ABSORB_H;
  const driveHours = peak <= 0.03 ? 0 : (peak - 0.03) / 0.015 + ABSORB_H;
  return { peak: Math.round(peak * 1000) / 1000, now: Math.round(now * 1000) / 1000, soberHours: Math.round(soberHours * 10) / 10, driveHours: Math.round(driveHours * 10) / 10 };
}
export function bacLevel(v) {
  if (v < 0.03) return '단속 기준 미만 (0.03% 미만)';
  if (v < 0.08) return '면허 정지 (0.03~0.08%)';
  if (v < 0.2) return '면허 취소 (0.08% 이상)';
  if (v < 0.4) return '면허 취소 · 만취 (0.2% 이상)';
  return '생명이 위험한 수준 (0.4% 이상)';
}

/* ---------- 다이어트 기간 ---------- */
export function dietPlan(from, to, deficit = 500) {
  const diff = Math.round((from - to) * 10) / 10;
  const weeks = weeksFor(Math.abs(diff), deficit);
  return { diff, weeks, days: Math.ceil(Math.abs(diff) * 7700 / deficit), perWeek: Math.round(deficit * 7 / 7700 * 100) / 100 };
}

/* ---------- 나이별 하루 권장 칼로리 — 한국인 영양소 섭취기준(2020) 에너지 필요추정량 ---------- */
export const KCAL_NEED = [
  ['1~2세', 900, 900], ['3~5세', 1400, 1400], ['6~8세', 1700, 1500], ['9~11세', 2000, 1800], ['12~14세', 2500, 2000], ['15~18세', 2700, 2000],
  ['19~29세', 2600, 2000], ['30~49세', 2500, 1900], ['50~64세', 2200, 1700], ['65~74세', 2000, 1600], ['75세 이상', 1900, 1500],
];
