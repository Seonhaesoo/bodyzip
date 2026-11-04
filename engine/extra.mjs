/* 추가 계산 — 걸음 수(만보) 칼로리, 수면 주기, 아이 예상 키(중간 부모 키), 혈중알코올농도(위드마크), 다이어트 기간, 나이별 권장 칼로리 */
import { burn } from './kcal.mjs';
import { weeksFor, bmr, tdee } from './body.mjs';

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
/* grams: 마신 알코올(g) · kg · sex · hours: 마지막 잔을 마신 뒤 지난 시간. 흡수 ABSORB_H 뒤부터 ELIM_FAST(0.015%p/시간)로 분해 (경찰 역추산도 음주 종료 30~90분 뒤부터).
 * 분해 속도는 사람마다 시간당 0.010~0.015%p 범위(위드마크 β 0.1~0.15g/L/h; 대법원·경찰 역추산도 피고인에게 유리한 0.008~0.030 중 하한을 쓴다).
 * driveHoursSlow·soberHoursSlow 는 느린 쪽 ELIM_SLOW(0.010)로 계산한 '더 늦은' 추정 — 화면에는 이 값을 함께 보여 안전한 쪽으로 읽게 한다 */
export const ABSORB_H = 1.5, ELIM_FAST = 0.015, ELIM_SLOW = 0.010, LIMIT_SUSPEND = 0.03, LIMIT_REVOKE = 0.08;
export function bac(grams, kg, sex = 'm', hours = 0) {
  const r = sex === 'f' ? 0.55 : 0.68;
  const peak = grams / (kg * r * 1000) * 100 * 0.9;                      /* 흡수율 90% 가정 */
  const now = Math.max(0, peak - ELIM_FAST * Math.max(0, hours - ABSORB_H));
  const nowSlow = Math.max(0, peak - ELIM_SLOW * Math.max(0, hours - ABSORB_H));
  const soberHours = peak / ELIM_FAST + ABSORB_H, soberHoursSlow = peak / ELIM_SLOW + ABSORB_H;
  const driveHours = peak <= LIMIT_SUSPEND ? 0 : (peak - LIMIT_SUSPEND) / ELIM_FAST + ABSORB_H;
  const driveHoursSlow = peak <= LIMIT_SUSPEND ? 0 : (peak - LIMIT_SUSPEND) / ELIM_SLOW + ABSORB_H;
  const r1 = (v) => Math.round(v * 10) / 10, r3 = (v) => Math.round(v * 1000) / 1000;
  return { peak: r3(peak), now: r3(now), nowSlow: r3(nowSlow), soberHours: r1(soberHours), driveHours: r1(driveHours), soberHoursSlow: r1(soberHoursSlow), driveHoursSlow: r1(driveHoursSlow) };
}
/* 마지막 잔 시각(분, 0~1439) + 걸리는 시간 → 'HH:MM' 과 날짜가 넘어갔는지 */
export function bacClock(endMin, hours) {
  const t = endMin + Math.round(hours * 60), m = ((t % 1440) + 1440) % 1440;
  return { time: `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`, nextDay: t >= 1440 };
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

/* ---------- 목표 체중까지 걸리는 기간 — 내 몸(Mifflin-St Jeor 기초대사량 × 활동계수)에서 안전한 결손만 ----------
 * 하루 섭취 하한 = max(기초대사량, 여 1,200 · 남 1,500kcal). 하한을 지키면서 만들 수 있는 결손이 고른 결손보다 작으면 거기까지만 적용(capped).
 * 하한조차 100kcal 결손을 못 만들면(이미 적게 먹어야 하는 체격) 기간을 내지 않고 전문가 상담으로 안내(unsafe). 1kg ≈ 7,700kcal 은 근사치 */
export const MIN_INTAKE = { m: 1500, f: 1200 }, GOAL_DEFICITS = [300, 500, 700];
export function goalPlan(sex, cm, kg, age, target, deficit = 500, act = 'light') {
  const b = bmr(sex, cm, kg, age), t = tdee(b, act);
  const floor = Math.max(b, MIN_INTAKE[sex === 'f' ? 'f' : 'm']);
  const maxDeficit = t - floor;
  const diff = Math.round((kg - target) * 10) / 10;
  const base = { bmr: b, tdee: t, floor, maxDeficit, diff };
  if (diff <= 0) return { ...base, dir: diff === 0 ? 'same' : 'gain', deficit: 0, intake: t, capped: false, unsafe: false, weeks: 0, days: 0, perWeek: 0, big: false };
  if (maxDeficit < 100) return { ...base, dir: 'lose', deficit: 0, intake: floor, capped: true, unsafe: true, weeks: null, days: null, perWeek: 0, big: diff > kg * 0.1 };
  const eff = Math.min(deficit, maxDeficit), capped = eff < deficit;
  const weeks = weeksFor(diff, eff), days = Math.ceil(diff * 7700 / eff);
  return { ...base, dir: 'lose', deficit: eff, intake: t - eff, capped, unsafe: false, weeks, days, perWeek: Math.round(eff * 7 / 7700 * 100) / 100, big: diff > kg * 0.1 || weeks > 26 };
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
  { days: 365, label: '1년', text: '관상동맥질환 위험이 흡연자의 절반으로 줄어듭니다.' },
  { days: 1825, label: '5년', text: '뇌졸중 위험이 비흡연자 수준에 가까워집니다(5~15년).' },
  { days: 3650, label: '10년', text: '폐암 사망 위험이 흡연자의 절반으로 줄고, 구강·식도암 위험도 줄어듭니다.' },
  { days: 5475, label: '15년', text: '관상동맥질환 위험이 비흡연자와 같아집니다.' },
];
export function quitStage(days) { let st = QUIT_STAGES[0]; for (const s of QUIT_STAGES) if (days >= s.days) st = s; return st; }
export const MIN_PER_CIG = 20;                                            /* UCL 2024: 개비당 약 20분 */
export function quitStats(days, perDay = 20, price = 4500, perPack = 20) {
  const cigs = Math.round(days * perDay), money = Math.round(cigs / perPack * price), minutes = cigs * MIN_PER_CIG;
  const dd = Math.floor(minutes / 1440), hh = Math.floor((minutes % 1440) / 60);
  return { days, cigs, money, minutes, lifeText: dd >= 1 ? `${dd}일 ${hh}시간` : `${hh}시간 ${minutes % 60}분` };
}
