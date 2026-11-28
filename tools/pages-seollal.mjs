/* 설 음식 칼로리 — /food/seollal/ (2026-11-28) : 추석 페이지(/food/chuseok/)와 같은 접시 틀(plate.js)에 설 음식만 바꿔 담는다.
 * 음식 값은 data/foods*.mjs 그대로 — 음식 페이지·추석 페이지와 숫자가 같다. 설날 날짜는 우주항공청 2027년 월력요항 보도(2027-02-07 일, 연휴 2/6~2/9 대체공휴일 포함) */
import * as K from '../engine/kcal.mjs';
import * as D from '../engine/dates.mjs';
import { num } from '../engine/fmt.mjs';
import { foodBySlug } from '../data/foods.mjs';
import { EXERCISES } from '../data/exercises.mjs';

export const SEOLLAL_DATES = { 2027: { m: 2, d: 7, holiday: '2월 6일(토)~9일(화), 9일은 대체공휴일' } };
const WALK = EXERCISES.find((e) => e.slug === 'walking').met;
const WD = '일월화수목금토';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const PLATE = [
  ['떡국·만두', [{ s: 'tteokguk' }, { s: 'mandu' }]],
  ['전', [{ s: 'jeon-assorted' }, { s: 'donggeurangttaeng' }, { s: 'dongtae-jeon' }, { s: 'hobak-jeon' }, { s: 'sanjeok' }, { s: 'bindaetteok' }, { s: 'kimchijeon' }]],
  ['고기·생선', [{ s: 'galbijjim' }, { s: 'galbi' }, { s: 'tteokgalbi' }, { s: 'bulgogi' }, { s: 'jogi-gui' }]],
  ['밥·잡채·나물', [{ s: 'rice' }, { s: 'japchae' }, { s: 'gosari-namul' }, { s: 'doraji-namul' }, { s: 'spinach' }, { s: 'bean-sprouts' }]],
  ['한과·떡', [{ s: 'yakgwa' }, { s: 'yugwa' }]],
  ['과일·견과', [{ s: 'tangerine' }, { s: 'pear', g: 100, label: '배 ¼개' }, { s: 'apple', g: 125, label: '사과 ½개' }, { s: 'dried-persimmon' }, { s: 'chestnut' }, { s: 'jujube' }]],
  ['음료·술', [{ s: 'sikhye-cup' }, { s: 'sujeonggwa' }, { s: 'makgeolli' }, { s: 'soju' }, { s: 'beer' }]],
];
export const PRESETS = [
  { label: '설날 아침 떡국 한 상', q: { tteokguk: 1, 'jeon-assorted': 1, galbijjim: 1, japchae: 1, 'gosari-namul': 1, spinach: 1 } },
  { label: '세배 뒤 간식', q: { yakgwa: 1, 'sikhye-cup': 1, tangerine: 2, 'dried-persimmon': 1 } },
  { label: '저녁 술상', q: { 'jeon-assorted': 1, mandu: 1, galbi: 1, soju: 1 } },
];

function item(x) {
  const f = foodBySlug[x.s];
  if (!f) throw new Error('설 접시: 음식 없음 ' + x.s);
  if (x.g) {
    if (!f.per100) throw new Error('설 접시: 100g당 값 없음 ' + x.s);
    return { key: `${x.s}-${x.g}`, slug: x.s, name: x.label, serving: `${x.g}g`, kcal: Math.round(f.per100 * x.g / 100) };
  }
  return { key: x.s, slug: x.s, name: f.name, serving: f.serving, kcal: f.kcal };
}
export const GROUPS = PLATE.map(([g, xs]) => [g, xs.map(item)]);
export const ITEMS = GROUPS.flatMap(([, xs]) => xs);
export const SEOLLAL_SLUGS = new Set(ITEMS.map((it) => it.slug));
const byKey = Object.fromEntries(ITEMS.map((it) => [it.key, it]));
PRESETS.forEach((p) => Object.keys(p.q).forEach((k) => { if (!byKey[k]) throw new Error('설 한 상 예시: 접시에 없는 항목 ' + k); }));
export const presetTotal = (p) => Object.entries(p.q).reduce((a, [k, n]) => a + byKey[k].kcal * n, 0);

export function nextSeollal(today) {
  for (const [yy, c] of Object.entries(SEOLLAL_DATES)) {
    const dt = D.utc(Number(yy), c.m, c.d);
    if (D.addDays(dt, 2) >= today) return { y: Number(yy), m: c.m, d: c.d, wd: WD[dt.getUTCDay()], holiday: c.holiday, left: Math.round((dt - today) / 864e5) };
  }
  return null;
}
const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`);
const walk60 = (kcal) => hm(K.minutesFor(kcal, WALK, 60));

export function buildSeollal(ctx) {
  const { write, shell, crumb, list, section, lead, ad, table, TODAY } = ctx;
  const c = nextSeollal(TODAY);
  const F = (s) => foodBySlug[s];
  const N = ITEMS.length;
  const dday = c ? (c.left > 0 ? ` · D-${c.left}` : c.left === 0 ? ' · 오늘' : '') : '';
  const when = c ? `${c.y}년 설날 ${c.m}월 ${c.d}일(${c.wd})` : '설날';
  const rowHtml = (it) => `<div class="plate-row" data-key="${it.key}" data-slug="${it.slug}" data-name="${esc(it.name)}" data-kcal="${it.kcal}"><span class="pn"><a href="/food/${it.slug}/">${it.name}</a><small>${it.serving} · ${num(it.kcal)}kcal</small></span><span class="pq"><button type="button" data-d="-1" aria-label="${esc(it.name)} 빼기">−</button><b data-q>0</b><button type="button" data-d="1" aria-label="${esc(it.name)} 더하기">+</button></span></div>`;
  const sorted = ITEMS.slice().sort((a, b) => b.kcal - a.kcal);
  const [morning, snack, dinner] = PRESETS.map((p) => ({ ...p, sum: presetTotal(p) }));
  const presetTable = (p) => table(['음식', '양', 'kcal'], Object.entries(p.q).map(([k, n]) => ({ cells: [`<a href="/food/${byKey[k].slug}/">${byKey[k].name}</a>`, n > 1 ? `${byKey[k].serving} × ${n}` : byKey[k].serving, num(byKey[k].kcal * n)] })).concat([{ cls: 'on', cells: ['<b>합계</b>', `밥 ${K.bowls(p.sum)}공기`, `<b>${num(p.sum)}</b>`] }]));
  const days4 = 4, extra = 1000 * days4, fatKg = Math.round(extra / 7700 * 10) / 10;
  const tg = F('tteokguk'), rice = F('rice');

  const body = `
${crumb([['/food/', '음식 칼로리'], [null, '설 음식 칼로리']])}
<h1 class="title">설 음식 칼로리</h1>
<p class="meta">${when}${dday}${c ? ` · 연휴 ${c.holiday}` : ''} · 명절 음식 ${N}가지 · 1인분 기준</p>
<form class="quick live plate" data-live="plate" data-plate="seollal" data-met="${WALK}" data-title="내 설날 한 상" onsubmit="return false">
<div class="live-head"><b>내 설날 접시</b><span>+ 한 번 = 1인분</span></div>
<div class="plate-presets">${PRESETS.map((p) => `<button type="button" data-preset="${esc(JSON.stringify(p.q))}">${p.label}</button>`).join('')}</div>
${GROUPS.map(([g, xs]) => `<div class="plate-grp"><h3>${g}</h3>${xs.map(rowHtml).join('')}</div>`).join('\n')}
<div class="plate-sum">
<div class="tiles"><div class="tile"><small>합계</small><span class="num" data-out="total">0kcal</span></div><div class="tile"><small>밥 공기로</small><span class="num" data-out="bowls">0공기</span></div><div class="tile"><small>걸어서 태우려면</small><span class="num" data-out="walk">—</span></div></div>
<p class="sub" data-out="count" style="margin-top:6px">아직 담은 것이 없습니다</p>
</div>
<label class="ye-f plate-w"><span>내 몸무게 (kg)</span><input data-k="w" type="text" inputmode="decimal" placeholder="60"></label>
<div class="btn-row"><button type="button" class="btn" data-act="today">오늘 먹은 것에 담기</button><button type="button" class="btn btn-share" data-act="copy">결과 복사</button></div>
<p class="sub" data-out="msg" aria-live="polite" style="margin-top:8px"></p>
<p class="cal-how"><button type="button" class="lnk" data-act="reset">접시 비우기</button> · 담은 양은 이 기기에만 저장됩니다.</p>
</form>
${lead(`떡국 한 그릇 <b>${num(tg.kcal)}kcal</b>로 밥 ${K.bowls(tg.kcal)}공기쯤입니다. 여기에 모둠전 한 접시 ${num(F('jeon-assorted').kcal)}kcal, 갈비찜 1인분 ${num(F('galbijjim').kcal)}kcal가 더해지면 설날 아침 한 상이 약 <b>${num(morning.sum)}kcal</b>가 됩니다. 설에 먹는 음식 ${N}가지를 1인분 기준으로 모았고, 접시에 담으면 한 끼 합계와 걸어서 태우는 시간이 바로 나옵니다.`)}
${section('설 음식 칼로리표', '1인분 · 높은 순 · 걷기는 60kg 기준', table(['음식', '양', 'kcal', '걷기'], sorted.map((it) => ({ cells: [`<a href="/food/${it.slug}/">${it.name}</a>`, it.serving, num(it.kcal), walk60(it.kcal)] }))))}
${ad()}
${section('한 상으로 보면', '접시 위 버튼과 같은 예시', `<div class="doc">
<p><b>${morning.label}</b>: 떡국에 전·갈비찜·잡채, 나물 두 가지를 곁들이면 약 <b>${num(morning.sum)}kcal</b>입니다. 60kg인 사람이 걸어서 태우려면 ${walk60(morning.sum)}이 걸립니다.</p>
${presetTable(morning)}
<p style="margin-top:14px"><b>${snack.label}</b>: 약과 하나, 식혜 한 잔, 귤 두 개, 곶감 하나면 약 <b>${num(snack.sum)}kcal</b>입니다.</p>
${presetTable(snack)}
<p style="margin-top:14px"><b>${dinner.label}</b>: 전과 만두, 양념 소갈비에 소주 한 병이면 약 <b>${num(dinner.sum)}kcal</b>입니다.</p>
${presetTable(dinner)}
</div>`)}
${section('연휴 뒤 몸무게', null, `<div class="doc">
<p>지방 1kg은 약 7,700kcal입니다. ${c ? `${c.y}년 설 연휴 ${days4}일` : `연휴 ${days4}일`} 동안 하루 1,000kcal씩 더 먹으면 ${num(extra)}kcal, 지방으로는 <b>약 ${fatKg}kg</b>입니다.</p>
<p>연휴 뒤 1~2kg 늘었다면 상당 부분은 떡·전의 탄수화물과 짠 음식이 붙잡은 수분입니다. 평소 식사로 돌아가고 사나흘 뒤 몸무게로 판단하세요. <a href="/diet/">새해 다이어트 기간 계산</a>에서 목표까지 걸리는 기간을 볼 수 있습니다.</p>
</div>`)}
${section('덜 먹는 요령', null, `<div class="doc">
<p><b>떡국은 떡 양으로 조절.</b> 떡국 칼로리의 대부분은 떡입니다. 한 그릇(${tg.serving})이 ${num(tg.kcal)}kcal로 밥 한 공기(${num(rice.kcal)}kcal)보다 많으니, 떡국을 먹는 끼니엔 밥을 따로 먹지 마세요.</p>
<p><b>전은 개인 접시에 덜어.</b> 모둠전 한 접시(150g)가 ${num(F('jeon-assorted').kcal)}kcal입니다. 부친 뒤 키친타월로 기름을 한 번 빼면 조금 가벼워집니다.</p>
<p><b>식혜·수정과는 디저트로.</b> 식혜 한 잔 ${num(F('sikhye-cup').kcal)}kcal, 수정과 한 잔 ${num(F('sujeonggwa').kcal)}kcal입니다. 목마를 땐 물이나 보리차를 드세요.</p>
<p><b>귤은 두세 개까지.</b> 귤 한 개는 ${num(F('tangerine').kcal)}kcal로 가볍지만 상자째 두고 먹다 보면 열 개가 넘기 쉽습니다. 곶감은 한 개(40g)에 ${num(F('dried-persimmon').kcal)}kcal입니다.</p>
<p><b>식사 뒤 20~30분 걷기.</b> 60kg인 사람이 30분 걸으면 약 ${num(K.burn(WALK, 60, 30))}kcal을 씁니다. 세배 다니는 길도 걷기입니다.</p>
</div>`)}
${section('자주 묻는 것', null, `<div class="doc">
<p><b>떡국 한 그릇 칼로리는?</b> 1인분 기준 약 ${num(tg.kcal)}kcal입니다. 떡 양과 국물(사골·멸치), 고명(달걀·고기)에 따라 400~600kcal로 달라집니다.</p>
<p><b>만둣국은?</b> 만두를 넣으면 만두 개수만큼 늘어납니다. 군만두 6개가 ${num(F('mandu').kcal)}kcal로, 찐만두·만둣국 속 만두는 이보다 조금 가볍습니다.</p>
<p><b>설 음식 중 칼로리가 가장 높은 것은?</b> 1인분 기준으로 ${sorted[0].name} ${sorted[0].serving}, ${num(sorted[0].kcal)}kcal입니다. 한 번에 먹는 양이 많은 떡국·고기·전과 술이 합계를 좌우합니다.</p>
${c ? `<p><b>${c.y}년 설날은 언제?</b> ${c.m}월 ${c.d}일(${c.wd})이고 연휴는 ${c.holiday}입니다.</p>` : ''}
</div>`)}
${section('이어서', null, list([{ href: '/food/chuseok/', title: '추석 음식 칼로리', sub: '송편·전·갈비찜' }, { href: '/today/', title: '오늘 먹은 칼로리 담기', sub: '접시에 담은 것을 하루 합계로' }, { href: '/diet/', title: '다이어트 기간 계산기', sub: '새해 1월 1일에 시작하면' }, { href: '/alcohol/', title: '술 깨는 시간', sub: '연휴 다음 날 아침 운전' }]))}
<p class="note">칼로리는 <a href="https://various.foodsafetykorea.go.kr/nutrient/" rel="nofollow">식품의약품안전처 식품영양성분 데이터베이스</a>의 100g당 값(음식·원재료)을 1인분 양에 맞춰 반올림한 대략값입니다. 집집마다 크기·기름·양념이 달라 ±20% 이상 차이 날 수 있습니다. 걷기 시간은 시속 4km(MET ${WALK}) 기준입니다. 설날 날짜는 우주항공청 2027년 월력요항 기준입니다. <a href="/method/">계산 기준 보기</a></p>`;
  const title = `설 음식 칼로리표 — 떡국·전·갈비찜 한 상 몇 kcal? 접시에 담아 계산${c ? ` (${c.y})` : ''}`;
  const desc = `떡국 한 그릇 ${num(tg.kcal)}kcal, 모둠전 한 접시 ${num(F('jeon-assorted').kcal)}kcal, 갈비찜 1인분 ${num(F('galbijjim').kcal)}kcal. 설에 먹는 음식 ${N}가지를 1인분 기준으로 모았고, 접시에 담으면 한 끼 합계와 밥 공기·걷기 시간이 바로 나옵니다.${c ? ` ${c.y}년 설날은 ${c.m}월 ${c.d}일(${c.wd}).` : ''}`;
  write('/food/seollal/', shell({ url: '/food/seollal/', og: 'food', nav: 'food', modified: '2026-11-28', title, desc, body, scripts: ['/js/plate.js'] }));
}
