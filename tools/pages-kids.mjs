/* 아이 키·몸무게 백분위 — 만 3~18세 (질병관리청 2017 소아청소년 성장도표)
 * /kids/ 계산기 · /kids/10-boy/ 나이별 표 · /kids/10-boy/140/ 키별 · /kids/grade/e3-boy/ 학년별 */
import * as K from '../engine/kids.mjs';

export const KIDS_SEX = ['m', 'f'];
const slug = (s) => s === 'f' ? 'girl' : 'boy';
const kid = (s, y = 0) => y >= 13 ? (s === 'f' ? '여자' : '남자') : (s === 'f' ? '여자아이' : '남자아이');
const kidShort = (s, y = 0) => y >= 13 ? (s === 'f' ? '여자' : '남자') : (s === 'f' ? '여아' : '남아');
const other = (s) => s === 'm' ? 'f' : 'm';
export const ageUrl = (y, s) => `/kids/${y}-${slug(s)}/`;
export const heightUrl = (y, s, cm) => `/kids/${y}-${slug(s)}/${cm}/`;
export const gradeSlug = (g) => g <= 6 ? `e${g}` : g <= 9 ? `m${g - 6}` : `h${g - 9}`;
export const gradeUrl = (g, s) => `/kids/grade/${gradeSlug(g)}-${slug(s)}/`;
const pctTxt = (p) => p < 0.1 ? '0.1 미만' : p > 99.9 ? '99.9 초과' : String(p);
const peers = (p) => p < 0.5 ? '또래 100명 가운데 가장 작은 쪽입니다' : p > 99.5 ? '또래 100명 가운데 가장 큰 쪽입니다' : `같은 나이 100명 가운데 약 ${Math.round(p)}명보다 큽니다`;
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
const Z = { 3: -1.8808, 5: -1.6449, 85: 1.0364, 95: 1.6449, 97: 1.8808 };

export function buildKids(ctx) {
  const { write, shell, crumb, tiles, list, section, table, lead, ad } = ctx;
  const chipsWrap = (items) => `<div class="chips" style="flex-wrap:wrap;overflow:visible">${items.map((c) => c.on ? `<span class="chip on" style="min-width:0;padding:4px 9px">${c.label}</span>` : `<a class="chip" style="min-width:0;padding:4px 9px" href="${c.href}">${c.label}</a>`).join('')}</div>`;
  const SRC = '질병관리청·대한소아청소년과학회 「2017 소아청소년 성장도표」의 LMS 값으로 계산했습니다(만 3세 미만은 WHO 표준). 백분위는 같은 성별·나이 100명을 작은 순서로 세웠을 때의 위치이고, 한 번 잰 값보다 1년 넘게 이어지는 성장 곡선이 중요합니다. 참고용이며 진단은 소아청소년과에서 받으세요.';
  const NOTE = `<p class="note">${SRC} <a href="/method/">계산 기준 보기</a></p>`;
  const val = (m, s, mo, z) => K.kidsRound(K.kidsValue(m, s, mo, z));
  const med = (m, s, mo) => val(m, s, mo, 0);
  const at = (row, p) => row.find((x) => x[0] === p)[1];
  const form = (s, months, h = '', w = '') => `<form class="quick live" data-live="kids" style="margin-top:14px"><div class="live-head"><b>우리 아이 계산</b><span>2017 소아청소년 성장도표</span></div><div class="ye-grid"><label class="ye-f"><span>성별</span><select data-k="sex"><option value="m"${s === 'm' ? ' selected' : ''}>남자</option><option value="f"${s === 'f' ? ' selected' : ''}>여자</option></select></label><label class="ye-f"><span>생년월일 (넣으면 나이 자동)</span><input data-k="birth" type="date" value=""></label><label class="ye-f"><span>나이 (만 세)</span><input data-k="y" type="text" inputmode="numeric" value="${Math.floor(months / 12)}"></label><label class="ye-f"><span>개월</span><input data-k="mo" type="text" inputmode="numeric" value="${Math.round(months % 12)}"></label><label class="ye-f"><span>키 (cm)</span><input data-k="h" type="text" inputmode="decimal" value="${h}"></label><label class="ye-f"><span>몸무게 (kg)</span><input data-k="w" type="text" inputmode="decimal" value="${w}"></label></div><div class="tiles"><div class="tile"><small>키 백분위</small><span class="num" data-out="hp">—</span></div><div class="tile"><small>몸무게 백분위</small><span class="num" data-out="wp">—</span></div><div class="tile"><small>BMI · 백분위</small><span class="num" data-out="bp">—</span></div></div><p class="sub" style="margin-top:8px" data-out="note"></p><div class="live-foot"><span>이 백분위대로 크면 만 18세 <b class="num" data-out="adult">—</b></span><a data-out="link" href="/kids/">표 보기 →</a></div></form>`;
  const pctTable = (s, mo) => { const H = K.kidsRow('height', s, mo), W = K.kidsRow('weight', s, mo), B = K.kidsRow('bmi', s, mo); return table(['백분위', '키 (cm)', '몸무게 (kg)', 'BMI'], K.KIDS_PCTS.map((p, i) => ({ cells: [`${p}`, String(H[i][1]), String(W[i][1]), String(B[i][1])], cls: p === 50 ? 'on' : '' }))); };

  /* ---------- 키별 (나이·성별·키) ---------- */
  for (const s of KIDS_SEX) for (const y of K.KIDS_AGES) {
    const [lo, hi] = K.kidsHeightRange(s, y);
    const mid = Math.min(K.KIDS_END, y * 12 + 6);
    const inYear = [0, 3, 6, 9, 11].map((k) => Math.min(K.KIDS_END, y * 12 + k));
    const g = K.gradeFor(mid);
    const [ol, oh] = K.kidsHeightRange(other(s), y);
    for (let cm = lo; cm <= hi; cm++) {
      const c = K.kidsCheck('height', s, mid, cm), rank = K.kidsRank(c.pct), diff = K.kidsRound(cm - c.median);
      const n3 = val('height', s, mid, Z[3]), n97 = val('height', s, mid, Z[97]);
      const adult = y < 17 ? K.trackAdult(s, mid, cm) : null;
      const url = heightUrl(y, s, cm);
      const title = `만 ${y}세 ${kid(s, y)} 키 ${cm}cm, 또래 중 몇 번째? — ${rank} (백분위 ${pctTxt(c.pct)})`;
      const desc = `만 ${y}세 ${kid(s, y)} 키 ${cm}cm는 만 ${y}세 6개월 기준 백분위 ${pctTxt(c.pct)}, ${rank}입니다. 또래 한가운데(50백분위)는 ${c.median}cm, 정상 범위(3~97백분위)는 ${n3}~${n97}cm.${adult ? ` 이 백분위를 따라가면 만 18세 약 ${adult}cm.` : ''} 질병관리청 2017 성장도표 기준.`;
      const warn = c.band.key === 'low2'
        ? `<p class="sub" style="margin-top:6px"><b>3백분위 미만</b>은 병이라는 뜻이 아니라 한 번 확인해 보자는 기준입니다. 부모를 닮은 작은 키나 사춘기가 늦게 오는 체질이 흔하지만, 1년에 4cm 미만으로 자라거나 곡선이 아래로 꺾이면 소아청소년과에서 성장 평가를 받아 보세요.</p>`
        : c.band.key === 'high2' ? `<p class="sub" style="margin-top:6px"><b>97백분위 초과</b>는 대부분 부모를 닮은 큰 키입니다. 다만 사춘기 변화(여아 만 8세 전 가슴 멍울, 남아 만 9세 전 고환 커짐)가 또래보다 일찍 보이면 성조숙증 확인을 위해 소아청소년과에 가 보세요.</p>` : '';
      const near = range(Math.max(lo, cm - 4), Math.min(hi, cm + 4));
      const ages = K.KIDS_AGES.filter((a) => a !== y && Math.abs(a - y) <= 3 && (() => { const [l2, h2] = K.kidsHeightRange(s, a); return cm >= l2 && cm <= h2; })());
      const body = `
${crumb([['/kids/', '아이 키 백분위'], [ageUrl(y, s), `만 ${y}세 ${kidShort(s, y)}`], [null, `${cm}cm`]])}
<h1 class="title">만 ${y}세 ${kid(s, y)} 키 ${cm}cm</h1>
<p class="meta">만 ${y}세 6개월 기준 · 질병관리청 2017 소아청소년 성장도표 · 개월마다 달라지는 값은 아래 표</p>
${tiles([{ label: '키 백분위', value: pctTxt(c.pct) }, { label: '또래 100명 중', value: rank }, { label: '또래 한가운데', value: `${c.median}cm` }, { label: '한가운데와 차이', value: `${diff > 0 ? '+' : ''}${diff}cm` }])}
${lead(`만 ${y}세 ${kid(s, y)} 키 <b>${cm}cm</b>는 백분위 <b>${pctTxt(c.pct)}</b>로, ${peers(c.pct)}. 판정은 <b>${c.band.label}</b>입니다. 한가운데(50백분위)는 ${c.median}cm이고, 3백분위 ${n3}cm부터 97백분위 ${n97}cm까지가 정상 범위입니다.`)}
${warn}
${form(s, mid, cm)}
${section('개월에 따라', `같은 ${cm}cm라도 생일이 지날수록 백분위가 내려갑니다`, table(['나이', '백분위', '또래 한가운데'], inYear.map((mo) => { const r = K.kidsCheck('height', s, mo, cm); return { cells: [K.ageLabel(mo), pctTxt(r.pct), `${r.median}cm`], cls: mo === mid ? 'on' : '' }; })))}
${adult ? section('이대로 자라면', '만 18세 키 어림', `<div class="doc"><p>지금 백분위(${pctTxt(c.pct)})를 만 18세까지 그대로 따라가면 약 <b>${adult}cm</b>입니다. 사춘기가 또래보다 빠르면 지금 백분위가 높게 나오고 늦으면 낮게 나오기 때문에, 실제 키와는 몇 cm씩 차이가 날 수 있습니다. 부모 키로 보는 예상 키와 함께 보세요.</p></div>`) : ''}
${ad()}
${section('근처 키', `만 ${y}세 6개월 ${kidShort(s, y)}`, table(['키', '백분위', '또래 100명 중'], near.map((k) => { const r = K.kidsCheck('height', s, mid, k); return { cells: [k === cm ? `${k}cm` : `<a href="${heightUrl(y, s, k)}">${k}cm</a>`, pctTxt(r.pct), K.kidsRank(r.pct)], cls: k === cm ? 'on' : '' }; })))}
${ages.length ? section('같은 키, 다른 나이', `${kidShort(s, y)} ${cm}cm`, chipsWrap(ages.map((a) => ({ label: `만 ${a}세`, href: heightUrl(a, s, cm) })))) : ''}
${section('이어서', null, list([
  { href: ageUrl(y, s), title: `만 ${y}세 ${kid(s, y)} 평균 키·몸무게`, sub: '백분위표 · 비만도 기준' },
  cm >= ol && cm <= oh ? { href: heightUrl(y, other(s), cm), title: `만 ${y}세 ${kid(other(s), y)} ${cm}cm`, sub: '같은 키, 다른 성별' } : null,
  g ? { href: gradeUrl(g, s), title: `${K.GRADE_NAMES[g - 1]} ${kidShort(s, y)} 평균 키`, sub: '학년별' } : null,
  { href: '/child-height/', title: '부모 키로 예상 키', sub: '아빠·엄마 키로 어른 키' },
].filter(Boolean)))}
${NOTE}`;
      write(url, shell({ og: 'kids', url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
    }
  }

  /* ---------- 나이별 ---------- */
  for (const s of KIDS_SEX) for (const y of K.KIDS_AGES) {
    const m0 = y * 12, mid = Math.min(K.KIDS_END, y * 12 + 6);
    const H = K.kidsRow('height', s, m0), W = K.kidsRow('weight', s, m0), BM = K.kidsRow('bmi', s, m0);
    const [lo, hi] = K.kidsHeightRange(s, y);
    const grades = K.gradesForAge(y);
    const gradeHint = grades.length ? `학년으로는 ${grades.map((g) => K.GRADES[g - 1]).join('~')} 나이` : y < 7 ? '초등학교 들어가기 전' : '고등학교 졸업 무렵';
    const obese = Math.min(25, at(BM, 95)), hRef = at(H, 50);
    const url = ageUrl(y, s);
    const title = `만 ${y}세 ${kid(s, y)} 평균 키 ${at(H, 50)}cm·몸무게 ${at(W, 50)}kg — 백분위표 (2017 성장도표)`;
    const desc = `만 ${y}세 ${kid(s, y)}의 50백분위는 키 ${at(H, 50)}cm·몸무게 ${at(W, 50)}kg·BMI ${at(BM, 50)}입니다. 정상 범위(3~97백분위)는 키 ${at(H, 3)}~${at(H, 97)}cm, 몸무게 ${at(W, 3)}~${at(W, 97)}kg. BMI ${at(BM, 85)} 이상 과체중·${obese} 이상 비만. 우리 아이 키·몸무게를 넣으면 백분위가 바로.`;
    const body = `
${crumb([['/kids/', '아이 키 백분위'], [null, `만 ${y}세 ${kidShort(s, y)}`]])}
<h1 class="title">만 ${y}세 ${kid(s, y)} 키·몸무게</h1>
<p class="meta">만 ${y}세 0개월 기준 · ${gradeHint} · 질병관리청 2017 소아청소년 성장도표</p>
${tiles([{ label: '키 50백분위', value: `${at(H, 50)}cm` }, { label: '몸무게 50백분위', value: `${at(W, 50)}kg` }, { label: 'BMI 50백분위', value: `${at(BM, 50)}` }])}
${lead(`만 ${y}세 ${kid(s, y)}의 한가운데(50백분위)는 키 <b>${at(H, 50)}cm</b>, 몸무게 <b>${at(W, 50)}kg</b>입니다. 키는 3백분위 ${at(H, 3)}cm부터 97백분위 ${at(H, 97)}cm까지가 정상 범위이고, 만 ${y}세 6개월이 되면 한가운데가 ${med('height', s, mid)}cm로 올라갑니다. 우리 아이 키와 몸무게를 넣으면 정확한 백분위와 비만도가 나옵니다.`)}
${form(s, mid)}
${section('백분위표', `만 ${y}세 0개월 ${kidShort(s, y)}`, pctTable(s, m0))}
${section('개월별 한가운데', '50백분위', table(['나이', '키', '몸무게'], [0, 3, 6, 9].map((k) => Math.min(K.KIDS_END, m0 + k)).map((mo) => ({ cells: [K.ageLabel(mo), `${med('height', s, mo)}cm`, `${med('weight', s, mo)}kg`] }))))}
${section('비만도 기준', `만 ${y}세 0개월 ${kidShort(s, y)} BMI`, `<div class="doc"><p>어린이·청소년은 어른 기준을 그대로 쓰지 않고 같은 성별·나이의 BMI 백분위로 봅니다. 만 ${y}세 ${kidShort(s, y)}는 BMI <b>${at(BM, 85)}</b> 이상이면 과체중(85백분위), <b>${obese}</b> 이상이면 비만(95백분위 또는 25 이상), ${at(BM, 5)} 미만이면 저체중(5백분위)입니다.</p><p>예를 들어 키가 ${hRef}cm라면 몸무게 ${K.kidsRound(at(BM, 85) * Math.pow(hRef / 100, 2))}kg부터 과체중, ${K.kidsRound(obese * Math.pow(hRef / 100, 2))}kg부터 비만입니다.</p></div>`)}
${ad()}
${section('키별로 보기', `만 ${y}세 ${kidShort(s, y)} · 누르면 백분위`, chipsWrap(range(lo, hi).map((k) => ({ label: `${k}`, href: heightUrl(y, s, k) }))))}
<div class="pager">${y > 3 ? `<a href="${ageUrl(y - 1, s)}">← 만 ${y - 1}세</a>` : '<span></span>'}${y < 18 ? `<a href="${ageUrl(y + 1, s)}">만 ${y + 1}세 →</a>` : '<span></span>'}</div>
${section('이어서', null, list([
  { href: ageUrl(y, other(s)), title: `만 ${y}세 ${kid(other(s), y)} 평균 키·몸무게`, sub: '' },
  ...grades.map((g) => ({ href: gradeUrl(g, s), title: `${K.GRADE_NAMES[g - 1]} ${kidShort(s, y)} 평균 키`, sub: '학년별' })),
  { href: '/child-height/', title: '부모 키로 예상 키', sub: '아빠·엄마 키로 어른 키' },
]))}
${NOTE}`;
    write(url, shell({ og: 'kids', url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
  }

  /* ---------- 학년별 ---------- */
  for (const s of KIDS_SEX) for (let g = 1; g <= 12; g++) {
    const mid = K.gradeMonths(g), old = Math.min(K.KIDS_END, mid + 6), young = mid - 5;
    const H = K.kidsRow('height', s, mid), W = K.kidsRow('weight', s, mid), BM = K.kidsRow('bmi', s, mid);
    const gn = K.GRADE_NAMES[g - 1], gs = K.GRADES[g - 1], ay = Math.floor(mid / 12), y = ay;
    const url = gradeUrl(g, s);
    const title = `${gn} ${s === 'f' ? '여자' : '남자'} 평균 키 ${at(H, 50)}cm·몸무게 ${at(W, 50)}kg — ${gs} 백분위표`;
    const desc = `${gs} ${kid(s, y)}(9월 기준 대략 ${K.ageLabel(young)}~${K.ageLabel(old)}, 한가운데 ${K.ageLabel(mid)})의 성장도표 50백분위는 키 ${at(H, 50)}cm·몸무게 ${at(W, 50)}kg입니다. 정상 범위 키 ${at(H, 3)}~${at(H, 97)}cm. 1월생과 12월생 차이, 우리 아이 백분위 계산.`;
    const body = `
${crumb([['/kids/', '아이 키 백분위'], [null, `${gs} ${kidShort(s, y)}`]])}
<h1 class="title">${gn} ${kid(s, y)} 키·몸무게</h1>
<p class="meta">9월 1일 기준 학년 한가운데(7월생) ${K.ageLabel(mid)} · 질병관리청 2017 소아청소년 성장도표</p>
${tiles([{ label: '키 50백분위', value: `${at(H, 50)}cm` }, { label: '몸무게 50백분위', value: `${at(W, 50)}kg` }, { label: 'BMI 50백분위', value: `${at(BM, 50)}` }])}
${lead(`${gn} ${kid(s, y)}는 9월 1일 기준으로 대략 ${K.ageLabel(young)}(12월생)부터 ${K.ageLabel(old)}(1월생)까지 섞여 있습니다. 학년 한가운데 나이(${K.ageLabel(mid)})의 성장도표 50백분위는 키 <b>${at(H, 50)}cm</b>, 몸무게 <b>${at(W, 50)}kg</b>이고, 정상 범위(3~97백분위)는 키 ${at(H, 3)}~${at(H, 97)}cm입니다. 같은 반이라도 1월생과 12월생은 한가운데 키가 ${K.kidsRound(med('height', s, old) - med('height', s, young))}cm 차이 납니다.`)}
${section('생일에 따라', '같은 학년 · 50백분위', table(['생일', '9월 1일 나이', '키', '몸무게'], [['1월생', old], ['7월생', mid], ['12월생', young]].map(([lb, mo]) => ({ cells: [lb, K.ageLabel(mo), `${med('height', s, mo)}cm`, `${med('weight', s, mo)}kg`], cls: mo === mid ? 'on' : '' }))))}
${form(s, mid)}
${section('백분위표', `${gs} ${kidShort(s, y)} · ${K.ageLabel(mid)}`, pctTable(s, mid))}
${ad()}
${section('다른 학년', kidShort(s, y), chipsWrap(K.GRADES.map((x, i) => ({ label: x, href: gradeUrl(i + 1, s), on: i + 1 === g }))))}
${section('이어서', null, list([
  { href: gradeUrl(g, other(s)), title: `${gn} ${kid(other(s), y)} 평균 키`, sub: '' },
  { href: ageUrl(ay, s), title: `만 ${ay}세 ${kid(s, y)} 백분위표`, sub: '나이별' },
  { href: '/kids/', title: '아이 키 백분위 계산기', sub: '생년월일·키·몸무게로' },
]))}
<p class="note">학년 평균은 성장도표를 학년 한가운데 나이에 맞춰 읽은 값이라, 교육부 학생건강검사의 실측 평균과는 조금 다를 수 있습니다. ${SRC} <a href="/method/">계산 기준 보기</a></p>`;
    write(url, shell({ og: 'kids', url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
  }

  /* ---------- 계산기 (허브) ---------- */
  write('/kids/', shell({ og: 'kids', url: '/kids/', title: '아이 키 백분위 계산기 — 만 3~18세 키·몸무게·BMI가 또래 몇 번째 (2017 성장도표)', desc: '생년월일(또는 나이)과 키·몸무게를 넣으면 또래 100명 중 몇 번째인지(백분위), 비만도(BMI 백분위), 지금 백분위대로 자랐을 때의 만 18세 키가 나옵니다. 나이별·학년별 평균 키 표. 질병관리청 2017 소아청소년 성장도표 기준.', nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/', '홈'], [null, '아이 키 백분위']])}
<h1 class="title">아이 키 백분위</h1>
<p class="meta">만 3~18세 · 키·몸무게·BMI · 질병관리청 2017 소아청소년 성장도표 · 만 3세 미만은 <a href="/baby/percentile/">아기 성장 백분위</a></p>
${form('m', 126)}
${lead('백분위는 같은 성별·나이 아이 100명을 작은 순서로 세웠을 때 몇 번째인지입니다. 50이 한가운데이고 3~97 사이면 정상 범위입니다. 생년월일을 넣으면 개월까지 맞춰 계산하고, 키와 몸무게를 함께 넣으면 비만도(BMI 백분위)도 나옵니다.')}
${section('나이별 평균 키·몸무게', '만 N세 0개월 · 50백분위 · 누르면 백분위표', table(['나이', '남자 키', '남자 몸무게', '여자 키', '여자 몸무게'], K.KIDS_AGES.map((y) => ({ cells: [`만 ${y}세`, `<a href="${ageUrl(y, 'm')}">${med('height', 'm', y * 12)}cm</a>`, `${med('weight', 'm', y * 12)}kg`, `<a href="${ageUrl(y, 'f')}">${med('height', 'f', y * 12)}cm</a>`, `${med('weight', 'f', y * 12)}kg`] }))))}
${section('학년별 평균 키', '남자', chipsWrap(K.GRADES.map((x, i) => ({ label: x, href: gradeUrl(i + 1, 'm') }))))}
${section('학년별 평균 키', '여자', chipsWrap(K.GRADES.map((x, i) => ({ label: x, href: gradeUrl(i + 1, 'f') }))))}
${ad()}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>한 번 잰 숫자보다 곡선이 중요합니다.</b> 10백분위든 90백분위든 자기 곡선을 따라 자라면 정상입니다. 1년 사이 큰 구간을 두 칸 넘게(예: 50 → 10) 내려가면 소아청소년과에 물어보세요.</p>
<p><b>3백분위 미만이면 성장 평가를 받아 봅니다.</b> 부모를 닮은 작은 키나 사춘기가 늦게 오는 체질이 흔하지만, 사춘기 전에 1년 동안 4cm 미만으로 자라면 원인을 확인하는 것이 좋습니다.</p>
<p><b>사춘기가 이르면 지금은 커 보여도 일찍 멈춥니다.</b> 여아 만 8세 전 가슴 멍울, 남아 만 9세 전 고환 커짐은 성조숙증 확인이 필요합니다.</p>
<p><b>비만은 BMI 백분위로 봅니다.</b> 85백분위 이상 과체중, 95백분위 이상(또는 BMI 25 이상) 비만, 5백분위 미만 저체중입니다.</p>
<p><b>재는 법.</b> 아침에 신발을 벗고 발뒤꿈치·엉덩이·어깨를 벽에 붙여 잽니다. 저녁에는 1cm가량 줄어듭니다.</p>
</div>`)}
${section('이어서', null, list([{ href: '/child-height/', title: '부모 키로 예상 키', sub: '아빠·엄마 키로 아들·딸 어른 키' }, { href: '/baby/percentile/', title: '아기 성장 백분위', sub: '0~36개월 · WHO' }, { href: '/baby/month/', title: '아기 개월별 발달', sub: '0~36개월 평균 키·몸무게' }]))}
${NOTE}` }));
}
