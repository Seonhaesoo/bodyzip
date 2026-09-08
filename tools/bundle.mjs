/* 브라우저용 엔진 묶음 — engine/*.mjs 를 그대로 읽어 import/export만 걷어낸다. tools/test.mjs 가 서버 결과와 비교한다. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f.includes('/') ? f : path.join('engine', f)), 'utf8');
const strip = (src) => src.split('\n').filter((l) => !/^import /.test(l)).join('\n').replace(/^export (function|const|let)/gm, '$1').replace(/^export \{[^}]*\};?\s*$/gm, '');
const wrap = (name, src, names) => `const ${name} = (() => {\n${src}\nreturn { ${names.join(', ')} };\n})();`;

export function makeBundle() {
  const parts = [
    wrap('F', strip(read('fmt.mjs')), ['num', 'won', 'pct']),
    wrap('B', strip(read('body.mjs')), ['BMI_CATS', 'bmi', 'bmiCat', 'bmiOf', 'normalRange', 'standardWeight', 'broca', 'toNormal', 'weeksFor', 'bmr', 'bmrHB', 'ACTIVITY', 'tdee', 'bodyFatNavy', 'bodyFatCat', 'water', 'protein']),
    wrap('K', strip(read('kcal.mjs')), ['burn', 'minutesFor', 'bowls', 'RICE_BOWL']),
    wrap('D', strip(read('dates.mjs')), ['utc', 'addDays', 'diffDays', 'iso', 'fmt', 'fmtShort', 'wd', 'pregnancy', 'weeksOn', 'MILESTONES', 'cycle', 'ageOn', 'addMonths', 'VACCINES', 'CHECKUPS', 'checkupDates', 'vaccineDates', 'growthText', 'schoolYear']),
    wrap('P', 'const { addDays, addMonths } = D;\n' + strip(read('pet.mjs')), ['DOG_SIZES', 'dogAge', 'dogAgeLog', 'catAge', 'petStage', 'RER', 'DOG_FACTORS', 'CAT_FACTORS', 'KCAL_PER_100G', 'petFood', 'DOG_VACCINES', 'CAT_VACCINES', 'petVaccineDates', 'heartwormStart', 'neuterAdvice']),
    wrap('I', 'const { VACCINES, CHECKUPS, MILESTONES, addDays, addMonths, iso, cycle } = D; const { DOG_VACCINES, CAT_VACCINES } = P;\n' + strip(read('ics.mjs')), ['monthLabel', 'FOOD_STAGES', 'babyEvents', 'babyIcs', 'gcalUrl', 'pregnancyEvents', 'pregnancyIcs', 'cycleEvents', 'cycleIcs', 'petEvents', 'petIcs']),
    wrap('G', strip(read('data/who-lms.mjs')) + '\n' + strip(read('growth.mjs')), ['MEASURES', 'PCTS', 'MAX_MONTH', 'lms', 'zscore', 'valueAt', 'cdf', 'band', 'growthCheck', 'round', 'percentileRow', 'monthsFromDays']),
    wrap('X', 'const { burn } = K; const { weeksFor } = B;\n' + strip(read('extra.mjs')), ['STRIDE', 'steps', 'bedtimes', 'waketimes', 'childHeight', 'DRINKS', 'alcoholGrams', 'bac', 'bacLevel', 'dietPlan', 'KCAL_NEED', 'CAFFEINE', 'caffeineLeft', 'caffeineLimit', 'QUIT_STAGES', 'quitStage', 'quitStats', 'MIN_PER_CIG']),
    `window.Momja = Object.assign({}, F, B, K, D, X, P, I, G);`,
  ];
  return `/* 몸자 계산 엔진 — 브라우저용, 빌드 때 engine/*.mjs 에서 생성 */\n(function(){\n${parts.join('\n')}\n})();\n`;
}
