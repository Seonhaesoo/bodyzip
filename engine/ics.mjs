/* 캘린더 내보내기 — 아기 예방접종·건강검진·기념일을 iCalendar(.ics) 문자열로, 구글 캘린더 추가 링크로. 빌드(Node)와 브라우저 공용 */
import { VACCINES, CHECKUPS, addDays, addMonths, iso } from './dates.mjs';

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
  if (opt.milestones !== false) ev.push(
    { uid: 'd100', kind: 'mark', date: addDays(birth, 99), summary: '🎉 100일', desc: '태어난 날을 1일로 세어 100일째' },
    { uid: 'y1', kind: 'mark', date: addMonths(birth, 12), summary: '🎂 첫돌', desc: '' },
    { uid: 'y2', kind: 'mark', date: addMonths(birth, 24), summary: '🎂 두돌', desc: '' },
  );
  ev.sort((a, b) => a.date - b.date);
  return ev;
}

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
