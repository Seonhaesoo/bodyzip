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

/* ---------- 카페인 (식약처 식품영양성분 DB·주요 매장 공개값 대표치) ---------- */
export const CAFFEINE = [
  { key: 'americano', label: '아메리카노 (톨 355ml)', mg: 150 },
  { key: 'mix', label: '믹스커피 1봉', mg: 50 },
  { key: 'canned', label: '캔커피 (200ml)', mg: 80 },
  { key: 'energy', label: '에너지드링크 (250ml · 핫식스·레드불)', mg: 62 },
  { key: 'cola', label: '콜라 (355ml)', mg: 35 },
  { key: 'green-tea', label: '녹차 1잔', mg: 30 },
  { key: 'latte', label: '카페라떼 (톨)', mg: 75 },
  { key: 'black-tea', label: '홍차 1잔', mg: 47 },
  { key: 'espresso', label: '에스프레소 1샷', mg: 75 },
  { key: 'energy-large', label: '에너지드링크 큰 캔 (355ml · 몬스터)', mg: 100 },
  { key: 'chocolate', label: '초콜릿 (50g)', mg: 20 },
  { key: 'decaf', label: '디카페인 커피', mg: 5 },
];
export const CAFFEINE_HALF_LIFE = 5;
export const caffeineLeft = (mg, hours) => Math.round(mg * Math.pow(0.5, hours / CAFFEINE_HALF_LIFE));
export const caffeineLimit = (mode, kg = 50) => mode === 'teen' ? Math.round(kg * 2.5) : mode === '300' || mode === 300 ? 300 : 400;

/* ---------- 금연 ---------- */
export const QUIT_STAGES = [
  { days: 0, label: '20분', text: '혈압과 맥박이 정상으로 돌아옵니다.' },
  { days: 8 / 24, label: '8시간', text: '혈중 일산화탄소가 정상이 되고 산소 농도가 회복됩니다.' },
  { days: 1, label: '24시간', text: '심장마비 위험이 줄기 시작합니다.' },
  { days: 2, label: '48시간', text: '니코틴이 몸에서 빠져나가고 후각·미각이 돌아옵니다.' },
  { days: 3, label: '72시간', text: '기관지가 이완돼 숨쉬기가 편해집니다. 금단 증상은 이때가 정점입니다.' },
  { days: 7, label: '1주', text: '금단 증상이 가라앉기 시작하고 입맛과 냄새가 또렷해집니다.' },
  { days: 14, label: '2주~12주', text: '혈액순환이 좋아지고 폐 기능이 올라갑니다.' },
  { days: 30, label: '1~9개월', text: '기침·숨참이 줄고 폐 섬모가 회복돼 감염이 줄어듭니다.' },
  { days: 365, label: '1년', text: '관상동맥질환 위험이 흡연자의 절반으로.' },
  { days: 1825, label: '5년', text: '뇌졸중 위험이 비흡연자 수준에 가까워집니다(5~15년).' },
  { days: 3650, label: '10년', text: '폐암 사망 위험이 흡연자의 절반으로, 구강·식도암 위험도 감소.' },
  { days: 5475, label: '15년', text: '관상동맥질환 위험이 비흡연자와 같아집니다.' },
];
export function quitStage(days) { let st = QUIT_STAGES[0]; for (const s of QUIT_STAGES) if (days >= s.days) st = s; return st; }
export const MIN_PER_CIG = 20;                                            /* UCL 2024: 개비당 약 20분 */
export function quitStats(days, perDay = 20, price = 4500, perPack = 20) {
  const cigs = Math.round(days * perDay), money = Math.round(cigs / perPack * price), minutes = cigs * MIN_PER_CIG;
  const dd = Math.floor(minutes / 1440), hh = Math.floor((minutes % 1440) / 60);
  return { days, cigs, money, minutes, lifeText: dd >= 1 ? `${dd}일 ${hh}시간` : `${hh}시간 ${minutes % 60}분` };
}
