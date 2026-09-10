/* 가정혈압 기록 — 대한고혈압학회 진료지침: 집에서 잰 혈압(가정혈압)은 평균 135/85mmHg 이상이면 고혈압(진료실 140/90보다 5 낮음).
 * 아침(일어나 1시간 안, 소변 뒤, 약·아침 먹기 전)과 저녁(자기 전)에 앉아 1~2분 쉬고 2번씩, 5~7일 재서 평균을 본다.
 * 한 번 잰 값의 위기 판정(180/120)은 checkup.mjs bloodPressure를 그대로 쓴다 */
import { bloodPressure } from './checkup.mjs';

export const HOME_LIMIT = [135, 85];
export const LOW_BP = [90, 60];
export const SLOT_NAME = { am: '아침', pm: '저녁', etc: '낮' };
export const slotOf = (hour) => hour >= 4 && hour < 12 ? 'am' : hour >= 18 || hour < 4 ? 'pm' : 'etc';
export const bpValid = (s, d) => s >= 60 && s <= 260 && d >= 30 && d <= 160 && d < s;
const avgOf = (arr, k) => { const v = arr.filter((r) => r[k] > 0); return v.length ? Math.round(v.reduce((a, r) => a + r[k], 0) / v.length) : null; };
const pack = (arr) => ({ n: arr.length, s: avgOf(arr, 's'), d: avgOf(arr, 'd'), p: avgOf(arr, 'p') });

/* 기록([{ t: ms, s, d, p, slot }]) → 최근 days일 평균 · 아침/저녁 평균 · 잰 날 수 · 가정혈압 기준 이상 여부 */
export function homeAvg(list, nowMs, days = 7) {
  const cut = nowMs - days * 86400000, win = list.filter((r) => r.t > cut && r.t <= nowMs + 60000);
  const all = pack(win), am = pack(win.filter((r) => r.slot === 'am')), pm = pack(win.filter((r) => r.slot === 'pm'));
  const dayCount = new Set(win.map((r) => new Date(r.t + 9 * 3600e3).toISOString().slice(0, 10))).size;
  return { ...all, am, pm, days: dayCount, enough: dayCount >= 5, over: all.n ? all.s >= HOME_LIMIT[0] || all.d >= HOME_LIMIT[1] : null };
}

/* 한 번 잰 값의 표시 — 매우 높음(위기 180/120) · 높음(가정혈압 기준 135/85 이상) · 낮음(90/60 미만) · 기준 안 */
export function readingTag(s, d) {
  if (bloodPressure(s, d).key === 'crisis') return { key: 'crisis', label: '매우 높음' };
  if (s >= HOME_LIMIT[0] || d >= HOME_LIMIT[1]) return { key: 'high', label: '높음' };
  if (s < LOW_BP[0] || d < LOW_BP[1]) return { key: 'low', label: '낮음' };
  return { key: 'ok', label: '기준 안' };
}
