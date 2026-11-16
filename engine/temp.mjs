/* 아기·어린이 체온 판정 — 잰 곳 · 나이 · 체온 → 정상 / 미열 / 열 / 바로 진료
 * 출처(2026-11-16 확인):
 *   대한소아청소년과학회 질환상식 「[감염] 소아 발열」(서울대학교어린이병원 한미선, 2019.10.10): 발열 = 직장 38℃ 이상, 겨드랑이(액와) 37.3℃ 이상 미열,
 *     38.0℃ 이상이면 의료기관 진찰, 39.0℃ 이상 고열, 생후 3개월 미만의 발열·3~36개월의 39℃ 이상은 심한 세균 감염 가능성이 높음
 *   서울대학교병원 N의학정보 「소아정상체온」: 직장 36.6~37.9℃ 정상, 체온계 종류에 상관없이 37.8℃ 이상 발열·35.5℃ 이하 저체온,
 *     37.8~38.2℃ 미열·38.3℃ 이상 의미 있는 발열, 1~2시간 뒤 다시 잼
 *   서울아산병원 소아응급실 박준성 「우리 아이 열날 때, 어떻게 해야 할까?」(2022.11.4): 3개월 미만 아기에게 열이 나면 응급실
 * 진료를 권하는 쪽(38.0℃)을 '열'로 쓰고, 출처가 따로 숫자를 주지 않은 귀·이마·입은 '체온계 종류에 상관없이 37.8℃' 기준만 쓴다. */

export const TEMP_SITES = [
  { key: 'axilla', label: '겨드랑이', mild: 37.3 },
  { key: 'ear', label: '귀 (고막)', mild: 37.8 },
  { key: 'forehead', label: '이마', mild: 37.8 },
  { key: 'oral', label: '입 (혀 밑)', mild: 37.8 },
  { key: 'rectal', label: '항문 (직장)', mild: null },
];
export const TEMP_AGES = [
  { key: 'u3', label: '생후 3개월 미만' },
  { key: 'm3', label: '생후 3~36개월' },
  { key: 'y3', label: '만 3세 이상' },
];
export const FEVER_AT = 38.0;   /* 학회: 38.0℃ 이상이면 진찰 */
export const HIGH_AT = 39.0;    /* 학회: 고열 */
export const ANY_FEVER = 37.8;  /* 서울대병원: 체온계 종류에 상관없이 발열 */
export const LOW_AT = 35.5;     /* 서울대병원: 저체온 */

const site = (k) => TEMP_SITES.find((s) => s.key === k) || TEMP_SITES[0];

/* t: ℃, siteKey: TEMP_SITES.key, ageKey: TEMP_AGES.key
 * 돌려줌: { ok, key: 'low'|'normal'|'mild'|'fever'|'urgent', label, high, why } */
export function tempCheck(t, siteKey, ageKey) {
  if (!(t >= 30 && t <= 44)) return { ok: false, key: null, label: '—', why: '체온은 30~44℃ 사이 숫자로 넣어 주세요.' };
  const s = site(siteKey), t1 = Math.round(t * 10) / 10;
  const high = t1 >= HIGH_AT;
  if (t1 <= LOW_AT) return { ok: true, key: 'low', label: '낮음', high: false, why: `${LOW_AT}℃ 이하는 저체온으로 봅니다. 추운 곳에 있다가 바로 재면 낮게 나오는 일이 많으니 따뜻한 실내에서 1~2시간 뒤 다시 재고, 계속 낮으면 진료를 받으세요.` };
  /* 생후 3개월 미만 — 열(항문 38.0℃, 그 밖의 체온계 37.8℃ 이상)이면 바로 진료 */
  const u3At = s.key === 'rectal' ? FEVER_AT : ANY_FEVER;
  if (ageKey === 'u3' && t1 >= u3At) return { ok: true, key: 'urgent', label: '바로 진료', high, why: `생후 3개월 미만 아기의 열(${s.label} ${u3At.toFixed(1)}℃ 이상)은 심한 세균 감염일 가능성이 높아 해열제보다 진료가 먼저입니다. 바로 소아응급실로 가세요.` };
  if (ageKey === 'm3' && high) return { ok: true, key: 'urgent', label: '바로 진료', high, why: `생후 3~36개월 아이가 ${HIGH_AT.toFixed(1)}℃ 이상이면 심한 세균 감염일 가능성이 높아 검사가 필요할 수 있습니다. 오늘 바로 진료를 받으세요.` };
  if (t1 >= FEVER_AT) return { ok: true, key: 'fever', label: high ? '고열' : '열', high, why: `${FEVER_AT.toFixed(1)}℃ 이상은 열입니다${high ? `(${HIGH_AT.toFixed(1)}℃ 이상은 고열)` : ''}. 의료기관에서 진찰을 받는 것이 좋습니다. 아이가 많이 처지거나 아래 응급 신호가 있으면 바로 응급실로 가세요.` };
  if (s.mild != null && t1 >= s.mild) {
    const u3 = ageKey === 'u3' ? ` 생후 3개월 미만이니 곧 다시 재 보고 ${u3At.toFixed(1)}℃ 이상이면 바로 진료를 받으세요.` : ' 1~2시간 뒤 다시 재 보고, 아이 상태와 함께 지켜보세요.';
    return { ok: true, key: 'mild', label: '미열', high: false, why: `${s.label}에서 ${s.mild}℃ 이상은 미열입니다.${u3}` };
  }
  return { ok: true, key: 'normal', label: '정상', high: false, why: `${s.label} ${t1}℃는 열이 아닙니다${s.key === 'rectal' ? `(항문 체온 정상 범위 36.6~37.9℃)` : ''}. 아이가 힘들어 보이면 다른 체온계나 다른 곳으로 다시 재 보세요.` };
}
