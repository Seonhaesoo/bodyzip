/* 엔진 검증 — node tools/test.mjs */
import * as B from '../engine/body.mjs';
import * as K from '../engine/kcal.mjs';
import * as D from '../engine/dates.mjs';
import { FOODS } from '../data/foods.mjs';
import { EXERCISES } from '../data/exercises.mjs';

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

console.log(`test: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
