/* 어린이 해열제 1회 용량 — 아세트아미노펜·이부프로펜·덱시부프로펜 시럽
 * 출처(2026-11-16 확인): 식약처 의약품안전나라 허가 용법·용량
 *   아세트아미노펜 3.2g/100mL(32mg/mL) — 어린이타이레놀현탁액(품목 202200525)·챔프시럽(201206715): 만 12세 이하, 1회 10~15mg/kg, 4~6시간마다, 1일 5회(75mg/kg) 넘지 않게, 일일 최대 4,000mg. 표는 4개월(7kg)부터
 *   이부프로펜 2g/100mL(20mg/mL) — 어린이부루펜시럽(198601920)·챔프이부펜시럽(201604402): 나이별 1회·1일 최대(1~2세 50~100mg·400mg … 11~14세 200~250mg·1,000mg), 1일 3~4회
 *   덱시부프로펜 1.2g/100mL(12mg/mL) — 맥시부펜시럽(200608160): 생후 6개월 이상, 1회 5~7mg/kg, 1일 최대 4회(28mg/kg). 표 끝 12세 43kg 이상 215~300mg·1일 1,200mg
 *   식품의약품안전평가원 소아 해열제 안내(2025.12): 이부프로펜 1회 5~10mg/kg, 이부프로펜·덱시부프로펜 6~8시간 간격 1일 최대 4회
 * 라벨보다 많이 나오지 않게 — 몸무게 계산과 라벨 나이 표가 겹치는 범위만, 위쪽은 내림·아래쪽은 올림. */

/* 나이 고르기 — mo: 그 칸의 시작 개월 */
export const FEVER_AGES = [
  { key: 'm0', label: '생후 0~3개월', mo: 0 },
  { key: 'm4', label: '생후 4~5개월', mo: 4 },
  { key: 'm6', label: '생후 6~11개월', mo: 6 },
  ...Array.from({ length: 12 }, (_, i) => ({ key: 'y' + (i + 1), label: i === 0 ? '만 1세 (12~23개월)' : `만 ${i + 1}세`, mo: (i + 1) * 12 })),
  { key: 'y13', label: '만 13~14세', mo: 156 },
  { key: 'y15', label: '만 15세 이상', mo: 180 },
];
export const feverAge = (key) => FEVER_AGES.find((a) => a.key === key) || null;

export const FEVER_DRUGS = {
  apap: { key: 'apap', name: '아세트아미노펜', mgPerMl: 32, strength: '32mg/mL (5mL에 160mg)', perKg: [10, 15], maxPerDose: 640, maxDoses: 5, maxPerKgDay: 75, maxDay: 4000, minMo: 4, endMo: 156, interval: '4~6시간', minHours: 4, buy: '약국·편의점(안전상비의약품)' },
  ibu: { key: 'ibu', name: '이부프로펜', mgPerMl: 20, strength: '20mg/mL (5mL에 100mg)', perKg: [5, 10], maxDoses: 4, minMo: 12, endMo: 180, interval: '6~8시간', minHours: 6, buy: '약국·편의점(안전상비의약품)',
    bands: [
      { from: 12, to: 35, lo: 50, hi: 100, day: 400, label: '1~2세' },
      { from: 36, to: 83, lo: 100, hi: 150, day: 600, label: '3~6세' },
      { from: 84, to: 131, lo: 150, hi: 200, day: 800, label: '7~10세' },
      { from: 132, to: 179, lo: 200, hi: 250, day: 1000, label: '11~14세' },
    ] },
  dexi: { key: 'dexi', name: '덱시부프로펜', mgPerMl: 12, strength: '12mg/mL (5mL에 60mg)', perKg: [5, 7], maxPerDose: 300, maxDoses: 4, maxPerKgDay: 28, maxDay: 1200, minMo: 6, endMo: 156, interval: '6~8시간', minHours: 6, buy: '약국' },
};

/* 설명서의 몸무게 표 — 아세트아미노펜 32mg/mL, 덱시부프로펜 12mg/mL */
export const APAP_LABEL = [
  { age: '4~6개월', kg: [7, 7.9], mg: '80', ml: '2.5' },
  { age: '7~23개월', kg: [8, 11.9], mg: '120', ml: '3.5' },
  { age: '만 2~3세', kg: [12, 15.9], mg: '160', ml: '5' },
  { age: '만 4~6세', kg: [16, 22.9], mg: '240', ml: '7.5' },
  { age: '만 7~8세', kg: [23, 29.9], mg: '320', ml: '10' },
  { age: '만 9~10세', kg: [30, 37.9], mg: '400', ml: '12.5' },
  { age: '만 11세', kg: [38, 42.9], mg: '480', ml: '15' },
  { age: '만 12세', kg: [43, 999], mg: '640', ml: '20' },
];
export const DEXI_LABEL = [
  { age: '6~11개월', kg: [7.9, 9.9], mg: '40~70', ml: '3~6', day: '160~280mg (12~24mL)' },
  { age: '12~23개월', kg: [10, 11.9], mg: '50~80', ml: '4~7', day: '200~320mg (16~28mL)' },
  { age: '2~3세', kg: [12, 15.9], mg: '60~110', ml: '5~9', day: '240~440mg (20~36mL)' },
  { age: '4~5세', kg: [16, 20.9], mg: '80~145', ml: '7~12', day: '320~580mg (28~48mL)' },
  { age: '6~8세', kg: [21, 29.9], mg: '105~210', ml: '9~17', day: '420~840mg (36~68mL)' },
  { age: '9~10세', kg: [30, 37.9], mg: '150~265', ml: '12.5~22', day: '600~1,060mg (50~88mL)' },
  { age: '11세', kg: [38, 42.9], mg: '190~300', ml: '16~25', day: '760~1,200mg (64~100mL)' },
  { age: '12세', kg: [43, 999], mg: '215~300', ml: '18~25', day: '860~1,200mg (72~100mL)' },
];
export const labelRow = (drug, kg) => (drug === 'dexi' ? DEXI_LABEL : APAP_LABEL).find((r) => kg >= r.kg[0] && kg <= r.kg[1] + 0.05) || null;

const up1 = (x) => Math.ceil(x * 10 - 1e-9) / 10;     /* mL 아래쪽은 올림 */
const down1 = (x) => Math.floor(x * 10 + 1e-9) / 10;  /* mL 위쪽은 내림 — 라벨 상한을 넘지 않게 */

/* 1회 용량 — ok:false 면 reason 만 보여 준다 */
export function feverDose(drug, kg, mo) {
  const d = FEVER_DRUGS[drug];
  if (!d) return null;
  const base = { drug, name: d.name, strength: d.strength, interval: d.interval, minHours: d.minHours, maxDoses: d.maxDoses };
  if (!(kg >= 3 && kg <= 80)) return { ...base, ok: false, reason: '몸무게를 3~80kg 사이로 넣어 주세요.' };
  if (mo < d.minMo) {
    const why = drug === 'apap' ? '설명서의 용량표가 생후 4개월부터입니다. 4개월 미만은 의사에게 먼저 진료를 받으세요.'
      : drug === 'ibu' ? '설명서의 나이별 표가 만 1세부터라 그 아래는 정해진 용량이 없습니다. 의사·약사가 정한 양을 따르세요.'
      : '생후 6개월부터 먹는 약입니다(6개월 미만은 안전성이 확립되지 않음).';
    return { ...base, ok: false, reason: why };
  }
  if (mo >= d.endMo) return { ...base, ok: false, reason: drug === 'ibu' ? '어린이 표는 14세까지입니다. 15세 이상은 제품 설명서의 성인 용량을 보세요.' : '어린이 표는 만 12세까지입니다. 그 위는 제품 설명서의 청소년·성인 용량을 보세요.' };
  let lo = d.perKg[0] * kg, hi = d.perKg[1] * kg, band = null;
  if (d.maxPerDose) hi = Math.min(hi, d.maxPerDose);
  if (d.bands) {
    band = d.bands.find((b) => mo >= b.from && mo <= b.to);
    if (!band) return { ...base, ok: false, reason: '설명서에 이 나이의 용량이 없습니다.' };
    lo = Math.max(lo, band.lo); hi = Math.min(hi, band.hi);
  }
  lo = Math.ceil(lo - 1e-9); hi = Math.floor(hi + 1e-9);
  if (!band && lo > hi) lo = hi;   /* 몸무게가 커서 1kg당 하한이 설명서 표의 1회 최대를 넘으면 그 최대만 */
  if (lo > hi) {
    return { ...base, ok: false, band, reason: `몸무게로 셈한 양(${Math.round(d.perKg[0] * kg)}~${Math.round(d.perKg[1] * kg)}mg)과 설명서의 ${band.label} 용량(${band.lo}~${band.hi}mg)이 겹치지 않습니다. 몸무게가 또래와 많이 다르면 약사·의사에게 양을 물어보세요.` };
  }
  let day = d.maxDoses * hi;
  if (d.maxPerKgDay) day = Math.min(day, d.maxPerKgDay * kg);
  if (d.maxDay) day = Math.min(day, d.maxDay);
  if (band) day = Math.min(day, band.day);
  day = Math.floor(day + 1e-9);
  const ml = [up1(lo / d.mgPerMl), down1(hi / d.mgPerMl)];
  const notes = [];
  if (drug === 'apap' && kg < 7) notes.push('설명서 표의 가장 가벼운 칸(7kg)보다 가볍습니다. 먹이기 전에 의사·약사와 상의하세요.');
  if (drug === 'dexi' && kg < 7.9) notes.push('설명서 표의 가장 가벼운 칸(7.9kg)보다 가볍습니다. 먹이기 전에 의사·약사와 상의하세요.');
  if (mo < 24 && drug !== 'dexi') notes.push('만 2세 미만은 설명서상 먹이기 전에 의사·약사와 상의하도록 되어 있습니다.');
  return { ...base, ok: true, mg: [lo, hi], ml, dayMg: day, dayMl: down1(day / d.mgPerMl), band, label: drug === 'ibu' ? null : labelRow(drug, kg), notes };
}

export const feverAll = (kg, mo) => ['apap', 'ibu', 'dexi'].map((k) => feverDose(k, kg, mo));
