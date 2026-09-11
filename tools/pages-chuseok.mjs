/* 추석 음식 칼로리 — /food/chuseok/ : 차례상·명절 밥상 음식을 접시에 담아 합계·밥 공기·걷기 시간을 보고,
 * 칼로리표·한 상 예시·명절 체중 계산·덜 먹는 요령을 한 장에. 음식 값은 data/foods*.mjs 그대로 써서 음식 페이지와 숫자가 같다. */
import * as K from '../engine/kcal.mjs';
import * as D from '../engine/dates.mjs';
import { num } from '../engine/fmt.mjs';
import { foodBySlug } from '../data/foods.mjs';
import { EXERCISES } from '../data/exercises.mjs';

/* 음력 8월 15일 — 사주첩 만세력 음력표로 확인 */
export const CHUSEOK_DATES = { 2026: [9, 25], 2027: [9, 15], 2028: [10, 3], 2029: [9, 22], 2030: [9, 12] };
const WALK = EXERCISES.find((e) => e.slug === 'walking').met;
const WD = '일월화수목금토';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* g 를 주면 100g당 kcal 로 그만큼만 센다 — 배 ¼개처럼 1인분보다 적게 먹는 것 */
export const PLATE = [
  ['떡·한과', [{ s: 'songpyeon' }, { s: 'yakgwa' }, { s: 'yugwa' }]],
  ['전', [{ s: 'jeon-assorted' }, { s: 'donggeurangttaeng' }, { s: 'dongtae-jeon' }, { s: 'hobak-jeon' }, { s: 'sanjeok' }, { s: 'bindaetteok' }, { s: 'kimchijeon' }]],
  ['고기·생선', [{ s: 'galbijjim' }, { s: 'galbi' }, { s: 'tteokgalbi' }, { s: 'bulgogi' }, { s: 'jogi-gui' }]],
  ['밥·국·잡채', [{ s: 'rice' }, { s: 'toranguk' }, { s: 'japchae' }]],
  ['나물', [{ s: 'gosari-namul' }, { s: 'doraji-namul' }, { s: 'spinach' }, { s: 'bean-sprouts' }]],
  ['과일·견과', [{ s: 'pear', g: 100, label: '배 ¼개' }, { s: 'apple', g: 125, label: '사과 ½개' }, { s: 'persimmon' }, { s: 'hongsi' }, { s: 'shine-muscat', g: 100, label: '샤인머스캣 10알' }, { s: 'chestnut' }, { s: 'jujube' }, { s: 'dried-persimmon' }]],
  ['음료·술', [{ s: 'sikhye-cup' }, { s: 'sujeonggwa' }, { s: 'makgeolli' }, { s: 'soju' }, { s: 'beer' }]],
];
/* 한 상 예시 — 접시 버튼과 아래 표가 같은 값을 쓴다 (키: 음식 slug, g 가 있는 줄은 slug-g) */
export const PRESETS = [
  { label: '차례 지낸 뒤 아침', q: { rice: 1, toranguk: 1, 'jeon-assorted': 1, galbijjim: 1, 'gosari-namul': 1, 'doraji-namul': 1, spinach: 1, 'jogi-gui': 1 } },
  { label: '오후 간식', q: { songpyeon: 1, 'sikhye-cup': 1, 'pear-100': 1, chestnut: 1 } },
  { label: '저녁 술상', q: { 'jeon-assorted': 1, japchae: 1, galbi: 1, makgeolli: 1 } },
];

function item(x) {
  const f = foodBySlug[x.s];
  if (!f) throw new Error('추석 접시: 음식 없음 ' + x.s);
  if (x.g) {
    if (!f.per100) throw new Error('추석 접시: 100g당 값 없음 ' + x.s);
    return { key: `${x.s}-${x.g}`, slug: x.s, name: x.label, serving: `${x.g}g`, kcal: Math.round(f.per100 * x.g / 100) };
  }
  return { key: x.s, slug: x.s, name: f.name, serving: f.serving, kcal: f.kcal };
}
export const GROUPS = PLATE.map(([g, xs]) => [g, xs.map(item)]);
export const ITEMS = GROUPS.flatMap(([, xs]) => xs);
export const CHUSEOK_SLUGS = new Set(ITEMS.map((it) => it.slug));
const byKey = Object.fromEntries(ITEMS.map((it) => [it.key, it]));
PRESETS.forEach((p) => Object.keys(p.q).forEach((k) => { if (!byKey[k]) throw new Error('추석 한 상 예시: 접시에 없는 항목 ' + k); }));
export const presetTotal = (p) => Object.entries(p.q).reduce((a, [k, n]) => a + byKey[k].kcal * n, 0);

export function nextChuseok(today) {
  const y = today.getUTCFullYear();
  for (const yy of [y, y + 1]) {
    const c = CHUSEOK_DATES[yy];
    if (!c) continue;
    const dt = D.utc(yy, c[0], c[1]);
    if (D.addDays(dt, 2) >= today) return { y: yy, m: c[0], d: c[1], wd: WD[dt.getUTCDay()], left: Math.round((dt - today) / 864e5) };
  }
  return null;
}
const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`);
const walk60 = (kcal) => hm(K.minutesFor(kcal, WALK, 60));

export function buildChuseok(ctx) {
  const { write, shell, crumb, list, section, lead, ad, table, TODAY } = ctx;
  const c = nextChuseok(TODAY);
  const F = (s) => foodBySlug[s];
  const N = ITEMS.length;
  const dday = c ? (c.left > 0 ? ` · D-${c.left}` : c.left === 0 ? ' · 오늘' : '') : '';
  const when = c ? `${c.y}년 추석 ${c.m}월 ${c.d}일(${c.wd})` : '추석';
  const rowHtml = (it) => `<div class="plate-row" data-key="${it.key}" data-slug="${it.slug}" data-name="${esc(it.name)}" data-kcal="${it.kcal}"><span class="pn"><a href="/food/${it.slug}/">${it.name}</a><small>${it.serving} · ${num(it.kcal)}kcal</small></span><span class="pq"><button type="button" data-d="-1" aria-label="${esc(it.name)} 빼기">−</button><b data-q>0</b><button type="button" data-d="1" aria-label="${esc(it.name)} 더하기">+</button></span></div>`;
  const sorted = ITEMS.slice().sort((a, b) => b.kcal - a.kcal);
  const top = sorted[0];
  const [morning, snack, dinner] = PRESETS.map((p) => ({ ...p, sum: presetTotal(p) }));
  const presetTable = (p) => table(['음식', '양', 'kcal'], Object.entries(p.q).map(([k, n]) => ({ cells: [`<a href="/food/${byKey[k].slug}/">${byKey[k].name}</a>`, n > 1 ? `${byKey[k].serving} × ${n}` : byKey[k].serving, num(byKey[k].kcal * n)] })).concat([{ cls: 'on', cells: ['<b>합계</b>', `밥 ${K.bowls(p.sum)}공기`, `<b>${num(p.sum)}</b>`] }]));
  const extra3 = 3000, fatKg = Math.round(extra3 / 7700 * 10) / 10;
  const piece = (s, n) => Math.round(F(s).kcal / n);

  const body = `
${crumb([['/food/', '음식 칼로리'], [null, '추석 음식 칼로리']])}
<h1 class="title">추석 음식 칼로리</h1>
<p class="meta">${when}${dday} · 명절 음식 ${N}가지 · 1인분 기준</p>
<form class="quick live plate" data-live="plate" data-plate="chuseok" data-met="${WALK}" data-title="내 추석 한 상" onsubmit="return false">
<div class="live-head"><b>내 추석 접시</b><span>+ 한 번 = 1인분</span></div>
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
${lead(`송편 5개 <b>${num(F('songpyeon').kcal)}kcal</b>, 모둠전 한 접시 <b>${num(F('jeon-assorted').kcal)}kcal</b>, 갈비찜 1인분 <b>${num(F('galbijjim').kcal)}kcal</b>. 차례상과 명절 밥상에 오르는 음식 ${N}가지를 1인분 기준으로 모았습니다. 접시에 담으면 한 끼 합계가 밥 몇 공기인지, 걸어서 태우려면 몇 분인지 바로 나옵니다. 차례 지낸 뒤 아침 한 상을 차려 보면 약 <b>${num(morning.sum)}kcal</b>로 밥 ${K.bowls(morning.sum)}공기쯤 됩니다.`)}
${section('추석 음식 칼로리표', `1인분 · 높은 순 · 걷기는 60kg 기준`, table(['음식', '양', 'kcal', '걷기'], sorted.map((it) => ({ cells: [`<a href="/food/${it.slug}/">${it.name}</a>`, it.serving, num(it.kcal), walk60(it.kcal)] }))))}
${ad()}
${section('한 상으로 보면', '접시 위 버튼과 같은 예시', `<div class="doc">
<p><b>${morning.label}</b> — 밥·토란국에 전 한 접시, 갈비찜, 나물 세 가지, 조기구이를 곁들이면 약 <b>${num(morning.sum)}kcal</b>입니다. 60kg인 사람이 걸어서 태우려면 ${walk60(morning.sum)}이 걸립니다.</p>
${presetTable(morning)}
<p style="margin-top:14px"><b>${snack.label}</b> — 송편 다섯 개에 식혜 한 잔, 배 한 조각, 밤 몇 알이면 약 <b>${num(snack.sum)}kcal</b>로 밥 한 공기를 훌쩍 넘습니다.</p>
${presetTable(snack)}
<p style="margin-top:14px"><b>${dinner.label}</b> — 전과 잡채, 양념 소갈비에 막걸리 한 병을 곁들이면 약 <b>${num(dinner.sum)}kcal</b>입니다. 술이 들어가면 안주가 빨리 비어 실제로는 더 늘기 쉽습니다.</p>
${presetTable(dinner)}
</div>`)}
${section('명절 뒤 몸무게, 얼마나 늘까', null, `<div class="doc">
<p>지방 1kg은 약 7,700kcal입니다. 연휴 사흘 동안 하루 1,000kcal씩 더 먹으면 ${num(extra3)}kcal, 지방으로는 <b>약 ${fatKg}kg</b>입니다.</p>
<p>명절 뒤 체중계가 1~2kg 더 가리키는 건 짠 음식과 떡·전의 탄수화물이 붙잡은 수분, 아직 소화 중인 음식이 상당 부분입니다. 평소 식사로 돌아가면 며칠 사이 일부가 빠지니, 연휴가 끝나고 사나흘 뒤 몸무게로 판단하세요. <a href="/weight/">체중 기록</a>에 연휴 전후를 적어 두면 한눈에 보입니다.</p>
</div>`)}
${section('덜 먹는 요령', null, `<div class="doc">
<p><b>전은 한 번에 덜어 먹기.</b> 모둠전 한 접시(150g)가 ${num(F('jeon-assorted').kcal)}kcal로 밥 ${K.bowls(F('jeon-assorted').kcal)}공기 분량입니다. 부친 뒤 키친타월에 한 번 올려 기름을 빼고, 먹을 만큼만 개인 접시에 덜면 손이 덜 갑니다.</p>
<p><b>식혜·수정과는 물처럼 마시지 않기.</b> 식혜 한 잔(200ml) ${num(F('sikhye-cup').kcal)}kcal, 수정과 한 잔 ${num(F('sujeonggwa').kcal)}kcal로 설탕이 든 음료입니다. 목이 마를 땐 물이나 보리차를 드세요.</p>
<p><b>과일은 한두 조각.</b> 배 ¼개는 ${num(byKey['pear-100'].kcal)}kcal, 사과 ½개는 ${num(byKey['apple-125'].kcal)}kcal입니다. 곶감은 한 개(40g)에 ${num(F('dried-persimmon').kcal)}kcal로, 100g당 칼로리가 단감의 ${Math.round(F('dried-persimmon').per100 / F('persimmon').per100)}배쯤입니다.</p>
<p><b>갈비찜은 기름을 걷어 내기.</b> 식혀서 위에 굳은 기름을 걷어 내고 국물보다 건더기 위주로 드세요.</p>
<p><b>술은 병 단위로 세기.</b> 막걸리 한 병 ${num(F('makgeolli').kcal)}kcal, 소주 한 병 ${num(F('soju').kcal)}kcal에 전 한 접시를 곁들이면 ${num(F('makgeolli').kcal + F('jeon-assorted').kcal)}~${num(F('soju').kcal + F('jeon-assorted').kcal)}kcal가 됩니다. 마신 다음 날 아침 운전도 조심하세요.</p>
<p><b>식사 뒤 20~30분 걷기.</b> 60kg인 사람이 30분 걸으면 약 ${num(K.burn(WALK, 60, 30))}kcal을 씁니다. 송편 ${Math.round(K.burn(WALK, 60, 30) / piece('songpyeon', 5))}개쯤이지만, 식후 혈당이 덜 오르고 소화에도 도움이 됩니다.</p>
</div>`)}
${section('자주 묻는 것', null, `<div class="doc">
<p><b>송편 1개 칼로리는?</b> 송편 5개(100g)가 ${num(F('songpyeon').kcal)}kcal이라 한 개에 약 ${piece('songpyeon', 5)}kcal입니다(깨 송편 기준). 식약처 값으로 밤 송편은 100g당 약 180kcal라 조금 가볍습니다.</p>
<p><b>동그랑땡 1개는?</b> ${F('donggeurangttaeng').name}(${F('donggeurangttaeng').serving})가 ${num(F('donggeurangttaeng').kcal)}kcal이라 한 개에 약 ${piece('donggeurangttaeng', 5)}kcal입니다.</p>
<p><b>추석 음식 중 칼로리가 가장 높은 것은?</b> 1인분 기준으로는 ${top.name} ${top.serving}, ${num(top.kcal)}kcal입니다. 한 번에 먹는 양이 많은 전·고기류와 술이 합계를 크게 좌우합니다.</p>
<p><b>명절 한 끼는 보통 몇 kcal?</b> 위 예시처럼 차례 뒤 아침 한 상이 ${num(morning.sum)}kcal 안팎입니다. 성인 하루 필요량(약 2,000kcal)의 ${Math.round(morning.sum / 20)}%를 한 끼에 먹는 셈입니다.</p>
</div>`)}
${section('이어서', null, list([{ href: '/today/', title: '오늘 먹은 칼로리 담기', sub: '접시에 담은 것을 하루 합계로' }, { href: '/weight/', title: '체중 기록', sub: '연휴 전후 몸무게를 그래프로' }, { href: '/alcohol/makgeolli/1/', title: '막걸리 1병 마시면', sub: '혈중알코올과 운전 가능 시간' }, { href: '/diet/1/', title: '1kg 빼는 데 걸리는 기간', sub: '하루 500kcal 줄이면' }, { href: '/exercise/walking/', title: '걷기 칼로리', sub: '몸무게·시간별' }]))}
<p class="note">칼로리는 <a href="https://various.foodsafetykorea.go.kr/nutrient/" rel="nofollow">식품의약품안전처 식품영양성분 데이터베이스</a>의 100g당 값(음식·원재료)을 1인분 양에 맞춰 반올림한 대략값입니다. 집집마다 크기·기름·양념이 달라 ±20% 이상 차이 날 수 있습니다. 걷기 시간은 시속 4km(MET ${WALK}) 기준입니다. <a href="/method/">계산 기준 보기</a></p>`;
  const title = `추석 음식 칼로리표 — 송편·전·갈비찜 한 상 몇 kcal? 접시에 담아 계산${c ? ` (${c.y})` : ''}`;
  const desc = `송편 5개 ${num(F('songpyeon').kcal)}kcal, 모둠전 한 접시 ${num(F('jeon-assorted').kcal)}kcal, 갈비찜 1인분 ${num(F('galbijjim').kcal)}kcal. 차례상·명절 밥상 음식 ${N}가지를 1인분 기준으로 모았고, 접시에 담으면 한 끼 합계와 밥 공기·걷기 시간이 바로 나옵니다.${c ? ` ${c.y}년 추석은 ${c.m}월 ${c.d}일(${c.wd}).` : ''}`;
  write('/food/chuseok/', shell({ url: '/food/chuseok/', og: 'chuseok', nav: 'food', title, desc, body, scripts: ['/js/plate.js'] }));
}
