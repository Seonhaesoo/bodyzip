/* 어린이·청소년 성장 백분위 — 질병관리청 2017 소아청소년 성장도표(만 3~18세) LMS. 0~35개월 아기는 growth.mjs(WHO) */
import { KIDS, KIDS_START, KIDS_END } from '../data/kdca-lms.mjs';
import { cdf } from './growth.mjs';
export { KIDS_START, KIDS_END };

export const KIDS_MEASURES = { height: { label: '키', unit: 'cm' }, weight: { label: '몸무게', unit: 'kg' }, bmi: { label: 'BMI', unit: '' } };
export const KIDS_PCTS = [3, 5, 10, 25, 50, 75, 85, 90, 95, 97];
const KZ = { 3: -1.8808, 5: -1.6449, 10: -1.2816, 25: -0.6745, 50: 0, 75: 0.6745, 85: 1.0364, 90: 1.2816, 95: 1.6449, 97: 1.8808 };
export const KIDS_AGES = []; for (let y = 3; y <= 18; y++) KIDS_AGES.push(y);

/* 개월(소수 가능) → L, M, S — 이웃한 달 사이는 선형 보간, 범위 밖은 끝값 */
export function kidsLms(measure, sex, months) {
  const rows = KIDS[measure][sex === 'f' ? 'f' : 'm'];
  const x = Math.max(KIDS_START, Math.min(KIDS_END, months)) - KIDS_START;
  const i = Math.floor(x), j = Math.min(rows.length - 1, i + 1), t = x - i;
  return rows[i].map((v, k) => v + (rows[j][k] - v) * t);
}
export function kidsZ(measure, sex, months, value) {
  const [L, M, S] = kidsLms(measure, sex, months);
  return Math.abs(L) < 1e-6 ? Math.log(value / M) / S : (Math.pow(value / M, L) - 1) / (L * S);
}
export function kidsValue(measure, sex, months, z) {
  const [L, M, S] = kidsLms(measure, sex, months);
  return Math.abs(L) < 1e-6 ? M * Math.exp(S * z) : M * Math.pow(Math.max(1 + L * S * z, 1e-6), 1 / L);
}
export const kidsRound = (v) => Math.round(v * 10) / 10;

/* 판정 — 키 3백분위 미만은 저신장 평가 대상, BMI는 5·85·95백분위(또는 BMI 25 이상 비만)가 2017 성장도표 기준 */
export function kidsBand(measure, pct, value) {
  if (measure === 'bmi') {
    if (pct >= 95 || value >= 25) return { key: 'obese', label: '비만 (95백분위 이상 또는 BMI 25 이상)' };
    if (pct >= 85) return { key: 'over', label: '과체중 (85~95백분위)' };
    if (pct < 5) return { key: 'under', label: '저체중 (5백분위 미만)' };
    return { key: 'mid', label: '정상 (5~85백분위)' };
  }
  const small = measure === 'weight' ? '가벼운 편' : '작은 편', big = measure === 'weight' ? '무거운 편' : '큰 편';
  if (pct < 3) return { key: 'low2', label: measure === 'height' ? '3백분위 미만 — 성장 평가 권장' : '3백분위 미만 — 소아청소년과 상담 권장' };
  if (pct < 15) return { key: 'low', label: `${small} (3~15백분위)` };
  if (pct <= 85) return { key: 'mid', label: '보통 (15~85백분위)' };
  if (pct <= 97) return { key: 'high', label: `${big} (85~97백분위)` };
  return { key: 'high2', label: '97백분위 초과 — 소아청소년과 상담 권장' };
}
export function kidsCheck(measure, sex, months, value) {
  const z = kidsZ(measure, sex, months, value);
  const pct = Math.round(cdf(z) * 1000) / 10;
  return { z: Math.round(z * 100) / 100, pct, top: Math.max(0.1, Math.round((100 - pct) * 10) / 10), band: kidsBand(measure, pct, value), median: kidsRound(kidsValue(measure, sex, months, 0)) };
}
export const kidsRow = (measure, sex, months) => KIDS_PCTS.map((p) => [p, kidsRound(kidsValue(measure, sex, months, KZ[p]))]);
/* 지금 키 백분위를 만 18세(216개월)까지 그대로 따라간다고 볼 때의 키 — 사춘기가 이르거나 늦으면 크게 달라진다 */
export const trackAdult = (sex, months, height) => kidsRound(kidsValue('height', sex, 216, kidsZ('height', sex, months, height)));
export const kidsBmi = (cm, kg) => Math.round(kg / Math.pow(cm / 100, 2) * 10) / 10;

/* 학년(초1=1 … 고3=12) → 9월 1일 기준 학년 한가운데(7월생) 나이 개월. 같은 학년 1월생은 6개월 많고 12월생은 5개월 적다 */
export const GRADES = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
export const GRADE_NAMES = ['초등학교 1학년', '초등학교 2학년', '초등학교 3학년', '초등학교 4학년', '초등학교 5학년', '초등학교 6학년', '중학교 1학년', '중학교 2학년', '중학교 3학년', '고등학교 1학년', '고등학교 2학년', '고등학교 3학년'];
export const gradeMonths = (g) => 86 + 12 * (g - 1);
export const ageLabel = (months) => { const y = Math.floor(months / 12), m = Math.round(months - y * 12); return m ? `만 ${y}세 ${m}개월` : `만 ${y}세`; };
/* 학년 한가운데 나이가 6개월 안쪽인 학년 (없으면 null) */
export function gradeFor(months) { let best = null, d = Infinity; for (let g = 1; g <= 12; g++) { const x = Math.abs(gradeMonths(g) - months); if (x < d) { d = x; best = g; } } return d <= 6 ? best : null; }
/* 만 y세(y×12 ~ y×12+11개월)와 겹치는 학년들 — 9월 1일 기준 학년 나이 폭은 한가운데 ±6개월 */
export function gradesForAge(y) { const a = y * 12, b = y * 12 + 11, out = []; for (let g = 1; g <= 12; g++) { const lo = gradeMonths(g) - 6, hi = gradeMonths(g) + 6; if (hi >= a && lo <= b) out.push(g); } return out; }
/* 키 페이지를 만드는 범위 — 그 나이 0개월 3백분위 −3cm ~ 11개월 97백분위 +3cm */
export function kidsHeightRange(sex, y) {
  const lo = Math.floor(kidsValue('height', sex, y * 12, KZ[3])) - 3;
  const hi = Math.ceil(kidsValue('height', sex, Math.min(KIDS_END, y * 12 + 11), KZ[97])) + 3;
  return [lo, hi];
}
/* 백분위 → "상위 42%" / "하위 8%" */
export const kidsRank = (p) => { const v = p >= 50 ? 100 - p : p, t = v < 1 ? (Math.round(v * 10) / 10 || 0.1) : Math.round(v); return `${p >= 50 ? '상위' : '하위'} ${t}%`; };
