/* 건강검진 수치 해석 — 혈압·공복혈당·당화혈색소·콜레스테롤·중성지방·간수치·요산
 * 출처: 대한고혈압학회 2022, 대한당뇨병학회 2023, 한국지질동맥경화학회 2022, 국가건강검진 판정 기준 */

/* ---------- 혈압 ---------- */
export const BP_LEVELS = [
  { key: 'normal', label: '정상혈압', note: '가장 좋은 상태입니다. 2년마다 재세요.' },
  { key: 'attention', label: '주의혈압', note: '아직 고혈압은 아니지만 위로 올라가는 길목입니다. 싱겁게 먹고 체중을 관리하세요.' },
  { key: 'pre', label: '고혈압 전단계', note: '생활습관 교정이 필요한 구간입니다. 6개월~1년마다 재고 짜게 먹지 않도록 하세요.' },
  { key: 'stage1', label: '고혈압 1기', note: '여러 번 재도 이 수치라면 진료가 필요합니다. 생활습관 교정과 함께 약물치료를 고려합니다.' },
  { key: 'stage2', label: '고혈압 2기', note: '병원 진료가 필요합니다. 대개 약물치료를 바로 시작합니다.' },
  { key: 'crisis', label: '고혈압 위기', note: '180/120 이상입니다. 두통·시야 흐림·가슴 통증이 있으면 바로 응급실로 가세요.' },
];
const bpLevel = (k) => BP_LEVELS.find((x) => x.key === k);
export function bloodPressure(sys, dia) {
  let key;
  if (sys >= 180 || dia >= 120) key = 'crisis';
  else if (sys >= 160 || dia >= 100) key = 'stage2';
  else if (sys >= 140 || dia >= 90) key = 'stage1';
  else if (sys >= 130 || dia >= 80) key = 'pre';
  else if (sys >= 120) key = 'attention';
  else key = 'normal';
  const iso = sys >= 140 && dia < 90;                    /* 수축기 단독 고혈압 */
  return { sys, dia, pulse: sys - dia, ...bpLevel(key), key, isolated: iso, high: key === 'stage1' || key === 'stage2' || key === 'crisis' };
}

/* ---------- 공복혈당 · 당화혈색소 ---------- */
export function glucose(v) {
  if (v < 70) return { key: 'low', label: '저혈당 의심', note: '70mg/dL 미만입니다. 어지럼·식은땀이 함께 있으면 진료가 필요합니다.' };
  if (v < 100) return { key: 'normal', label: '정상', note: '정상 범위입니다(100 미만).' };
  if (v < 126) return { key: 'pre', label: '공복혈당장애 (당뇨 전단계)', note: '100~125mg/dL입니다. 체중을 5~7% 줄이고 주 150분 운동하면 당뇨로 가는 것을 크게 늦춥니다.' };
  return { key: 'dm', label: '당뇨병 의심', note: '126mg/dL 이상이 두 번 나오면 당뇨병으로 진단합니다. 내분비내과 진료를 받으세요.' };
}
export function hba1c(v) {
  if (v < 5.7) return { key: 'normal', label: '정상', note: '5.7% 미만입니다.' };
  if (v < 6.5) return { key: 'pre', label: '당뇨 전단계', note: '5.7~6.4%입니다. 식사와 운동으로 되돌릴 수 있는 구간입니다.' };
  return { key: 'dm', label: '당뇨병 범위', note: '6.5% 이상입니다. 진료가 필요합니다.' };
}
export const glucoseAfter = (v) => v < 140 ? { key: 'normal', label: '정상' } : v < 200 ? { key: 'pre', label: '내당능장애' } : { key: 'dm', label: '당뇨병 범위' };

/* ---------- 콜레스테롤 ---------- */
export function totalChol(v) {
  if (v < 200) return { key: 'ok', label: '적정', note: '200mg/dL 미만입니다.' };
  if (v < 240) return { key: 'border', label: '경계', note: '200~239mg/dL입니다. 포화지방을 줄이고 운동을 늘리세요.' };
  return { key: 'high', label: '높음', note: '240mg/dL 이상입니다. LDL과 중성지방을 함께 보고 진료를 받으세요.' };
}
export function ldl(v) {
  if (v < 100) return { key: 'ok', label: '적정', note: '100mg/dL 미만입니다.' };
  if (v < 130) return { key: 'near', label: '정상', note: '100~129mg/dL입니다.' };
  if (v < 160) return { key: 'border', label: '경계', note: '130~159mg/dL입니다.' };
  if (v < 190) return { key: 'high', label: '높음', note: '160~189mg/dL입니다. 진료가 필요할 수 있습니다.' };
  return { key: 'veryhigh', label: '매우 높음', note: '190mg/dL 이상입니다. 가족성 고콜레스테롤혈증 가능성도 확인합니다.' };
}
export function hdl(v) {
  if (v < 40) return { key: 'low', label: '낮음 (위험)', note: '40mg/dL 미만은 심혈관 위험을 높입니다. 유산소 운동이 가장 잘 듣습니다.' };
  if (v < 60) return { key: 'ok', label: '보통', note: '40~59mg/dL입니다.' };
  return { key: 'good', label: '높음 (좋음)', note: '60mg/dL 이상은 보호 인자로 봅니다.' };
}
export function triglyceride(v) {
  if (v < 150) return { key: 'ok', label: '적정', note: '150mg/dL 미만입니다.' };
  if (v < 200) return { key: 'border', label: '경계', note: '150~199mg/dL입니다. 술과 단순당을 줄이면 빨리 내려갑니다.' };
  if (v < 500) return { key: 'high', label: '높음', note: '200~499mg/dL입니다. 금주와 체중 감량이 필요합니다.' };
  return { key: 'veryhigh', label: '매우 높음', note: '500mg/dL 이상은 췌장염 위험이 있어 바로 진료가 필요합니다.' };
}
/* LDL 추정 — Friedewald 식 (중성지방 400 미만에서만 유효) */
export const ldlEstimate = (total, hdlV, tg) => tg >= 400 ? null : Math.round(total - hdlV - tg / 5);

/* ---------- 간 수치 ---------- */
export const LIVER_REF = { ast: [0, 40], alt: [0, 40], ggt: { m: [11, 63], f: [8, 35] } };
export function liver(ast, alt) {
  const hi = Math.max(ast, alt);
  const ratio = alt > 0 ? Math.round(ast / alt * 100) / 100 : null;
  let key, label, note;
  if (hi <= 40) { key = 'ok'; label = '정상'; note = '두 수치 모두 40 IU/L 이하입니다.'; }
  else if (hi <= 80) { key = 'mild'; label = '경도 상승'; note = '정상 상한의 2배 이내입니다. 술·과체중·약물이 흔한 원인이며 1~3개월 뒤 재검을 권합니다.'; }
  else if (hi <= 200) { key = 'moderate'; label = '중등도 상승'; note = '원인을 찾는 검사가 필요합니다. 지방간·간염·약물을 확인합니다.'; }
  else { key = 'severe'; label = '고도 상승'; note = '급성 간염 등을 의심합니다. 바로 진료를 받으세요.'; }
  return { ast, alt, ratio, key, label, note, alcoholHint: ratio != null && ratio >= 2 && hi > 40 };
}
export function ggt(v, sex = 'm') {
  const [lo, hi] = LIVER_REF.ggt[sex === 'f' ? 'f' : 'm'];
  if (v < lo) return { key: 'low', label: '기준 아래', note: '임상적 의미는 크지 않습니다.' };
  if (v <= hi) return { key: 'ok', label: '정상', note: `${lo}~${hi} IU/L 범위 안입니다.` };
  if (v <= hi * 2) return { key: 'mild', label: '경도 상승', note: '음주와 지방간에서 가장 먼저 올라가는 수치입니다.' };
  return { key: 'high', label: '상승', note: '금주 후 재검을 권합니다. 담도 질환도 확인합니다.' };
}

/* ---------- 요산 ---------- */
export function uric(v, sex = 'm') {
  const hi = sex === 'f' ? 6.0 : 7.0, lo = sex === 'f' ? 2.4 : 3.4;
  if (v < lo) return { key: 'low', label: '기준 아래', note: '대개 문제되지 않습니다.' };
  if (v <= hi) return { key: 'ok', label: '정상', note: `${lo}~${hi} mg/dL 범위 안입니다.` };
  if (v <= 9) return { key: 'high', label: '고요산혈증', note: '통풍 위험 구간입니다. 맥주·내장·과당 음료를 줄이세요.' };
  return { key: 'veryhigh', label: '고요산혈증 (높음)', note: '통풍 발작과 요로결석 위험이 큽니다. 진료가 필요합니다.' };
}

/* ---------- 종합 ---------- */
export const CHECK_ITEMS = [
  { key: 'sys', label: '수축기 혈압', unit: 'mmHg' },
  { key: 'dia', label: '이완기 혈압', unit: 'mmHg' },
  { key: 'glucose', label: '공복혈당', unit: 'mg/dL' },
  { key: 'hba1c', label: '당화혈색소', unit: '%' },
  { key: 'total', label: '총콜레스테롤', unit: 'mg/dL' },
  { key: 'hdl', label: 'HDL', unit: 'mg/dL' },
  { key: 'ldl', label: 'LDL', unit: 'mg/dL' },
  { key: 'tg', label: '중성지방', unit: 'mg/dL' },
  { key: 'ast', label: 'AST', unit: 'IU/L' },
  { key: 'alt', label: 'ALT', unit: 'IU/L' },
  { key: 'ggt', label: '감마지티피', unit: 'IU/L' },
  { key: 'uric', label: '요산', unit: 'mg/dL' },
];
const BAD = { crisis: 3, stage2: 3, severe: 3, veryhigh: 3, dm: 3, stage1: 2, moderate: 2, high: 2, pre: 1, border: 1, mild: 1, low: 1 };
export function summary(v, sex = 'm') {
  const rows = [];
  if (v.sys && v.dia) { const r = bloodPressure(v.sys, v.dia); rows.push({ name: '혈압', value: `${v.sys}/${v.dia}`, unit: 'mmHg', ...r }); }
  if (v.glucose) rows.push({ name: '공복혈당', value: v.glucose, unit: 'mg/dL', ...glucose(v.glucose) });
  if (v.hba1c) rows.push({ name: '당화혈색소', value: v.hba1c, unit: '%', ...hba1c(v.hba1c) });
  if (v.total) rows.push({ name: '총콜레스테롤', value: v.total, unit: 'mg/dL', ...totalChol(v.total) });
  if (v.hdl) rows.push({ name: 'HDL', value: v.hdl, unit: 'mg/dL', ...hdl(v.hdl) });
  if (v.ldl) rows.push({ name: 'LDL', value: v.ldl, unit: 'mg/dL', ...ldl(v.ldl) });
  if (v.tg) rows.push({ name: '중성지방', value: v.tg, unit: 'mg/dL', ...triglyceride(v.tg) });
  if (v.ast || v.alt) { const r = liver(v.ast || 0, v.alt || 0); rows.push({ name: '간수치 (AST/ALT)', value: `${v.ast || '—'}/${v.alt || '—'}`, unit: 'IU/L', ...r }); }
  if (v.ggt) rows.push({ name: '감마지티피', value: v.ggt, unit: 'IU/L', ...ggt(v.ggt, sex) });
  if (v.uric) rows.push({ name: '요산', value: v.uric, unit: 'mg/dL', ...uric(v.uric, sex) });
  const worst = rows.reduce((a, r) => Math.max(a, BAD[r.key] || 0), 0);
  return { rows, worst, text: worst >= 3 ? '진료가 필요한 수치가 있습니다' : worst === 2 ? '한 번 더 확인이 필요한 수치가 있습니다' : worst === 1 ? '관리가 필요한 구간이 있습니다' : rows.length ? '모두 정상 범위입니다' : '수치를 넣어 주세요' };
}
