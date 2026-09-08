/* 반려동물 — 강아지·고양이 나이 환산, 사료량(RER·DER), 예방접종 일정 */
import { addDays, addMonths } from './dates.mjs';

export const DOG_SIZES = [
  { key: 'small', label: '소형견 (10kg 미만)', add: 4 },
  { key: 'medium', label: '중형견 (10~25kg)', add: 5 },
  { key: 'large', label: '대형견 (25kg 이상)', add: 6 },
];
/* 1년 = 사람 15세, 2년 = 24세, 이후 소형 +4·중형 +5·대형 +6 (AVMA·AKC 환산표) */
export function dogAge(years, size = 'small') {
  const add = (DOG_SIZES.find((s) => s.key === size) || DOG_SIZES[0]).add;
  if (years <= 0) return 0;
  if (years <= 1) return Math.round(15 * years);
  if (years <= 2) return Math.round(15 + 9 * (years - 1));
  return Math.round(24 + add * (years - 2));
}
/* 참고: 후성유전 시계 공식 (UCSD 2019, 래브라도) 16 × ln(나이) + 31 */
export const dogAgeLog = (years) => years >= 1 ? Math.round(16 * Math.log(years) + 31) : Math.round(31 * years);
export function catAge(years) {
  if (years <= 0) return 0;
  if (years <= 1) return Math.round(15 * years);
  if (years <= 2) return Math.round(15 + 9 * (years - 1));
  return Math.round(24 + 4 * (years - 2));
}
export function petStage(kind, years, size = 'small') {
  const seniorAt = kind === 'cat' ? 11 : size === 'large' ? 7 : size === 'medium' ? 8 : 10;
  if (years < 1) return kind === 'cat' ? '아기 고양이 (kitten)' : '강아지 (puppy)';
  if (years < 3) return '청년기 — 성장이 끝나고 활동량이 가장 많은 때';
  if (years < seniorAt - 2) return '성년기 — 체중·치아 관리가 중요한 때';
  if (years < seniorAt) return '중년기 — 건강검진을 1년에 한 번';
  return '노령기 — 건강검진을 6개월에 한 번, 관절·신장 관리';
}

/* ---------- 사료량 ---------- */
export const RER = (kg) => 70 * Math.pow(kg, 0.75);
export const DOG_FACTORS = [
  { key: 'neutered', label: '중성화한 성견', f: 1.6 },
  { key: 'intact', label: '중성화하지 않은 성견', f: 1.8 },
  { key: 'inactive', label: '실내 생활 · 살찌기 쉬움', f: 1.3 },
  { key: 'loss', label: '체중 감량 중', f: 1.0 },
  { key: 'senior', label: '노령견', f: 1.4 },
  { key: 'active', label: '활동량 많음 · 사역견', f: 2.0 },
  { key: 'puppy4', label: '강아지 4개월 미만', f: 3.0 },
  { key: 'puppy12', label: '강아지 4~12개월', f: 2.0 },
];
export const CAT_FACTORS = [
  { key: 'neutered', label: '중성화한 성묘', f: 1.2 },
  { key: 'intact', label: '중성화하지 않은 성묘', f: 1.4 },
  { key: 'inactive', label: '실내 생활 · 살찌기 쉬움', f: 1.0 },
  { key: 'loss', label: '체중 감량 중', f: 0.8 },
  { key: 'senior', label: '노령묘', f: 1.2 },
  { key: 'kitten', label: '아기 고양이 (1살 미만)', f: 2.5 },
];
export const KCAL_PER_100G = 370;                                        /* 건사료 평균 열량 */
export function petFood(kind, kg, factorKey, kcal100 = KCAL_PER_100G) {
  const list = kind === 'cat' ? CAT_FACTORS : DOG_FACTORS;
  const fx = list.find((x) => x.key === factorKey) || list[0];
  const rer = Math.round(RER(kg)), der = Math.round(rer * fx.f);
  return { rer, der, factor: fx, grams: Math.round(der / kcal100 * 100), perMeal2: Math.round(der / kcal100 * 100 / 2), perMeal3: Math.round(der / kcal100 * 100 / 3) };
}

/* ---------- 예방접종 (국내 동물병원 일반 일정, 주 단위) ---------- */
export const DOG_VACCINES = [
  { name: '종합백신 (DHPPL)', weeks: [6, 8, 10, 12, 14], yearly: true },
  { name: '코로나 장염', weeks: [6, 8], yearly: true },
  { name: '켄넬코프', weeks: [10, 12], yearly: true },
  { name: '인플루엔자', weeks: [14, 16], yearly: true },
  { name: '광견병', weeks: [16], yearly: true },
  { name: '항체가 검사', weeks: [18], yearly: false },
];
export const CAT_VACCINES = [
  { name: '종합백신 (FVRCP)', weeks: [8, 11, 14], yearly: true },
  { name: '백혈병 (FeLV)', weeks: [11, 14], yearly: true },
  { name: '광견병', weeks: [16], yearly: true },
  { name: '항체가 검사', weeks: [18], yearly: false },
];
export function petVaccineDates(kind, birth) {
  const list = kind === 'cat' ? CAT_VACCINES : DOG_VACCINES;
  const out = list.map((v) => ({ name: v.name, doses: v.weeks.map((w, i) => ({ label: `${w}주 (${i + 1}차)`, date: addDays(birth, w * 7) })) }));
  const boosters = list.filter((v) => v.yearly).map((v) => v.name.split(' (')[0]);
  const last = Math.max(...list.filter((v) => v.yearly).map((v) => v.weeks[v.weeks.length - 1]));
  out.push({ name: '연간 추가 접종', doses: [1, 2, 3].map((y) => ({ label: `${y}년 뒤 (${boosters.join('·')})`, date: addDays(addMonths(birth, 12 * y), last * 7) })) });
  return out;
}
export const heartwormStart = (birth) => addDays(birth, 8 * 7);
export const neuterAdvice = (kind, birth) => addMonths(birth, kind === 'cat' ? 6 : 6);
