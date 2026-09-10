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
import * as CK from '../engine/checkup.mjs';
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
ok(GUIDES.every((g) => !/href="\/(?!bmi|bmr|bodyfat|food|exercise|water|due-date|ovulation|baby|pregnancy|guide|steps|sleep|child-height|alcohol|diet|kcal-need|method|pet|checkup|bp|glucose|cholesterol|ldl|hdl|triglyceride|liver|uric|today|weight|caffeine|quit-smoking|embed)/.test(g.body)), '서재 내부 링크 경로');

/* 캘린더 내보내기 */
{ const b = D.utc(2025, 6, 15), ics = I.babyIcs(b, { now: D.utc(2026, 9, 8) }), ev = I.babyEvents(b);
  ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'), 'ics 시작·끝');
  ok((ics.match(/BEGIN:VEVENT/g) || []).length === ev.length && ev.length === 13 + D.CHECKUPS.length + 4 + 3, `ics 항목 수 = 접종일 13 + 검진 ${D.CHECKUPS.length} + 이유식 4 + 기념일 3`, ev.length);
  ok(ics.split('\r\n').every((l) => unescape(encodeURIComponent(l)).length <= 75), 'ics 줄 길이 75옥텟 이하');
  ok(ics.includes('DTSTART;VALUE=DATE:20250815') && ics.includes('DTSTART;VALUE=DATE:20260615') && ics.includes('TRIGGER:-PT15H'), '2개월 접종 8/15 · 첫돌 · 알림');
  ok(ev.every((e, i) => i === 0 || e.date >= ev[i - 1].date), 'ics 날짜순');
  ok(D.CHECKUPS.length === 8 && D.iso(D.checkupDates(b)[0].date) === '2025-06-29' && D.iso(D.checkupDates(b)[1].date) === '2025-10-15', '영유아 건강검진 1차 14일 · 2차 4개월');
  const g = I.gcalUrl('💉 DTaP 2개월', D.utc(2025, 8, 15), '설명', 'https://bodyzip.com/baby/2025-06-15/');
  ok(g.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE&text=') && g.includes('dates=20250815/20250816') && g.includes('ctz=Asia%2FSeoul') === false && g.includes('ctz=Asia/Seoul'), '구글 캘린더 링크', g);
}

/* 성장 백분위 */
ok(G.round('weight', G.valueAt('weight', 'm', 12, 0)) === 9.65 && G.round('length', G.valueAt('length', 'f', 24, 0)) === 85.7 && G.round('head', G.valueAt('head', 'm', 0, 0)) === 34.5, 'WHO 중간값 남 12개월 9.65kg · 여 24개월 85.7cm · 남 0개월 머리 34.5cm', [G.valueAt('weight', 'm', 12, 0), G.valueAt('length', 'f', 24, 0)]);
{ const r = G.growthCheck('weight', 'm', 12, 9.65); ok(Math.abs(r.pct - 50) < 0.6 && r.band.key === 'mid', '중간값은 50백분위', JSON.stringify(r)); }
ok(G.growthCheck('weight', 'm', 12, 7.7).pct < 4 && G.growthCheck('weight', 'm', 12, 7.7).band.key !== 'mid' && G.growthCheck('weight', 'm', 12, 12.0).pct > 96, '남 12개월 7.7kg ≈ 3백분위 · 12.0kg ≈ 97백분위', [G.growthCheck('weight', 'm', 12, 7.7).pct, G.growthCheck('weight', 'm', 12, 12.0).pct]);
ok(Math.abs(G.cdf(1.2816) - 0.9) < 0.001 && Math.abs(G.cdf(-1.8808) - 0.03) < 0.001, '정규분포 누적');
ok(G.percentileRow('length', 'm', 6).length === 9 && G.percentileRow('length', 'm', 6)[4][0] === 50, '백분위표 9칸');
/* 혈압 기록 (가정혈압 135/85) */
{ const BL = await import('../engine/bplog.mjs');
  const day = 86400000, now = Date.UTC(2026, 8, 10, 3), list = [];
  for (let i = 0; i < 6; i++) { list.push({ t: now - i * day - 3 * 3600e3, s: 138, d: 86, p: 72, slot: 'am' }); list.push({ t: now - i * day - 3600e3, s: 126, d: 80, p: 0, slot: 'pm' }); }
  list.push({ t: now - 10 * day, s: 170, d: 100, p: 0, slot: 'am' });
  const a = BL.homeAvg(list, now);
  ok(a.n === 12 && a.s === 132 && a.d === 83 && a.p === 72 && a.days === 6 && a.enough && a.over === false, '7일 평균 132/83 · 12회 · 6일 · 10일 전 값 제외', JSON.stringify(a));
  ok(a.am.s === 138 && a.am.d === 86 && a.pm.s === 126 && a.pm.n === 6, '아침·저녁 평균 따로');
  ok(BL.homeAvg(list.map((r) => ({ ...r, d: r.d + 3 })), now).over === true, '이완기 평균 86이면 가정혈압 기준 이상');
  ok(BL.readingTag(182, 100).key === 'crisis' && BL.readingTag(120, 121).key === 'crisis' && BL.readingTag(136, 80).key === 'high' && BL.readingTag(88, 58).key === 'low' && BL.readingTag(122, 78).key === 'ok', '한 번 잰 값 표시 180/120 · 135/85 · 90/60');
  ok(BL.slotOf(6) === 'am' && BL.slotOf(11) === 'am' && BL.slotOf(14) === 'etc' && BL.slotOf(22) === 'pm' && BL.slotOf(2) === 'pm', '시간대 나누기');
  ok(BL.bpValid(120, 80) && !BL.bpValid(80, 90) && !BL.bpValid(300, 80), '입력 범위');
}
/* 임신 중 체중 증가 (IOM 2009) */
{ const PW = await import('../engine/pregweight.mjs');
  ok(PW.pwCat(18.4).key === 'under' && PW.pwCat(18.5).key === 'normal' && PW.pwCat(24.9).key === 'normal' && PW.pwCat(25).key === 'over' && PW.pwCat(29.9).key === 'over' && PW.pwCat(30).key === 'obese', 'BMI 구간 WHO 18.5·25·30');
  ok(PW.gainRange('normal', 13).join() === '0.5,2' && PW.gainRange('normal', 40).join() === '11.5,16' && PW.gainRange('under', 40).join() === '12.5,18' && PW.gainRange('over', 40).join() === '7,11.5' && PW.gainRange('obese', 40).join() === '5,9', '13주 = 1분기 0.5~2kg · 40주 = IOM 총량');
  { const g = PW.gainRange('normal', 20); ok(g.join() === '3.4,5.6', '정상 20주 3.4~5.6kg', g); }
  { const dev = PW.PW_CATS.map((c) => [Math.abs((c.total[0] - 0.5) / 27 - c.weekly[0]), Math.abs((c.total[1] - 2) / 27 - c.weekly[1])]); ok(dev.every(([a, b]) => a <= 0.06 && b <= 0.03) && dev.filter(([a]) => a > 0.03).length === 1, '주차별 기울기는 IOM 주당 권고와 0.03kg 안, 정상 하한만 0.06kg 안 (계산 기준 문구와 같은 사실)', JSON.stringify(dev)); }
  { const r = PW.pregWeight(160, 55, 62, 24, false); ok(r.bmi === 21.5 && r.cat.key === 'normal' && r.target.join() === '66.5,71' && r.range.join() === '5,7.7' && r.status === 'within', '160cm 55kg 24주 62kg → 정상 · 범위 안', JSON.stringify(r)); }
  ok(PW.pregWeight(160, 55, 70, 24, false).status === 'above' && PW.pregWeight(160, 55, 56, 24, false).status === 'below', '범위 밖 판정');
  ok(PW.pregWeight(160, 55, 0, 0, true).total.join() === '17,25' && PW.pregWeight(160, 45, 0, 0, true).total === null, '쌍둥이 정상 17~25 · 저체중은 권고치 없음');
}
/* 분유 수유량 (미국소아과학회 1kg당 165ml · 하루 960ml) */
{ const FM = await import('../engine/formula.mjs');
  ok(FM.dailyFor(4) === 660 && FM.dailyFor(3.3) === 540 && FM.dailyFor(6) === 960 && FM.dailyFor(9) === 960, '하루 총량 4kg 660 · 3.3kg 540 · 6kg 이상 960 상한', [FM.dailyFor(4), FM.dailyFor(3.3), FM.dailyFor(6)]);
  ok(Math.abs(75 / 0.453 - FM.ML_PER_KG) < 1, '1파운드당 75ml ≈ 1kg당 165ml');
  ok(FM.formulaPlan(3, 3.3).stage === 'week1' && FM.formulaPlan(3, 3.3).per[1] === 60, '생후 1주 안은 1회 30~60ml');
  { const p = FM.formulaPlan(76, 5.6); ok(p.stage === 'weight' && p.feeds === 6 && p.daily === 920 && p.per === 150, '2개월 반 5.6kg → 하루 920ml · 6회 · 1회 150ml', JSON.stringify(p)); }
  { const p = FM.formulaPlan(76, 5.6, 5); ok(p.feeds === 5 && p.per === 180, '횟수를 5회로 바꾸면 1회 180ml', p.per); }
  { const p = FM.formulaPlan(140, 7.5); ok(p.capped && p.daily === 960 && p.per === 190, '4개월 7.5kg은 960ml 상한 · 5회 · 1회 190ml', JSON.stringify(p)); }
  { const p = FM.formulaPlan(200, 8); ok(p.stage === 'solids' && p.feeds.join() === '3,4' && p.daily.join() === '540,960', '6개월 이후 이유식 2회 + 분유 3~4회', JSON.stringify(p)); }
  ok(FM.formulaPlan(380, 10).stage === 'milk', '돌 이후는 생우유');
  { const k1 = (x) => Math.round(x * 10) / 10, typ = (mo) => k1((G.valueAt('weight', 'm', mo, 0) + G.valueAt('weight', 'f', mo, 0)) / 2);
    const bad = [0, 1, 2, 3, 4, 5].filter((m) => { const f = BM.find((x) => x.m === m).feed; return !f.includes(`약 ${FM.r10(FM.dailyFor(typ(m + 0.5)) / FM.FEEDS[m])}ml`) || !f.includes(FM.FEEDS_TEXT[m]); })
      .concat([6, 7, 8, 9, 10, 11].filter((m) => { const [a, b] = FM.SOLIDS[m].feeds; return !BM.find((x) => x.m === m).feed.includes(`분유 ${a === b ? a : `${a}~${b}`}회`); }));
    ok(!bad.length, '개월별 발달 페이지 분유량 = 분유 계산기 (0~11개월)', bad); }
  ok(FM.FEEDS_RANGE.every(([a, b], i) => a <= FM.FEEDS[i] && FM.FEEDS[i] <= b) && Object.values(FM.SOLIDS).every((s) => s.solids.endsWith('회')), '기준 횟수는 범위 안 · 이유식 라벨은 회로 끝남');
}
/* 아이 키 백분위 (2017 소아청소년 성장도표, 만 3~18세) */
{ const KD = await import('../engine/kids.mjs');
  ok(KD.kidsRound(KD.kidsValue('height', 'm', 120, 0)) === 138.8 && KD.kidsRound(KD.kidsValue('height', 'f', 216, 0)) === 160.6 && KD.kidsRound(KD.kidsValue('weight', 'm', 216, 0)) === 66.7, '성장도표 중간값 남 10세 138.8cm · 여 18세 160.6cm · 남 18세 66.7kg', [KD.kidsValue('height', 'm', 120, 0), KD.kidsValue('height', 'f', 216, 0)]);
  { const r = KD.kidsCheck('height', 'm', 120, 138.8); ok(Math.abs(r.pct - 50) < 0.6 && r.band.key === 'mid', '아이 중간값은 50백분위', JSON.stringify(r)); }
  { const a = KD.kidsCheck('height', 'm', 120, 128.4).pct, b = KD.kidsCheck('height', 'm', 120, 150.2).pct; ok(a > 2.5 && a < 3.5 && b > 96.5 && b < 97.5, '남 10세 3·97백분위 = 표 값 128.4·150.2cm', [a, b]); }
  ok(KD.kidsCheck('bmi', 'f', 204, 25.2).band.key === 'obese' && KD.kidsCheck('bmi', 'm', 144, 22).band.key === 'mid', 'BMI 25 이상은 백분위와 무관하게 비만 · 남 12세 22는 정상');
  ok(KD.kidsBand('bmi', 86, 20).key === 'over' && KD.kidsBand('bmi', 4, 14).key === 'under' && KD.kidsBand('height', 2.9).key === 'low2', '판정 구간 85 · 5 · 3');
  ok(KD.trackAdult('m', 120, 138.8) === KD.kidsRound(KD.kidsValue('height', 'm', 216, 0)), '50백분위를 따라가면 18세 중간값', KD.trackAdult('m', 120, 138.8));
  ok(KD.gradeMonths(1) === 86 && KD.gradeMonths(12) === 218 && KD.gradesForAge(10).join() === '4,5' && KD.gradeFor(110) === 3, '학년 나이 초1 86개월 · 만 10세 = 초4~초5', KD.gradesForAge(10));
  ok(KD.kidsRank(57.9) === '상위 42%' && KD.kidsRank(8.2) === '하위 8%' && KD.kidsRank(99.95) === '상위 0.1%', '상위·하위 표기', [KD.kidsRank(57.9), KD.kidsRank(8.2), KD.kidsRank(99.95)]);
  { const [lo, hi] = KD.kidsHeightRange('m', 10); ok(lo === 125 && hi > 150 && hi < 165, '남 10세 키 페이지 범위', [lo, hi]); }
  ok(KD.kidsLms('height', 'm', 30)[1] === KD.kidsLms('height', 'm', 36)[1] && KD.kidsLms('height', 'f', 300)[1] === KD.kidsLms('height', 'f', 227)[1], '범위 밖은 끝값');
}
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
{ const qs = X.quitStats(30, 20, 4500); ok(qs.cigs === 600 && qs.money === 135000 && qs.lifeText === '8일 8시간' && X.quitStage(30).label === '1~9개월' && X.quitStage(2.5).label === '48시간' && X.quitStage(7).label === '1주', '금연 30일 600개비·135,000원·8일 8시간', JSON.stringify(qs)); }

/* 건강검진 수치 */
ok(CK.bloodPressure(119, 79).key === 'normal' && CK.bloodPressure(125, 78).key === 'attention' && CK.bloodPressure(130, 80).key === 'pre' && CK.bloodPressure(140, 90).key === 'stage1' && CK.bloodPressure(160, 100).key === 'stage2' && CK.bloodPressure(180, 120).key === 'crisis', '혈압 구간 (대한고혈압학회 2022)');
ok(CK.bloodPressure(135, 75).key === 'pre' && CK.bloodPressure(118, 85).key === 'pre', '수축기·이완기 중 높은 쪽으로 판정');
ok(CK.bloodPressure(145, 85).isolated === true && CK.bloodPressure(145, 95).isolated === false, '수축기 단독 고혈압');
ok(CK.glucose(99).key === 'normal' && CK.glucose(100).key === 'pre' && CK.glucose(125).key === 'pre' && CK.glucose(126).key === 'dm' && CK.glucose(65).key === 'low', '공복혈당 구간');
ok(CK.hba1c(5.6).key === 'normal' && CK.hba1c(5.7).key === 'pre' && CK.hba1c(6.5).key === 'dm', '당화혈색소 구간');
ok(CK.totalChol(199).key === 'ok' && CK.totalChol(200).key === 'border' && CK.totalChol(240).key === 'high', '총콜레스테롤');
ok(CK.ldl(99).key === 'ok' && CK.ldl(130).key === 'border' && CK.ldl(160).key === 'high' && CK.ldl(190).key === 'veryhigh', 'LDL 구간');
ok(CK.hdl(39).key === 'low' && CK.hdl(45).key === 'ok' && CK.hdl(60).key === 'good', 'HDL 구간');
ok(CK.triglyceride(149).key === 'ok' && CK.triglyceride(150).key === 'border' && CK.triglyceride(200).key === 'high' && CK.triglyceride(500).key === 'veryhigh', '중성지방 구간');
ok(CK.ldlEstimate(200, 50, 100) === 130 && CK.ldlEstimate(200, 50, 400) === null, 'Friedewald LDL 추정');
{ const l = CK.liver(60, 30); ok(l.key === 'mild' && l.ratio === 2 && l.alcoholHint === true, 'AST/ALT 2배 → 음주 의심', JSON.stringify(l)); }
ok(CK.liver(30, 30).key === 'ok' && CK.liver(150, 120).key === 'moderate' && CK.liver(300, 250).key === 'severe', '간수치 구간');
ok(CK.uric(7.0, 'm').key === 'ok' && CK.uric(7.5, 'm').key === 'high' && CK.uric(6.5, 'f').key === 'high' && CK.uric(9.5, 'm').key === 'veryhigh', '요산 남녀 기준');
ok(CK.ggt(50, 'm').key === 'ok' && CK.ggt(50, 'f').key === 'mild', '감마지티피 남녀 기준');
{ const s1 = CK.summary({ sys: 118, dia: 76, glucose: 92, ldl: 95 }); ok(s1.worst === 0 && s1.rows.length === 3 && s1.text.includes('정상'), '종합 — 모두 정상', JSON.stringify(s1.text));
  const s2 = CK.summary({ sys: 165, dia: 105, glucose: 130 }); ok(s2.worst === 3 && s2.text.includes('진료'), '종합 — 진료 필요'); }

console.log(`test: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
