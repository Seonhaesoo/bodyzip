/* 기저귀 단계 — /baby/diaper/ (2026-11-28)
 * 단계별 몸무게는 브랜드마다 다르고 서로 겹친다(같은 4단계도 8~13kg, 9~14kg, 9~14kg처럼). 공식 통합 기준이 없어
 * 2026-11 확인한 국내 판매 제품 표기(마미포코 공식 사이즈 가이드 대형 9~14 · 특대형 13~17 · 점보형 16~25kg, 육아 블로그·커뮤니티에 옮겨진
 * 하기스 1단계 3~4.5 · 2단계 4~8 · 3단계 7~10 · 4단계 8~13 · 5단계 11~16kg, 팸퍼스 4단계 9~14 · 6단계 15~25kg)를 겹쳐 본 '대략 범위'만 쓴다.
 * 페이지에는 늘 "포장에 적힌 권장 체중이 기준"이라고 적는다. 브랜드별 표는 만들지 않는다(출처가 흔들림).
 * 성장 예측은 engine/growth.mjs(WHO 표준 = 질병관리청 2017 성장도표 0~35개월)를 넘겨받아 쓴다 — 이 파일은 import 없이 번들에 들어간다 */

export const DIAPER_STEPS = [
  { key: 1, label: '1단계 (신생아)', short: '1단계', lo: 0, hi: 5 },
  { key: 2, label: '2단계 (소형)', short: '2단계', lo: 4, hi: 8 },
  { key: 3, label: '3단계 (중형)', short: '3단계', lo: 6, hi: 11 },
  { key: 4, label: '4단계 (대형)', short: '4단계', lo: 8, hi: 14 },
  { key: 5, label: '5단계 (특대형)', short: '5단계', lo: 11, hi: 17 },
  { key: 6, label: '6단계 (점보)', short: '6단계', lo: 15, hi: 25 },
];
export const stepRange = (s) => (s.lo ? `${s.lo}~${s.hi}kg` : `${s.hi}kg까지`);

/* 하루 기저귀 개수 — 흔히 안내되는 어림값(제조사·육아 안내서). 소변 기저귀 하루 6개 이상은 잘 먹는다는 신호(생후 1주 뒤) */
export const DIAPER_PER_DAY = [
  { from: 0, to: 1, label: '신생아 (0~1개월)', day: [10, 12] },
  { from: 1, to: 6, label: '1~5개월', day: [8, 10] },
  { from: 6, to: 12, label: '6~11개월', day: [6, 8] },
  { from: 12, to: 24, label: '12~23개월', day: [5, 7] },
  { from: 24, to: 61, label: '24개월부터 (배변 훈련 전)', day: [4, 6] },
];
export const perDayFor = (months) => DIAPER_PER_DAY.find((r) => months >= r.from && months < r.to) || DIAPER_PER_DAY[DIAPER_PER_DAY.length - 1];

/* 몸무게 → 맞는 단계. 범위가 겹치면 둘 다 돌려주고, 아래 단계 상한까지 1kg 넘게 남았으면 아래 단계를, 아니면 위 단계를 먼저 권한다 */
export function diaperStep(kg) {
  const w = Math.max(0, Number(kg) || 0);
  const fits = DIAPER_STEPS.filter((s) => w >= s.lo && w <= s.hi);
  if (!fits.length) return { kg: w, fits: [], main: DIAPER_STEPS[DIAPER_STEPS.length - 1], alt: null, over: true };
  let main = fits[0], alt = fits[1] || null;
  if (alt && main.hi - w <= 1) { main = fits[1]; alt = fits[0]; }
  const next = DIAPER_STEPS.find((s) => s.key === main.key + 1) || null;
  return { kg: w, fits, main, alt, next, toTop: Math.round((main.hi - w) * 10) / 10, over: false };
}

/* 같은 백분위로 자란다고 보고, 지금 단계의 상한(main.hi)에 닿는 개월 — G 는 growth.mjs ({ zscore, valueAt }) */
export function diaperOutgrow(G, sex, months, kg) {
  const r = diaperStep(kg);
  if (r.over || months == null || months < 0 || months > 59) return null;
  const z = G.zscore('weight', sex, months, kg);
  for (let m = Math.ceil(months * 4) / 4; m <= 60; m += 0.25) {
    const w = G.valueAt('weight', sex, m, z);
    if (w > r.main.hi) return { step: r.main, month: Math.round(m * 10) / 10, kg: Math.round(w * 10) / 10, z };
  }
  return { step: r.main, month: null, kg: null, z };
}

/* 개월 → 보통 몸무게(WHO 50백분위)와 그 몸무게의 단계 */
export function typicalStep(G, sex, months) {
  const kg = Math.round(G.valueAt('weight', sex, months, 0) * 10) / 10;
  return { kg, ...diaperStep(kg) };
}
