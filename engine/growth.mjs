/* 아기 성장 백분위 — WHO 아동 성장 표준(2006) LMS. 질병관리청 2017 소아청소년 성장도표는 0~35개월에 이 표준을 그대로 채택 */
import { WEIGHT, LENGTH, HEAD } from '../data/who-lms.mjs';

export const MEASURES = { weight: { t: WEIGHT, label: '몸무게', unit: 'kg', dec: 2 }, length: { t: LENGTH, label: '키', unit: 'cm', dec: 1 }, head: { t: HEAD, label: '머리둘레', unit: 'cm', dec: 1 } };
export const PCTS = [3, 5, 10, 25, 50, 75, 90, 95, 97];
const ZP = { 3: -1.8808, 5: -1.6449, 10: -1.2816, 25: -0.6745, 50: 0, 75: 0.6745, 90: 1.2816, 95: 1.6449, 97: 1.8808 };
export const MAX_MONTH = 60;

/* 개월(소수 가능) → L, M, S — 이웃한 달 사이는 선형 보간 */
export function lms(measure, sex, month) {
  const rows = MEASURES[measure].t[sex === 'f' ? 'f' : 'm'];
  const x = Math.max(0, Math.min(MAX_MONTH, month));
  const i = Math.floor(x), j = Math.min(MAX_MONTH, i + 1), t = x - i;
  return rows[i].map((v, k) => v + (rows[j][k] - v) * t);
}
export function zscore(measure, sex, month, value) {
  const [L, M, S] = lms(measure, sex, month);
  return Math.abs(L) < 1e-6 ? Math.log(value / M) / S : (Math.pow(value / M, L) - 1) / (L * S);
}
export function valueAt(measure, sex, month, z) {
  const [L, M, S] = lms(measure, sex, month);
  return Math.abs(L) < 1e-6 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);
}
/* 표준정규 누적분포 (Abramowitz & Stegun 7.1.26) */
export function cdf(z) {
  const s = z < 0 ? -1 : 1, x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + s * y);
}
export function band(pct) {
  if (pct < 3) return { key: 'low2', label: '3백분위 미만 — 소아과 상담 권장' };
  if (pct < 15) return { key: 'low', label: '작은 편 (3~15백분위)' };
  if (pct <= 85) return { key: 'mid', label: '보통 (15~85백분위)' };
  if (pct <= 97) return { key: 'high', label: '큰 편 (85~97백분위)' };
  return { key: 'high2', label: '97백분위 초과 — 소아과 상담 권장' };
}
export function growthCheck(measure, sex, month, value) {
  const z = zscore(measure, sex, month, value);
  const pct = Math.round(cdf(z) * 1000) / 10;
  return { z: Math.round(z * 100) / 100, pct, band: band(pct), median: round(measure, valueAt(measure, sex, month, 0)) };
}
export const round = (measure, v) => { const d = MEASURES[measure].dec; return Math.round(v * Math.pow(10, d)) / Math.pow(10, d); };
export const percentileRow = (measure, sex, month) => PCTS.map((p) => [p, round(measure, valueAt(measure, sex, month, ZP[p]))]);
/* 생후 일수 → 개월(소수) */
export const monthsFromDays = (days) => days / 30.4375;
