/* 날짜 계산 — 출산예정일(네겔레 법칙: 마지막 생리 시작일 + 280일), 임신 주수, 배란일·가임기, 아기 개월수, 예방접종 일정. 모두 UTC 날짜로 계산해 시간대 오차를 없앤다. */

export const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
export const addDays = (dt, n) => new Date(dt.getTime() + n * 86400000);
export const diffDays = (a, b) => Math.round((b.getTime() - a.getTime()) / 86400000);
export const iso = (dt) => dt.toISOString().slice(0, 10);
export const fmt = (dt) => `${dt.getUTCFullYear()}년 ${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일`;
export const fmtShort = (dt) => `${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일`;
export const WD = ['일', '월', '화', '수', '목', '금', '토'];
export const wd = (dt) => WD[dt.getUTCDay()] + '요일';
export const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/* ---------- 임신 ---------- */
export function pregnancy(lmp) {
  const due = addDays(lmp, 280);
  const conception = addDays(lmp, 14);
  return { lmp, due, conception, trimester2: addDays(lmp, 14 * 7), trimester3: addDays(lmp, 28 * 7), fullTerm: addDays(lmp, 37 * 7) };
}
/* 어느 날짜의 임신 주수 (주, 일) */
export function weeksOn(lmp, date) {
  const d = diffDays(lmp, date);
  return { days: d, weeks: Math.floor(d / 7), rem: ((d % 7) + 7) % 7, trimester: d < 14 * 7 ? 1 : d < 28 * 7 ? 2 : 3 };
}
export const MILESTONES = [
  { week: 4, label: '생리 예정일 지남 — 임신 테스트기 확인 가능' },
  { week: 6, label: '초음파로 아기집·심장 박동 확인' },
  { week: 8, label: '입덧이 심해지는 시기 · 산모수첩 발급' },
  { week: 11, label: '1차 기형아 검사(목덜미 투명대, 11~13주)' },
  { week: 14, label: '2분기 시작 · 입덧이 잦아드는 시기' },
  { week: 16, label: '2차 기형아 검사(쿼드, 15~20주)' },
  { week: 20, label: '정밀 초음파(20~24주) · 태동 느끼기 시작' },
  { week: 24, label: '임신성 당뇨 검사(24~28주)' },
  { week: 28, label: '3분기 시작 · 2주 간격 진료' },
  { week: 32, label: '태아 위치 확인 · 출산 준비물 정리' },
  { week: 35, label: 'GBS(B군 연쇄상구균) 검사(35~37주)' },
  { week: 37, label: '만삭 — 언제 태어나도 정상' },
  { week: 40, label: '출산예정일' },
];

/* ---------- 생리주기 ---------- */
export function cycle(lmp, len = 28) {
  const next = addDays(lmp, len);
  const ovulation = addDays(next, -14);
  return { lmp, len, next, ovulation, fertileStart: addDays(ovulation, -5), fertileEnd: addDays(ovulation, 1), period2: addDays(lmp, len * 2) };
}

/* ---------- 아기 ---------- */
export function ageOn(birth, date) {
  let months = (date.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (date.getUTCMonth() - birth.getUTCMonth());
  let anchor = new Date(Date.UTC(birth.getUTCFullYear(), birth.getUTCMonth() + months, Math.min(birth.getUTCDate(), daysInMonth(birth.getUTCFullYear(), birth.getUTCMonth() + months + 1))));
  if (anchor > date) { months -= 1; anchor = new Date(Date.UTC(birth.getUTCFullYear(), birth.getUTCMonth() + months, Math.min(birth.getUTCDate(), daysInMonth(birth.getUTCFullYear(), birth.getUTCMonth() + months + 1)))); }
  const days = diffDays(anchor, date);
  const total = diffDays(birth, date);
  return { months, days, totalDays: total, weeks: Math.floor(total / 7), years: Math.floor(months / 12), remMonths: months % 12 };
}
/* 달 더하기 — 29~31일생은 그 달 말일로 (1월 31일 + 1개월 = 2월 28일) */
export function addMonths(dt, m) {
  const y = dt.getUTCFullYear(), mo = dt.getUTCMonth() + m;
  const yy = y + Math.floor(mo / 12), mm = ((mo % 12) + 12) % 12;
  return new Date(Date.UTC(yy, mm, Math.min(dt.getUTCDate(), daysInMonth(yy, mm + 1))));
}
/* 국가예방접종 표준 일정(질병관리청) — 개월 기준 접종 시기 */
export const VACCINES = [
  { name: 'BCG (결핵)', doses: [[0, '생후 4주 이내']] },
  { name: 'B형간염', doses: [[0, '출생 직후'], [1, '1개월'], [6, '6개월']] },
  { name: 'DTaP (디프테리아·파상풍·백일해)', doses: [[2, '2개월'], [4, '4개월'], [6, '6개월'], [15, '15~18개월'], [48, '만 4~6세']] },
  { name: 'IPV (소아마비)', doses: [[2, '2개월'], [4, '4개월'], [6, '6~18개월'], [48, '만 4~6세']] },
  { name: 'Hib (뇌수막염)', doses: [[2, '2개월'], [4, '4개월'], [6, '6개월'], [12, '12~15개월']] },
  { name: '폐렴구균 (PCV)', doses: [[2, '2개월'], [4, '4개월'], [6, '6개월'], [12, '12~15개월']] },
  { name: '로타바이러스', doses: [[2, '2개월'], [4, '4개월'], [6, '6개월 (5가 백신만)']] },
  { name: 'MMR (홍역·유행성이하선염·풍진)', doses: [[12, '12~15개월'], [48, '만 4~6세']] },
  { name: '수두', doses: [[12, '12~15개월']] },
  { name: 'A형간염', doses: [[12, '12~23개월'], [18, '1차 6개월 뒤']] },
  { name: '일본뇌염 (불활성화)', doses: [[12, '12~23개월 1·2차'], [24, '24~35개월'], [72, '만 6세'], [144, '만 12세']] },
  { name: '인플루엔자', doses: [[6, '6개월부터 매년 (첫해 2회)']] },
  { name: 'Tdap · HPV', doses: [[132, '만 11~12세']] },
];
export function vaccineDates(birth) {
  return VACCINES.map((v) => ({ name: v.name, doses: v.doses.map(([m, label]) => ({ label, date: addMonths(birth, m) })) }));
}
export const GROWTH = [
  [0, '신생아 — 하루 16~18시간 잠, 2~3시간마다 수유. 배꼽 관리와 황달 관찰.'],
  [1, '목을 잠깐 가누고 소리에 반응. 100일 전후로 밤잠이 길어지기 시작.'],
  [3, '뒤집기 시도, 손을 입에 가져감. 이유식은 4~6개월 사이에 시작.'],
  [6, '앉기 시작, 이유식 본격. 낯가림이 시작되는 시기.'],
  [9, '기어 다니고 잡고 서기. 손가락으로 집기, 옹알이가 말에 가까워짐.'],
  [12, '첫 걸음·첫 단어. 돌 이후 생우유·일반식 전환.'],
  [18, '뛰고 계단 오르기, 두 단어 말. 자기 주장이 세지는 시기.'],
  [24, '두 돌 — 문장으로 말하기 시작, 배변 훈련 준비.'],
  [36, '세 돌 — 어린이집·유치원 적응, 또래 놀이.'],
];
export function growthText(months) {
  let t = GROWTH[0][1];
  for (const [m, s] of GROWTH) if (months >= m) t = s;
  return t;
}
/* 초등학교 입학 연도: 만 6세가 되는 해의 다음 해 3월 (출생연도 + 7) */
export const schoolYear = (birth) => birth.getUTCFullYear() + 7;
