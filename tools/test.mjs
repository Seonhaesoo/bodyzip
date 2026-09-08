/* 엔진 검증 — node tools/test.mjs */
import * as B from '../engine/body.mjs';
import * as K from '../engine/kcal.mjs';
import * as D from '../engine/dates.mjs';
import { FOODS } from '../data/foods.mjs';
import { EXERCISES } from '../data/exercises.mjs';
import * as X from '../engine/extra.mjs';
import * as I from '../engine/ics.mjs';
import * as G from '../engine/growth.mjs';
import * as P from '../engine/pet.mjs';
import { WEEKS } from '../data/pregnancy-weeks.mjs';
import { MONTHS as BM } from '../data/baby-months.mjs';
import { GUIDES } from '../data/guides.mjs';

let pass = 0, fail = 0;
function ok(cond, name, detail = '') { if (cond) pass++; else { fail++; console.log('FAIL', name, detail); } }
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* BMI */
ok(B.bmi(170, 65) === 22.5, 'BMI 170/65 = 22.5', B.bmi(170, 65));
ok(B.bmiCat(22.5).label === '정상' && B.bmiCat(24).label.startsWith('비만 전단계') && B.bmiCat(18.4).label === '저체중' && B.bmiCat(29.9).label === '1단계 비만' && B.bmiCat(30).label === '2단계 비만' && B.bmiCat(35).key === 'ob3', 'BMI 판정 구간 (대한비만학회 2022)');
{ const r = B.normalRange(170); ok(r.min === 53.5 && r.max === 66.2, '170cm 정상 체중 53.5~66.2', JSON.stringify(r)); }
ok(B.standardWeight(170, 'm') === 63.6 && B.standardWeight(170, 'f') === 60.7, '표준체중 남 63.6 · 여 60.7', [B.standardWeight(170, 'm'), B.standardWeight(170, 'f')]);
ok(B.broca(170) === 63, '브로카 63');
ok(B.toNormal(170, 75).dir === 'lose' && B.toNormal(170, 75).kg === 8.8, '75kg → 8.8kg 감량', JSON.stringify(B.toNormal(170, 75)));
ok(B.toNormal(170, 50).dir === 'gain' && B.toNormal(170, 50).kg === 3.5, '50kg → 3.5kg 증량');
ok(B.toNormal(176, 71).dir === 'ok' && B.toNormal(152, 53).dir === 'ok', 'BMI 22.9로 반올림되는 경계는 정상');
ok(D.iso(D.addMonths(D.utc(2025, 1, 31), 1)) === '2025-02-28' && D.iso(D.addMonths(D.utc(2024, 2, 29), 12)) === '2025-02-28', '달 더하기 말일 처리');
ok(B.weeksFor(8.8) === 19.4, '8.8kg ÷ 500kcal/일 = 19.4주', B.weeksFor(8.8));

/* 기초대사량 */
ok(B.bmr('m', 170, 65, 30) === 1568 && B.bmr('f', 160, 55, 30) === 1239, 'Mifflin 남 1,568 · 여 1,239', [B.bmr('m', 170, 65, 30), B.bmr('f', 160, 55, 30)]);
ok(B.tdee(1568, 'light') === 2156 && B.tdee(1568, 'sedentary') === 1882, '활동대사량', [B.tdee(1568, 'light'), B.tdee(1568, 'sedentary')]);
ok(near(B.bodyFatNavy('m', 175, 85, 38), 17, 1.5), '체지방 남 175/허리85/목38 ≈ 17%', B.bodyFatNavy('m', 175, 85, 38));
ok(near(B.bodyFatNavy('f', 162, 72, 32, 95), 26.5, 1.5), '체지방 여 ≈ 26%', B.bodyFatNavy('f', 162, 72, 32, 95));
ok(B.water(65).ml === 2150, '물 65kg → 2,150ml', B.water(65).ml);

/* 칼로리 */
ok(K.burn(3.0, 60, 30) === 95, '걷기 60kg 30분 = 95kcal', K.burn(3.0, 60, 30));
ok(K.burn(8.3, 70, 60) === 610, '달리기 70kg 1시간 = 610kcal', K.burn(8.3, 70, 60));
ok(K.minutesFor(300, 3.0, 60) === 95, '밥 한 공기 300kcal 걷기 95분');
ok(FOODS.length >= 120 && new Set(FOODS.map((f) => f.slug)).size === FOODS.length, '음식 슬러그 중복 없음 · ' + FOODS.length + '종');
ok(EXERCISES.length >= 30 && new Set(EXERCISES.map((e) => e.slug)).size === EXERCISES.length, '운동 슬러그 중복 없음');

/* 날짜 */
{
  const p = D.pregnancy(D.utc(2026, 3, 5));
  ok(D.iso(p.due) === '2026-12-10', '출산예정일 3/5 → 12/10', D.iso(p.due));
  const w = D.weeksOn(D.utc(2026, 3, 5), D.utc(2026, 9, 8));
  ok(w.weeks === 26 && w.rem === 5 && w.trimester === 2, '9/8은 26주 5일', JSON.stringify(w));
  const c = D.cycle(D.utc(2026, 9, 1), 28);
  ok(D.iso(c.next) === '2026-09-29' && D.iso(c.ovulation) === '2026-09-15' && D.iso(c.fertileStart) === '2026-09-10' && D.iso(c.fertileEnd) === '2026-09-16', '주기 28 배란 9/15 · 가임 9/10~16');
  const a = D.ageOn(D.utc(2025, 1, 31), D.utc(2026, 9, 8));
  ok(a.months === 19 && a.days === 8 && a.totalDays === 585, '2025-01-31 → 2026-09-08 = 19개월 8일 (585일)', JSON.stringify(a));
  const a2 = D.ageOn(D.utc(2024, 3, 15), D.utc(2026, 3, 14));
  ok(a2.months === 23 && a2.days === 27, '생일 하루 전 23개월', JSON.stringify(a2));
  const v = D.vaccineDates(D.utc(2026, 1, 15));
  ok(D.iso(v[1].doses[2].date) === '2026-07-15' && D.iso(v[7].doses[0].date) === '2027-01-15', 'B형간염 3차 6개월 · MMR 12개월', [D.iso(v[1].doses[2].date), D.iso(v[7].doses[0].date)]);
  ok(D.schoolYear(D.utc(2020, 5, 1)) === 2027, '2020년생 초등 입학 2027');
}

/* 추가 엔진 */
{ const r = X.steps(10000, 60, 170); ok(r.stride === 0.71 && r.km === 7.1 && r.minutes === 107 && r.kcal === 337, '만보 60kg/170cm → 7.1km·107분·337kcal', JSON.stringify(r)); }
ok(X.steps(10000, 80, 170).kcal > X.steps(10000, 60, 170).kcal, '무거울수록 칼로리 증가');
{ const b = X.bedtimes(7, 0); ok(b[0].time === '21:45' && b[1].time === '23:15' && b[2].time === '00:45' && b[3].time === '02:15', '7시 기상 취침 후보', JSON.stringify(b)); }
{ const w = X.waketimes(23, 0); ok(w[1].time === '06:45' && w[0].time === '08:15', '23시 취침 기상 후보', JSON.stringify(w)); }
ok(X.bedtimes(0, 30)[1].time === '16:45', '자정 넘는 시각 처리', X.bedtimes(0, 30)[1].time);
{ const c = X.childHeight(175, 162); ok(c.boy === 175 && c.girl === 162 && c.range === 8.5, '중간 부모 키 175/162', JSON.stringify(c)); }
ok(X.childHeight(180, 165).boy === 179 && X.childHeight(180, 165).girl === 166, '중간 부모 키 180/165 → 179·166');
{ const g = X.alcoholGrams(360, 0.165); ok(near(g, 46.9, 0.2), '소주 1병 알코올 ≈ 47g', g); const r = X.bac(g, 70, 'm'); ok(r.peak === 0.089 && r.driveHours === 5.4 && r.soberHours === 7.4, '70kg 남 소주 1병 0.089% · 5.4h · 7.4h (흡수 1.5h 포함)', JSON.stringify(r)); const f = X.bac(g, 55, 'f'); ok(f.peak > r.peak, '여성이 같은 양에 농도 높음', f.peak); ok(X.bac(g, 70, 'm', 8).now === 0 && X.bac(g, 70, 'm', 1).now === 0.089 && X.bac(g, 70, 'm', 2.5).now === 0.074, '분해는 흡수 1.5h 뒤부터');
ok(X.bacLevel(0.45).startsWith('생명이 위험') && X.bac(X.alcoholGrams(50, 0.165), 90, 'm').driveHours === 0, '만취 표시 · 한 잔은 기준 미만'); }
ok(X.bacLevel(0.02).startsWith('단속 기준 미만') && X.bacLevel(0.05).startsWith('면허 정지') && X.bacLevel(0.1).startsWith('면허 취소'), '농도 판정');
{ const p = X.dietPlan(75, 66, 500); ok(p.diff === 9 && p.weeks === 19.8 && p.days === 139 && p.perWeek === 0.45, '9kg 감량 500kcal → 19.8주·139일', JSON.stringify(p)); }
ok(X.dietPlan(5, 0, 1000).days === 39 && X.dietPlan(5, 0, 300).days === 129, '5kg 1000/300kcal 39·129일');
ok(X.KCAL_NEED.length === 11 && X.KCAL_NEED[6][1] === 2600 && X.KCAL_NEED[6][2] === 2000, '권장 칼로리 19~29세 2,600/2,000');
/* 데이터 */
ok(WEEKS.length === 42 && WEEKS.every((w, i) => w.w === i + 1 && w.baby && w.mom), '임신 주차 42주 연속');
ok(BM.length >= 20 && BM.every((m, i) => i === 0 || m.m > BM[i - 1].m) && BM[0].m === 0 && BM[BM.length - 1].m === 36, '아기 개월 0~36 오름차순');
ok(BM.every((m, i) => i === 0 || (parseFloat(m.h) > parseFloat(BM[i - 1].h) && parseFloat(m.w) > parseFloat(BM[i - 1].w))), '개월별 평균 키·몸무게 단조 증가');
ok(new Set(GUIDES.map((g) => g.slug)).size === GUIDES.length && GUIDES.every((g) => g.body.length > 600 && g.desc.length > 30), '서재 슬러그 고유·본문 길이');
ok(new Set(FOODS.map((f) => f.slug)).size === FOODS.length && FOODS.length >= 250, '음식 슬러그 고유 · 250개 이상', FOODS.length);
ok(GUIDES.every((g) => !/href="\/(?!bmi|bmr|bodyfat|food|exercise|water|due-date|ovulation|baby|pregnancy|guide|steps|sleep|child-height|alcohol|diet|kcal-need|method)/.test(g.body)), '서재 내부 링크 경로');

/* 캘린더 내보내기 */
{ const b = D.utc(2025, 6, 15), ics = I.babyIcs(b, { now: D.utc(2026, 9, 8) }), ev = I.babyEvents(b);
  ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'), 'ics 시작·끝');
  ok((ics.match(/BEGIN:VEVENT/g) || []).length === ev.length && ev.length === 13 + D.CHECKUPS.length + 4 + 3, `ics 항목 수 = 접종일 13 + 검진 ${D.CHECKUPS.length} + 이유식 4 + 기념일 3`, ev.length);
  ok(ics.split('\r\n').every((l) => unescape(encodeURIComponent(l)).length <= 75), 'ics 줄 길이 75옥텟 이하');
  ok(ics.includes('DTSTART;VALUE=DATE:20250815') && ics.includes('DTSTART;VALUE=DATE:20260615') && ics.includes('TRIGGER:-PT15H'), '2개월 접종 8/15 · 첫돌 · 알림');
  ok(ev.every((e, i) => i === 0 || e.date >= ev[i - 1].date), 'ics 날짜순');
  ok(D.CHECKUPS.length === 8 && D.iso(D.checkupDates(b)[0].date) === '2025-06-29' && D.iso(D.checkupDates(b)[1].date) === '2025-10-15', '영유아 건강검진 1차 14일 · 2차 4개월');
  const g = I.gcalUrl('💉 DTaP 2개월', D.utc(2025, 8, 15), '설명', 'https://momja.com/baby/2025-06-15/');
  ok(g.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE&text=') && g.includes('dates=20250815/20250816') && g.includes('ctz=Asia%2FSeoul') === false && g.includes('ctz=Asia/Seoul'), '구글 캘린더 링크', g);
}

/* 성장 백분위 */
ok(G.round('weight', G.valueAt('weight', 'm', 12, 0)) === 9.65 && G.round('length', G.valueAt('length', 'f', 24, 0)) === 85.7 && G.round('head', G.valueAt('head', 'm', 0, 0)) === 34.5, 'WHO 중간값 남 12개월 9.65kg · 여 24개월 85.7cm · 남 0개월 머리 34.5cm', [G.valueAt('weight', 'm', 12, 0), G.valueAt('length', 'f', 24, 0)]);
{ const r = G.growthCheck('weight', 'm', 12, 9.65); ok(Math.abs(r.pct - 50) < 0.6 && r.band.key === 'mid', '중간값은 50백분위', JSON.stringify(r)); }
ok(G.growthCheck('weight', 'm', 12, 7.7).pct < 4 && G.growthCheck('weight', 'm', 12, 7.7).band.key !== 'mid' && G.growthCheck('weight', 'm', 12, 12.0).pct > 96, '남 12개월 7.7kg ≈ 3백분위 · 12.0kg ≈ 97백분위', [G.growthCheck('weight', 'm', 12, 7.7).pct, G.growthCheck('weight', 'm', 12, 12.0).pct]);
ok(Math.abs(G.cdf(1.2816) - 0.9) < 0.001 && Math.abs(G.cdf(-1.8808) - 0.03) < 0.001, '정규분포 누적');
ok(G.percentileRow('length', 'm', 6).length === 9 && G.percentileRow('length', 'm', 6)[4][0] === 50, '백분위표 9칸');
/* 반려동물 */
ok(P.dogAge(1) === 15 && P.dogAge(2) === 24 && P.dogAge(5, 'small') === 36 && P.dogAge(5, 'large') === 42 && P.catAge(5) === 36 && P.catAge(0.5) === 8, '나이 환산', [P.dogAge(5, 'small'), P.dogAge(5, 'large'), P.catAge(5)]);
{ const f = P.petFood('dog', 5, 'neutered'); ok(f.rer === 234 && f.der === 374 && f.grams === 101, '5kg 중성화 성견 RER 234 · DER 374 · 101g', JSON.stringify(f)); }
ok(P.petFood('cat', 4, 'neutered').grams === 64, '4kg 중성화 고양이 64g', P.petFood('cat', 4, 'neutered').grams);
{ const v = P.petVaccineDates('dog', D.utc(2026, 6, 1)); ok(v.length === 7 && D.iso(v[0].doses[0].date) === '2026-07-13' && v[6].doses.length === 3, '강아지 접종 6주 = 7/13 · 연간 3회', JSON.stringify(v[0])); }
/* 캘린더 추가분 */
{ const pe = I.pregnancyEvents(D.utc(2026, 4, 21)); ok(pe.length === 13 && D.iso(pe[pe.length - 1].date) === '2027-01-26' && pe[pe.length - 1].summary.includes('출산예정일'), '임신 일정 13개 · 예정일 1/26', pe.length); }
{ const ce = I.cycleEvents(D.utc(2026, 9, 1), 28, 6); ok(ce.length === 18 && ce.filter((e) => e.summary.includes('생리')).length === 6 && D.iso(ce.find((e) => e.summary.includes('생리')).date) === '2026-09-29', '생리주기 18개 · 다음 생리 9/29'); ok(I.cycleIcs(D.utc(2026, 9, 1), 30).includes('DTSTART;VALUE=DATE:20261001'), '30일 주기 다음 생리 10/1'); }
{ const pv = I.petEvents('dog', D.utc(2026, 6, 1)); ok(pv.length === 7 + 3 + 3 && pv.some((e) => e.rrule) && I.petIcs('dog', D.utc(2026, 6, 1)).includes('RRULE:FREQ=MONTHLY;COUNT=36'), '강아지 캘린더 13개 · 매달 반복', pv.length); }
ok(I.babyEvents(D.utc(2025, 6, 15)).filter((e) => e.kind === 'food').length === 4, '이유식 4단계 일정');
/* 카페인 · 금연 */
ok(X.caffeineLeft(300, 5) === 150 && X.caffeineLeft(300, 10) === 75 && X.caffeineLimit('teen', 50) === 125 && X.caffeineLimit('300') === 300, '카페인 반감기·기준');
{ const qs = X.quitStats(30, 20, 4500); ok(qs.cigs === 600 && qs.money === 135000 && qs.lifeText === '8일 8시간' && X.quitStage(30).label === '1~9개월' && X.quitStage(2.5).label === '48시간', '금연 30일 600개비·135,000원·8일 8시간', JSON.stringify(qs)); }

console.log(`test: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
