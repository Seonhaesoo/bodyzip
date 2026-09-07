/* 몸 계산 — BMI(대한비만학회 2022 기준), 정상 체중 범위, 표준체중, 기초대사량(Mifflin-St Jeor), 활동대사량, 체지방률(미 해군 공식), 물 섭취량 */

export const BMI_CATS = [
  [18.5, '저체중', 'low'],
  [23, '정상', 'ok'],
  [25, '비만 전단계 (과체중)', 'pre'],
  [30, '1단계 비만', 'ob1'],
  [35, '2단계 비만', 'ob2'],
  [Infinity, '3단계 비만 (고도비만)', 'ob3'],
];

export const bmi = (cm, kg) => Math.round(kg / Math.pow(cm / 100, 2) * 10) / 10;
export function bmiCat(b) {
  for (const [lim, label, key] of BMI_CATS) if (b < lim) return { label, key };
  return { label: BMI_CATS[BMI_CATS.length - 1][1], key: 'ob3' };
}
export const bmiOf = (cm, kg) => { const b = bmi(cm, kg); return { bmi: b, ...bmiCat(b) }; };

/* 정상 범위 18.5 ≤ BMI < 23 — 몸무게(kg) 소수 첫째 자리 */
export function normalRange(cm) {
  const m2 = Math.pow(cm / 100, 2);
  return { min: Math.round(18.5 * m2 * 10) / 10, max: Math.round(22.9 * m2 * 10) / 10 };
}
/* 표준체중: 남 키(m)² × 22, 여 × 21 (대한비만학회 · 대한당뇨병학회) */
export const standardWeight = (cm, sex) => Math.round(Math.pow(cm / 100, 2) * (sex === 'f' ? 21 : 22) * 10) / 10;
/* 브로카 변법: (키 − 100) × 0.9 */
export const broca = (cm) => Math.round((cm - 100) * 0.9 * 10) / 10;
/* 목표 BMI까지 필요한 체중 변화(kg, +면 감량) */
export function toNormal(cm, kg) {
  const r = normalRange(cm);
  if (kg > r.max) return { dir: 'lose', kg: Math.round((kg - r.max) * 10) / 10 };
  if (kg < r.min) return { dir: 'gain', kg: Math.round((r.min - kg) * 10) / 10 };
  return { dir: 'ok', kg: 0 };
}
/* 체중 1kg ≈ 7,700kcal · 하루 결손량으로 나눈 기간(주) */
export const weeksFor = (kgDiff, deficitPerDay = 500) => Math.round(kgDiff * 7700 / deficitPerDay / 7 * 10) / 10;

/* 기초대사량 Mifflin-St Jeor: 남 10w + 6.25h − 5a + 5 · 여 −161 */
export function bmr(sex, cm, kg, age) {
  return Math.round(10 * kg + 6.25 * cm - 5 * age + (sex === 'f' ? -161 : 5));
}
/* Harris-Benedict(1984 개정) — 비교용 */
export function bmrHB(sex, cm, kg, age) {
  return Math.round(sex === 'f' ? 447.593 + 9.247 * kg + 3.098 * cm - 4.330 * age : 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age);
}
export const ACTIVITY = [
  { key: 'sedentary', label: '거의 안 움직임 (사무직, 운동 없음)', f: 1.2 },
  { key: 'light', label: '가벼움 (주 1~3회 운동)', f: 1.375 },
  { key: 'moderate', label: '보통 (주 3~5회 운동)', f: 1.55 },
  { key: 'active', label: '활발 (주 6~7회 운동)', f: 1.725 },
  { key: 'very', label: '매우 활발 (육체노동 · 하루 2회 운동)', f: 1.9 },
];
export const tdee = (bmrVal, key = 'light') => Math.round(bmrVal * (ACTIVITY.find((a) => a.key === key) || ACTIVITY[1]).f);

/* 미 해군 체지방률 공식 — cm 단위, 남: 허리·목·키, 여: 허리·엉덩이·목·키 */
export function bodyFatNavy(sex, cm, waist, neck, hip = 0) {
  const L = Math.log10;
  let pct;
  if (sex === 'f') pct = 495 / (1.29579 - 0.35004 * L(waist + hip - neck) + 0.22100 * L(cm)) - 450;
  else pct = 495 / (1.0324 - 0.19077 * L(waist - neck) + 0.15456 * L(cm)) - 450;
  return Math.round(Math.max(2, Math.min(60, pct)) * 10) / 10;
}
export function bodyFatCat(sex, pct) {
  const t = sex === 'f' ? [[14, '필수 지방 수준'], [21, '운동선수'], [25, '건강'], [32, '평균'], [Infinity, '비만']] : [[6, '필수 지방 수준'], [14, '운동선수'], [18, '건강'], [25, '평균'], [Infinity, '비만']];
  for (const [lim, label] of t) if (pct < lim) return label;
  return '비만';
}
/* 하루 물 섭취 권장 대략값: 몸무게 × 33ml (30~35ml) */
export const water = (kg) => ({ ml: Math.round(kg * 33 / 10) * 10, cups: Math.round(kg * 33 / 200 * 10) / 10 });
/* 단백질 권장: 일반 0.8g/kg · 운동 1.2~1.6g/kg */
export const protein = (kg) => ({ base: Math.round(kg * 0.8), active: Math.round(kg * 1.4) });
