/* 캘린더 내보내기 — 아기 예방접종·건강검진·기념일을 iCalendar(.ics) 문자열로, 구글 캘린더 추가 링크로. 빌드(Node)와 브라우저 공용 */
import { VACCINES, CHECKUPS, MILESTONES, addDays, addMonths, iso, cycle } from './dates.mjs';
import { DOG_VACCINES, CAT_VACCINES } from './pet.mjs';

const SITE = 'https://momja.com';
const ymd = (dt) => iso(dt).replace(/-/g, '');
const byteLen = (s) => unescape(encodeURIComponent(s)).length;
const escText = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/* RFC 5545: 한 줄 75옥텟 이하, 이어지는 줄은 공백으로 시작. 멀티바이트 글자는 자르지 않는다 */
function fold(line) {
  const out = []; let cur = '', len = 0;
  for (const ch of line) { const b = byteLen(ch); if (len + b > 74) { out.push(cur); cur = ' ' + ch; len = 1 + b; } else { cur += ch; len += b; } }
  out.push(cur);
  return out.join('\r\n');
}
export const monthLabel = (m) => m === 0 ? '출생 직후' : m >= 48 ? `만 ${Math.floor(m / 12)}세` : `${m}개월`;

/* 생년월일 → 캘린더 항목 목록(날짜순). 같은 날 접종은 하나로 묶는다 */
export function babyEvents(birth, opt = {}) {
  const ev = [];
  const byM = new Map();
  for (const v of VACCINES) for (const [m, label] of v.doses) { if (!byM.has(m)) byM.set(m, []); byM.get(m).push(`${v.name} — ${label}`); }
  for (const [m, items] of [...byM.entries()].sort((a, b) => a[0] - b[0])) {
    ev.push({ uid: `v${m}`, kind: 'vaccine', date: addMonths(birth, m), summary: `💉 예방접종 ${monthLabel(m)} (${items.length}가지)`, desc: `${items.map((s) => `· ${s}`).join('\n')}\n\n국가예방접종 표준 일정(질병관리청)의 시작 시기입니다. 실제 접종일은 소아과와 상의하세요.` });
  }
  if (opt.checkups !== false) for (const c of CHECKUPS) ev.push({ uid: `c${c.key}`, kind: 'checkup', date: c.days != null ? addDays(birth, c.days) : addMonths(birth, c.m), summary: `🩺 영유아 건강검진 ${c.label}`, desc: `검진 기간 시작일입니다. 기간 안에 검진 지정 병원에서 받으세요.${c.dental ? ` 구강검진 ${c.dental}도 함께 받을 수 있습니다.` : ''}` });
  if (opt.food !== false) ev.push(...FOOD_STAGES.map((f) => ({ uid: `f${f.m}`, kind: 'food', date: addMonths(birth, f.m), summary: `🥣 이유식 ${f.label} 시작`, desc: f.desc })));
  if (opt.milestones !== false) ev.push(
    { uid: 'd100', kind: 'mark', date: addDays(birth, 99), summary: '🎉 100일', desc: '태어난 날을 1일로 세어 100일째' },
    { uid: 'y1', kind: 'mark', date: addMonths(birth, 12), summary: '🎂 첫돌', desc: '' },
    { uid: 'y2', kind: 'mark', date: addMonths(birth, 24), summary: '🎂 두돌', desc: '' },
  );
  ev.sort((a, b) => a.date - b.date);
  return ev;
}

export const FOOD_STAGES = [
  { m: 6, label: '초기 (미음)', desc: '쌀미음부터 하루 1회. 고개를 가누고 음식에 관심을 보이면 4~6개월 사이 시작(모유 수유아는 6개월 권장). 소고기·달걀노른자 등 새 재료는 3일 간격으로 하나씩.' },
  { m: 7, label: '중기 (으깬 죽)', desc: '하루 2회, 으깬 형태. 철분이 풍부한 고기·달걀노른자, 채소를 늘리고 알레르기 재료(달걀흰자·생선·밀)를 하나씩 시험.' },
  { m: 9, label: '후기 (무른 밥)', desc: '하루 3회, 손으로 집어 먹는 핑거푸드 시작. 컵으로 물 마시기 연습.' },
  { m: 12, label: '완료기 (진밥·유아식)', desc: '하루 3회 + 간식 2회. 생우유 400~500ml, 젖병 떼기 시작. 소금·설탕은 최소로.' },
];
export function babyIcs(birth, opt = {}) {
  const stamp = `${ymd(opt.now || new Date())}T000000Z`;
  const url = `${SITE}/baby/${iso(birth)}/`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//momja.com//baby calendar//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${escText(`아기 예방접종 (${iso(birth)}생)`)}`, 'X-WR-TIMEZONE:Asia/Seoul'];
  for (const e of babyEvents(birth, opt)) {
    lines.push('BEGIN:VEVENT', `UID:momja-${iso(birth)}-${e.uid}@momja.com`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${ymd(addDays(e.date, 1))}`, `SUMMARY:${escText(e.summary)}`);
    if (e.desc) lines.push(`DESCRIPTION:${escText(`${e.desc}\n${url}`)}`);
    lines.push(`URL:${url}`, 'TRANSP:TRANSPARENT', 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escText(`내일: ${e.summary}`)}`, 'TRIGGER:-PT15H', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

/* 구글 캘린더 "일정 추가" 링크 (하루 종일 일정) */
export function gcalUrl(summary, date, desc = '', url = '') {
  const q = encodeURIComponent;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${q(summary)}&dates=${ymd(date)}/${ymd(addDays(date, 1))}&details=${q(url ? `${desc}\n${url}` : desc)}&ctz=Asia/Seoul`;
}

/* ---------- 공용 쓰기 ---------- */
function icsDoc(name, events, url, opt = {}) {
  const stamp = `${ymd(opt.now || new Date())}T000000Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//momja.com//calendar//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${escText(name)}`, 'X-WR-TIMEZONE:Asia/Seoul'];
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:momja-${e.uid}@momja.com`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${ymd(e.end ? addDays(e.end, 1) : addDays(e.date, 1))}`, `SUMMARY:${escText(e.summary)}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    if (e.desc) lines.push(`DESCRIPTION:${escText(`${e.desc}\n${url}`)}`);
    lines.push(`URL:${url}`, 'TRANSP:TRANSPARENT');
    if (e.alarm !== false) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escText(`내일: ${e.summary}`)}`, 'TRIGGER:-PT15H', 'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

/* 임신 검사 일정 — 마지막 생리 시작일 기준 */
export function pregnancyEvents(lmp) {
  return MILESTONES.map((m) => ({ uid: `p-${iso(lmp)}-w${m.week}`, date: addDays(lmp, m.week * 7), summary: m.week === 40 ? '👶 출산예정일' : `🤰 ${m.week}주 · ${m.label.split(' — ')[0].split(' · ')[0]}`, desc: `임신 ${m.week}주 (마지막 생리 ${iso(lmp)} 기준). ${m.label}` }));
}
export function pregnancyIcs(lmp, opt = {}) {
  const mm = lmp.getUTCMonth() + 1, dd = lmp.getUTCDate();
  return icsDoc(`임신 일정 (예정일 ${iso(addDays(lmp, 280))})`, pregnancyEvents(lmp), `${SITE}/due-date/${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}/`, opt);
}

/* 생리주기 — 다음 n번의 생리 예정일·배란 예정일·가임기 */
export function cycleEvents(lmp, len = 28, n = 6) {
  const ev = [];
  for (let i = 1; i <= n; i++) {
    const start = addDays(lmp, len * (i - 1)), c = cycle(start, len);
    ev.push({ uid: `c-${iso(lmp)}-${len}-ov${i}`, date: c.ovulation, summary: '🥚 배란 예정일', desc: `주기 ${len}일 기준 배란 예정일. 가임기 ${iso(c.fertileStart)}~${iso(c.fertileEnd)}.`, alarm: false });
    ev.push({ uid: `c-${iso(lmp)}-${len}-f${i}`, date: c.fertileStart, end: c.fertileEnd, summary: '💛 가임기', desc: `배란 5일 전 ~ 1일 뒤. 임신 준비용 참고이며 피임 방법이 아닙니다.`, alarm: false });
    ev.push({ uid: `c-${iso(lmp)}-${len}-p${i}`, date: c.next, summary: '🩸 생리 예정일', desc: `주기 ${len}일 기준 ${i}번째 생리 예정일.` });
  }
  return ev.sort((a, b) => a.date - b.date);
}
export function cycleIcs(lmp, len = 28, opt = {}) {
  const mm = lmp.getUTCMonth() + 1, dd = lmp.getUTCDate();
  return icsDoc(`생리주기 (${len}일 · ${iso(lmp)} 시작)`, cycleEvents(lmp, len, opt.n || 6), `${SITE}/ovulation/${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}/`, opt);
}

/* 반려동물 예방접종 */
export function petEvents(kind, birth) {
  const list = kind === 'cat' ? CAT_VACCINES : DOG_VACCINES, name = kind === 'cat' ? '고양이' : '강아지';
  const byW = new Map();
  for (const v of list) v.weeks.forEach((w, i) => { if (!byW.has(w)) byW.set(w, []); byW.get(w).push(`${v.name} ${i + 1}차`); });
  const ev = [...byW.entries()].sort((a, b) => a[0] - b[0]).map(([w, items]) => ({ uid: `${kind}-${iso(birth)}-w${w}`, date: addDays(birth, w * 7), summary: `🐾 ${name} 예방접종 ${w}주 (${items.length}가지)`, desc: `${items.map((s) => `· ${s}`).join('\n')}\n\n국내 동물병원 일반 일정. 실제 접종은 수의사와 상의하세요.` }));
  const last = Math.max(...list.filter((v) => v.yearly).map((v) => v.weeks[v.weeks.length - 1]));
  const yearly = list.filter((v) => v.yearly).map((v) => v.name.split(' (')[0]).join('·');
  for (const y of [1, 2, 3]) ev.push({ uid: `${kind}-${iso(birth)}-y${y}`, date: addDays(addMonths(birth, 12 * y), last * 7), summary: `🐾 ${name} 연간 추가 접종 (${y}년차)`, desc: `${yearly} 추가 접종 시기.` });
  ev.push({ uid: `${kind}-${iso(birth)}-hw`, date: addDays(birth, 56), summary: `💊 심장사상충·외부기생충 예방약 (매달)`, desc: '생후 8주부터 평생 매달 같은 날. 겨울에도 거르지 않기.', rrule: 'FREQ=MONTHLY;COUNT=36' });
  ev.push({ uid: `${kind}-${iso(birth)}-neuter`, date: addMonths(birth, 6), summary: `🩺 중성화 상담 (6개월)`, desc: '중성화 시기와 방법을 수의사와 상의하는 시점.' });
  ev.push({ uid: `${kind}-${iso(birth)}-bd`, date: addMonths(birth, 12), summary: `🎂 ${name} 첫 생일`, desc: '' });
  return ev.sort((a, b) => a.date - b.date);
}
export function petIcs(kind, birth, opt = {}) {
  return icsDoc(`${kind === 'cat' ? '고양이' : '강아지'} 예방접종 (${iso(birth)}생)`, petEvents(kind, birth), `${SITE}/pet/${kind}-vaccine/${iso(birth)}/`, opt);
}
