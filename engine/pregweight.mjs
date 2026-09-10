/* 임신 중 체중 증가 — 미국 국립의학원(IOM, 현 NAM) 2009 「Weight Gain During Pregnancy: Reexamining the Guidelines」.
 * 미국 CDC(2024)·미국산부인과학회가 따르는 기준이고, 임신 전 BMI는 세계보건기구(WHO) 구간(18.5 · 25 · 30)을 쓴다.
 * 1분기(13주까지)는 0.5~2kg, 이후 40주에 IOM 총 증가 범위가 되도록 주차별 범위를 곧게 잇는다.
 * 총량에 맞춘 값이라 한 주 증가는 IOM의 2·3분기 주당 권고와 조금 다르다(정상 BMI 하한 0.41kg ↔ 권고 0.35kg, 나머지는 0.03kg 안) */
export const PW_CATS = [
  { key: 'under', label: '저체중', range: 'BMI 18.5 미만', total: [12.5, 18], weekly: [0.44, 0.58], twins: null },
  { key: 'normal', label: '정상', range: 'BMI 18.5~24.9', total: [11.5, 16], weekly: [0.35, 0.5], twins: [17, 25] },
  { key: 'over', label: '과체중', range: 'BMI 25~29.9', total: [7, 11.5], weekly: [0.23, 0.33], twins: [14, 23] },
  { key: 'obese', label: '비만', range: 'BMI 30 이상', total: [5, 9], weekly: [0.17, 0.27], twins: [11, 19] },
];
export const FIRST_TRI = [0.5, 2];
export const EXTRA_KCAL = [0, 340, 450];                                    /* 분기별 하루 추가 칼로리 (미국 CDC) */
export const PW_STATUS = { below: '권장보다 적게 늘었어요', within: '권장 범위 안이에요', above: '권장보다 많이 늘었어요' };
const r1 = (x) => Math.round(x * 10) / 10;
export const pwBmi = (h, kg) => r1(kg / Math.pow(h / 100, 2));
export const pwCat = (bmi) => bmi < 18.5 ? PW_CATS[0] : bmi < 25 ? PW_CATS[1] : bmi < 30 ? PW_CATS[2] : PW_CATS[3];
export const pwCatBy = (key) => PW_CATS.find((c) => c.key === key);
export const trimester = (w) => w <= 13 ? 1 : w <= 27 ? 2 : 3;

/* 임신 w주까지 임신 전보다 늘어난 몸무게의 권장 범위 [하한, 상한] kg */
export function gainRange(cat, week) {
  const c = typeof cat === 'string' ? pwCatBy(cat) : cat, w = Math.max(0, Math.min(40, week));
  if (w <= 13) return [r1(FIRST_TRI[0] * w / 13), r1(FIRST_TRI[1] * w / 13)];
  const t = (w - 13) / 27;
  return [r1(FIRST_TRI[0] + (c.total[0] - FIRST_TRI[0]) * t), r1(FIRST_TRI[1] + (c.total[1] - FIRST_TRI[1]) * t)];
}

/* 키·임신 전 몸무게·지금 몸무게·주수·쌍둥이 → 판정. 쌍둥이는 IOM 잠정 총량만(주차별 범위 없음) */
export function pregWeight(h, pre, now, week, twins) {
  const bmi = pwBmi(h, pre), cat = pwCat(bmi), total = twins ? cat.twins : cat.total;
  const res = { bmi, cat, total, target: total ? [r1(pre + total[0]), r1(pre + total[1])] : null };
  if (!twins && week > 0) {
    const [lo, hi] = gainRange(cat, week);
    res.range = [lo, hi]; res.targetNow = [r1(pre + lo), r1(pre + hi)];
    if (now > 0) { const g = r1(now - pre); res.gain = g; res.status = g < lo ? 'below' : g > hi ? 'above' : 'within'; }
  }
  return res;
}
