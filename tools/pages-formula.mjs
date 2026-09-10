/* 분유 수유량 — /baby/formula/ 계산기 · /baby/formula/{0~12}/ 개월별 · /baby/formula/week/{1~8}/ 주별 · /baby/formula/kg/{2.5~9}/ 몸무게별 */
import * as FM from '../engine/formula.mjs';
import * as G from '../engine/growth.mjs';
import { num } from '../engine/fmt.mjs';

export const FORMULA_MONTHS = []; for (let m = 0; m <= 12; m++) FORMULA_MONTHS.push(m);
export const FORMULA_WEEKS = [1, 2, 3, 4, 5, 6, 7, 8];
export const FORMULA_KG = []; for (let k = 25; k <= 90; k += 5) FORMULA_KG.push(k / 10);
export const fmUrl = (m) => `/baby/formula/${m}/`;
export const fwUrl = (w) => `/baby/formula/week/${w}/`;
export const fkUrl = (k) => `/baby/formula/kg/${k}/`;
const mName = (m) => m === 0 ? '신생아(0개월)' : `생후 ${m}개월`;
const mShort = (m) => m === 0 ? '신생아' : `${m}개월`;
const k1 = (x) => Math.round(x * 10) / 10;
/* 보통 몸무게 — WHO 50백분위 남녀 평균 */
const typKg = (months) => k1((G.valueAt('weight', 'm', months, 0) + G.valueAt('weight', 'f', months, 0)) / 2);
/* 그 시기 몸무게 표 행 — 여아 3백분위 ~ 남아 97백분위, 0.5kg 간격 */
const kgRows = (months) => { const lo = Math.floor(G.valueAt('weight', 'f', months, -1.8808) * 2) / 2, hi = Math.ceil(G.valueAt('weight', 'm', months, 1.8808) * 2) / 2; const r = []; for (let k = Math.max(2, lo); k <= hi + 1e-9; k += 0.5) r.push(k1(k)); return r; };
const perAt = (kg, n) => FM.r10(FM.dailyFor(kg) / n);

export function buildFormula(ctx) {
  const { write, shell, crumb, tiles, list, section, table, lead, ad } = ctx;
  const chipsWrap = (items) => `<div class="chips" style="flex-wrap:wrap;overflow:visible">${items.map((c) => c.on ? `<span class="chip on" style="min-width:0;padding:4px 9px">${c.label}</span>` : `<a class="chip" style="min-width:0;padding:4px 9px" href="${c.href}">${c.label}</a>`).join('')}</div>`;
  const NOTE = `<p class="note">하루 총량은 미국소아과학회(AAP) HealthyChildren 「Amount and Schedule of Baby Formula Feedings」(2022)의 몸무게 1파운드당 하루 2.5온스(1kg당 약 165ml) 규칙과 하루 960ml(32온스) 이내 기준이고, 신생아 수유 간격은 미국 CDC 「How Much and How Often to Feed Infant Formula」를 따랐습니다. 보통 몸무게는 WHO 성장 표준 50백분위의 남녀 평균입니다. 아기마다 먹는 양이 달라 참고용이며, 체중이 늘지 않거나 잘 먹지 않으면 소아청소년과에 문의하세요. <a href="/method/">계산 기준 보기</a></p>`;
  const SIGNS = `<div class="doc">
<p><b>표는 출발점입니다.</b> 아기마다 먹는 양이 다르고 날마다 달라집니다. 입을 벌리며 찾거나 손을 빠는 배고픔 신호에 먹이고, 고개를 돌리거나 젖꼭지를 밀어내면 그만 먹입니다. 병에 남은 분유를 억지로 다 먹이지 마세요.</p>
<p><b>잘 먹고 있다는 신호.</b> 생후 1주가 지나면 소변 기저귀가 하루 6개 이상 나오고, 체중이 성장 곡선을 따라 늘면 충분히 먹고 있는 것입니다.</p>
<p><b>하루 960ml를 넘게 계속 원하면</b> 소아청소년과에 물어보세요(미국소아과학회).</p>
<p><b>분유는 통에 적힌 비율대로 탑니다.</b> 물을 더 넣거나 덜 넣으면 영양과 수분 균형이 깨집니다.</p>
<p><b>미숙아·저체중아·아픈 아기</b>는 의료진이 정한 양을 따르세요.</p>
</div>`;
  const form = (mo, kg = '') => `<form class="quick live" data-live="formula" style="margin-top:14px"><div class="live-head"><b>우리 아기 계산</b><span>1kg당 하루 165ml · 960ml 이내</span></div><div class="ye-grid"><label class="ye-f"><span>생년월일 (넣으면 개월 자동)</span><input data-k="birth" type="date" value=""></label><label class="ye-f"><span>개월 (소수 가능)</span><input data-k="mo" type="text" inputmode="decimal" value="${mo}"></label><label class="ye-f"><span>몸무게 (kg)</span><input data-k="kg" type="text" inputmode="decimal" value="${kg}"></label><label class="ye-f"><span>하루 횟수</span><select data-k="feeds"><option value="">개월에 맞춰 자동</option>${[4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}">${n}회</option>`).join('')}</select></label></div><div class="tiles"><div class="tile"><small>1회량</small><span class="num" data-out="per">—</span></div><div class="tile"><small>하루 횟수</small><span class="num" data-out="feeds">—</span></div><div class="tile"><small>하루 총량</small><span class="num" data-out="daily">—</span></div></div><p class="sub" style="margin-top:8px" data-out="note"></p><div class="live-foot"><span>간격 <b class="num" data-out="interval">—</b></span><a data-out="link" href="/baby/formula/">개월별 표 →</a></div></form>`;
  const kgTable = (months, m) => { const [a, b] = FM.FEEDS_RANGE[m]; return table(['몸무게', '하루 총량', `1회 (${a}회면)`, `1회 (${b}회면)`], kgRows(months).map((k) => ({ cells: [FORMULA_KG.includes(k) ? `<a href="${fkUrl(k)}">${k}kg</a>` : `${k}kg`, `${num(FM.dailyFor(k))}ml`, `${perAt(k, a)}ml`, `${perAt(k, b)}ml`] }))); };
  const FIRST = `<div class="doc"><p>태어나서 1주까지는 1회 <b>30~60ml</b>를 2~3시간마다(하루 8~12회) 먹입니다(미국 CDC·소아과학회). 위가 작아 조금씩 자주 먹고, 1주가 지나면 조금씩 늘어 첫 달이 끝날 무렵 1회 90~120ml가 됩니다. 몸무게로 계산하는 하루 총량은 1주가 지난 뒤부터 봅니다.</p></div>`;

  /* ---------- 개월별 0~5 (몸무게 기준) ---------- */
  for (const m of [0, 1, 2, 3, 4, 5]) {
    const mid = m + 0.5, kg = typKg(mid), n = FM.feedsFor(mid), daily = FM.dailyFor(kg), per = FM.r10(daily / n);
    const kgM = k1(G.valueAt('weight', 'm', mid, 0)), kgF = k1(G.valueAt('weight', 'f', mid, 0));
    const url = fmUrl(m);
    const title = m === 0 ? `신생아 분유량 — 첫 주 1회 30~60ml, 2주 무렵부터 1회 약 ${per}ml × ${FM.FEEDS_TEXT[0]}` : `${mName(m)} 아기 분유량 — 1회 약 ${per}ml · 하루 ${FM.FEEDS_TEXT[m]} (몸무게별 표)`;
    const desc = `${mName(m)} 아기(보통 ${kg}kg)는 하루 약 ${num(daily)}ml를 ${n}회로 나눠 1회 ${per}ml 안팎을 먹습니다.${m === 0 ? ' 태어나서 1주까지는 1회 30~60ml.' : ''} 몸무게 1kg당 하루 165ml, 하루 960ml 이내(미국소아과학회). 몸무게별 1회량 표와 계산기.`;
    const body = `
${crumb([['/baby/', '아기'], ['/baby/formula/', '분유 수유량'], [null, mShort(m)]])}
<h1 class="title">${mName(m)} 분유량</h1>
<p class="meta">보통 몸무게 ${kg}kg(남아 ${kgM} · 여아 ${kgF}, WHO 50백분위) 기준 · 1kg당 하루 165ml · 하루 960ml 이내</p>
${tiles([{ label: '1회량', value: `${per}ml` }, { label: '하루 횟수', value: FM.FEEDS_TEXT[m] }, { label: '하루 총량', value: `${num(daily)}ml` }])}
${lead(`${mName(m)} 아기의 보통 몸무게 ${kg}kg으로 계산하면 하루 약 <b>${num(daily)}ml</b>이고, 하루 ${n}회로 나누면 1회 <b>${per}ml</b> 안팎입니다.${m === 3 ? ' 백일(생후 100일)도 이 시기에 들어갑니다.' : ''} 우리 아기 몸무게로 보려면 아래 표에서 찾거나 계산기에 넣으세요. 몸무게가 같아도 하루 횟수가 줄면 1회량이 늘어납니다.`)}
${m === 0 ? section('태어나서 1주까지', '1회 30~60ml · 2~3시간마다', FIRST) : ''}
${form(mid, kg)}
${section('몸무게별 1회량', `${mName(m)} · 하루 ${FM.FEEDS_TEXT[m]}`, kgTable(mid, m))}
${m === 5 ? section('이유식 시작 무렵', null, '<div class="doc"><p>보통 생후 4~6개월 사이에 이유식을 시작합니다. 처음에는 한두 숟가락이라 분유량은 그대로 두고, 이유식이 늘면서 분유 횟수가 줄어듭니다.</p></div>') : ''}
${ad()}
${section('알아두면 좋은 것', null, SIGNS)}
<div class="pager">${m > 0 ? `<a href="${fmUrl(m - 1)}">← ${mShort(m - 1)}</a>` : '<span></span>'}<a href="${fmUrl(m + 1)}">${mShort(m + 1)} →</a></div>
${m <= 1 ? section('주별로 보기', '생후 2개월까지', chipsWrap(FORMULA_WEEKS.map((w) => ({ label: `${w}주`, href: fwUrl(w) })))) : ''}
${section('개월별', null, chipsWrap(FORMULA_MONTHS.map((k) => ({ label: mShort(k), href: fmUrl(k), on: k === m }))))}
${section('이어서', null, list([{ href: `/baby/month/${m}/`, title: `아기 ${m === 0 ? '신생아' : `${m}개월`} 발달`, sub: '할 수 있는 것 · 잠 · 접종' }, { href: `/baby/percentile/boy/${m}/`, title: '아기 성장 백분위', sub: '몸무게가 또래 어디쯤' }, { href: '/baby/formula/', title: '분유 수유량 계산기', sub: '생년월일·몸무게로' }]))}
${NOTE}`;
    write(url, shell({ og: 'formula', url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
  }

  /* ---------- 개월별 6~12 (이유식과 함께) ---------- */
  for (const m of [6, 7, 8, 9, 10, 11, 12]) {
    const s = FM.SOLIDS[m], url = fmUrl(m);
    const d = FM.solidsDaily(m), f = s.feeds ? (s.feeds[0] === s.feeds[1] ? `${s.feeds[0]}회` : `${s.feeds[0]}~${s.feeds[1]}회`) : null;
    const title = m === 12 ? '돌 아기 분유 — 생우유 하루 400~500ml로 바꾸기, 밥 3회 + 간식 2회' : `${mName(m)} 분유량 — ${s.solids} + 분유 ${f}, 1회 180~240ml`;
    const desc = m === 12 ? '돌(12개월)이 지나면 분유 대신 생우유를 하루 400~500ml 정도 먹이고, 밥 3회와 간식 2회로 영양을 채웁니다. 젖병보다 컵으로.' : `${mName(m)} 아기는 ${s.solids}와 함께 분유를 하루 ${f}, 1회 180~240ml 정도 먹습니다(하루 ${num(d[0])}~${num(d[1])}ml). 이유식을 잘 먹을수록 분유는 줄어듭니다.`;
    const body = `
${crumb([['/baby/', '아기'], ['/baby/formula/', '분유 수유량'], [null, mShort(m)]])}
<h1 class="title">${m === 12 ? '돌 아기 분유와 우유' : `${mName(m)} 분유량`}</h1>
<p class="meta">${m === 12 ? '돌 무렵부터 생우유 · 하루 400~500ml' : `이유식과 함께 · 1회 180~240ml(미국소아과학회 6개월 무렵 기준) · 하루 960ml 이내`}</p>
${m === 12 ? tiles([{ label: '끼니', value: '밥 3회' }, { label: '간식', value: '2회' }, { label: '생우유', value: '400~500ml' }]) : tiles([{ label: '이유식', value: s.solids }, { label: '분유', value: f }, { label: '1회량', value: '180~240ml' }, { label: '하루 분유', value: `${num(d[0])}~${num(d[1])}ml` }])}
${lead(m === 12 ? '돌이 지나면 분유를 끊고 생우유(일반 우유)로 바꿉니다. 하루 400~500ml 정도면 충분하고, 너무 많이 마시면 밥을 덜 먹어 철분이 모자랄 수 있습니다. 젖병은 이 무렵부터 컵으로 바꿔 갑니다.' : `${mName(m)}에는 ${s.solids}를 먹으면서 분유를 하루 ${f} 먹습니다. 1회 180~240ml면 하루 ${num(d[0])}~${num(d[1])}ml이고, 이유식을 잘 먹는 날은 분유가 줄어도 괜찮습니다. 몸무게로 계산하는 규칙은 6개월까지이고, 이 시기부터는 이유식 양이 기준입니다.`)}
${m < 12 ? form(m + 0.5) : ''}
${section('이 시기 먹이기', null, `<div class="doc">${m === 12
  ? '<p><b>생우유는 데우지 않아도 됩니다.</b> 처음에는 분유와 섞거나 조금씩 늘려 적응시킵니다.</p><p><b>밥 3회 + 간식 2회.</b> 간식은 과일·유제품처럼 가볍게, 끼니 사이 2~3시간 간격이 좋습니다.</p>'
  : `<p><b>철분을 챙깁니다.</b> 6개월 무렵부터 몸에 모아 둔 철분이 줄어, 소고기처럼 철분이 많은 재료를 이유식에 넣습니다.</p><p><b>물은 조금씩.</b> 이유식을 먹기 시작하면 컵으로 물을 조금씩 줍니다.</p>${m >= 9 ? '<p><b>컵 연습.</b> 돌 전후로 젖병을 떼려면 이 무렵부터 컵에 분유나 물을 담아 연습합니다.</p>' : ''}`}</div>`)}
${ad()}
${section('알아두면 좋은 것', null, SIGNS)}
<div class="pager"><a href="${fmUrl(m - 1)}">← ${mShort(m - 1)}</a>${m < 12 ? `<a href="${fmUrl(m + 1)}">${mShort(m + 1)} →</a>` : '<span></span>'}</div>
${section('개월별', null, chipsWrap(FORMULA_MONTHS.map((k) => ({ label: mShort(k), href: fmUrl(k), on: k === m }))))}
${section('이어서', null, list([{ href: `/baby/month/${m}/`, title: `아기 ${m}개월 발달`, sub: '할 수 있는 것 · 먹이기 · 접종' }, { href: '/guide/baby-food/', title: '이유식 단계', sub: '서재' }, { href: '/baby/formula/', title: '분유 수유량 계산기', sub: '생년월일·몸무게로' }]))}
${NOTE}`;
    write(url, shell({ og: 'formula', url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
  }

  /* ---------- 주별 1~8주 ---------- */
  for (const w of FORMULA_WEEKS) {
    const months = w * 7 / 30.4375, m = Math.floor(months), kg = typKg(months), n = FM.feedsFor(months), daily = FM.dailyFor(kg), per = FM.r10(daily / n);
    const url = fwUrl(w);
    const title = `생후 ${w}주 아기 분유량 — 1회 약 ${per}ml · 하루 ${n}회 (몸무게별)`;
    const desc = `생후 ${w}주(${w * 7}일 무렵) 아기는 보통 ${kg}kg이고, 하루 약 ${num(daily)}ml를 ${n}회로 나눠 1회 ${per}ml 안팎을 먹습니다. 몸무게 1kg당 하루 165ml(미국소아과학회), 첫 주에는 1회 30~60ml.`;
    const body = `
${crumb([['/baby/', '아기'], ['/baby/formula/', '분유 수유량'], [null, `${w}주`]])}
<h1 class="title">생후 ${w}주 분유량</h1>
<p class="meta">생후 ${w * 7}일 무렵 · 보통 몸무게 ${kg}kg(WHO 50백분위 남녀 평균) · 1kg당 하루 165ml</p>
${tiles([{ label: '1회량', value: `${per}ml` }, { label: '하루 횟수', value: `${n}회` }, { label: '하루 총량', value: `${num(daily)}ml` }])}
${lead(`생후 ${w}주 아기의 보통 몸무게 ${kg}kg으로 계산하면 하루 약 <b>${num(daily)}ml</b>, 하루 ${n}회로 나누면 1회 <b>${per}ml</b> 안팎입니다. 첫 달 동안 1회량이 조금씩 늘어 한 달 무렵 90~120ml가 되는 흐름이면 괜찮습니다(미국소아과학회).`)}
${form(k1(months), kg)}
${section('몸무게별 1회량', `생후 ${w}주 · 하루 ${FM.FEEDS_TEXT[m]}`, kgTable(months, m))}
${ad()}
${section('알아두면 좋은 것', null, SIGNS)}
<div class="pager">${w > 1 ? `<a href="${fwUrl(w - 1)}">← ${w - 1}주</a>` : `<a href="${fmUrl(0)}">← 신생아</a>`}${w < 8 ? `<a href="${fwUrl(w + 1)}">${w + 1}주 →</a>` : `<a href="${fmUrl(2)}">2개월 →</a>`}</div>
${section('주별', null, chipsWrap(FORMULA_WEEKS.map((k) => ({ label: `${k}주`, href: fwUrl(k), on: k === w }))))}
${section('이어서', null, list([{ href: fmUrl(m), title: `${mName(m)} 분유량`, sub: '개월별 표' }, { href: '/baby/formula/', title: '분유 수유량 계산기', sub: '생년월일·몸무게로' }, { href: '/baby/percentile/', title: '아기 성장 백분위', sub: '몸무게가 또래 어디쯤' }]))}
${NOTE}`;
    write(url, shell({ og: 'formula', url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
  }

  /* ---------- 몸무게별 2.5~9kg ---------- */
  for (const k of FORMULA_KG) {
    const daily = FM.dailyFor(k), raw = Math.round(k * FM.ML_PER_KG), capped = k * FM.ML_PER_KG > FM.DAY_MAX;
    let tm = 0.25, best = Infinity; for (let x = 0.25; x < 6; x += 0.25) { const dd = Math.abs(typKg(x) - k); if (dd < best) { best = dd; tm = x; } }
    const n = FM.feedsFor(tm), per = FM.r10(daily / n), tmName = tm < 1 ? '신생아~1개월' : `${Math.floor(tm)}개월`;
    const url = fkUrl(k);
    const title = `${k}kg 아기 분유량 — 하루 약 ${num(daily)}ml, 1회 ${per}ml 안팎 (하루 ${n}회)`;
    const desc = `몸무게 ${k}kg 아기는 1kg당 하루 165ml로 계산하면 하루 약 ${num(daily)}ml${capped ? `(${num(raw)}ml지만 하루 960ml 이내로)` : ''}입니다. ${k}kg이 흔한 ${tmName} 무렵 하루 ${n}회면 1회 ${per}ml. 개월별 횟수에 따른 1회량 표.`;
    const body = `
${crumb([['/baby/', '아기'], ['/baby/formula/', '분유 수유량'], [null, `${k}kg`]])}
<h1 class="title">${k}kg 아기 분유량</h1>
<p class="meta">생후 6개월 전 · 1kg당 하루 165ml · 하루 960ml 이내(미국소아과학회)</p>
${tiles([{ label: '하루 총량', value: `${num(daily)}ml` }, { label: `1회 (${n}회면)`, value: `${per}ml` }, { label: '보통 이 몸무게', value: tmName }])}
${lead(`몸무게 ${k}kg이면 하루 약 <b>${num(daily)}ml</b>입니다${capped ? `. 몸무게로는 ${num(raw)}ml지만 미국소아과학회가 권하는 하루 960ml를 넘기지 않게 잡았습니다` : ''}. 몸무게가 같으면 하루 총량은 같고, 개월이 지나 횟수가 줄면 1회량이 늘어납니다. 이 몸무게는 보통 ${tmName} 무렵입니다.`)}
${k <= 3 ? '<p class="sub" style="margin-top:6px"><b>2.5kg 미만으로 태어났거나 미숙아였다면</b> 병원에서 정한 수유량과 간격을 먼저 따르세요.</p>' : ''}
${form(tm, k)}
${section('개월에 따라', `${k}kg · 하루 ${num(daily)}ml`, table(['개월', '하루 횟수', '1회량'], [0, 1, 2, 3, 4, 5].map((mm) => ({ cells: [`<a href="${fmUrl(mm)}">${mShort(mm)}</a>`, `${FM.FEEDS[mm]}회`, `${perAt(k, FM.FEEDS[mm])}ml`], cls: mm === Math.floor(tm) ? 'on' : '' }))))}
${ad()}
${section('알아두면 좋은 것', null, SIGNS)}
${section('다른 몸무게', null, chipsWrap(FORMULA_KG.map((x) => ({ label: `${x}kg`, href: fkUrl(x), on: x === k }))))}
${section('이어서', null, list([{ href: fmUrl(Math.floor(tm)), title: `${mName(Math.floor(tm))} 분유량`, sub: '개월별 표' }, { href: '/baby/formula/', title: '분유 수유량 계산기', sub: '생년월일·몸무게로' }, { href: '/baby/percentile/', title: '아기 성장 백분위', sub: `${k}kg이 또래 어디쯤` }]))}
${NOTE}`;
    write(url, shell({ og: 'formula', url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
  }

  /* ---------- 계산기 (허브) ---------- */
  const rows = FORMULA_MONTHS.map((m) => {
    if (m <= 5) { const kg = typKg(m + 0.5), d = FM.dailyFor(kg); return { cells: [`<a href="${fmUrl(m)}">${mShort(m)}</a>`, `${kg}kg`, FM.FEEDS_TEXT[m], `${FM.r10(d / FM.FEEDS[m])}ml`, `${num(d)}ml`] }; }
    const s = FM.SOLIDS[m], d = FM.solidsDaily(m);
    return { cells: [`<a href="${fmUrl(m)}">${mShort(m)}</a>`, '—', s.feeds ? `${s.feeds[0] === s.feeds[1] ? s.feeds[0] : `${s.feeds[0]}~${s.feeds[1]}`}회 + ${s.solids}` : s.solids, s.feeds ? '180~240ml' : '—', d ? `${num(d[0])}~${num(d[1])}ml` : '우유 400~500ml'] };
  });
  write('/baby/formula/', shell({ og: 'formula', url: '/baby/formula/', title: '분유 수유량 계산기 — 개월·몸무게로 1회량과 하루 총량 (신생아~돌)', desc: '아기 생년월일(또는 개월)과 몸무게를 넣으면 하루 분유 총량, 1회량, 하루 횟수가 나옵니다. 몸무게 1kg당 하루 165ml, 하루 960ml 이내(미국소아과학회). 신생아·주별·개월별·몸무게별 표.', nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/baby/', '아기'], [null, '분유 수유량']])}
<h1 class="title">분유 수유량</h1>
<p class="meta">미국소아과학회(AAP) · 미국 CDC 기준 · 신생아부터 돌까지</p>
${form(2.5, 5.6)}
${lead('생후 6개월까지는 몸무게로 하루 총량을 잡습니다. 1kg당 하루 약 165ml이고, 하루 960ml를 넘기지 않습니다. 하루 총량을 수유 횟수로 나누면 1회량입니다. 태어나서 1주까지는 1회 30~60ml로 시작하고, 6개월부터는 이유식이 늘면서 분유가 줄어듭니다.')}
${section('개월별 한눈에', '6개월 전은 보통 몸무게 기준', table(['개월', '보통 몸무게', '하루 횟수', '1회량', '하루 총량'], rows))}
${section('주별', '생후 2개월까지', chipsWrap(FORMULA_WEEKS.map((w) => ({ label: `${w}주`, href: fwUrl(w) }))))}
${section('몸무게별', '생후 6개월 전', chipsWrap(FORMULA_KG.map((k) => ({ label: `${k}kg`, href: fkUrl(k) }))))}
${ad()}
${section('신생아 첫 주', '1회 30~60ml · 2~3시간마다', FIRST)}
${section('알아두면 좋은 것', null, SIGNS)}
${section('이어서', null, list([{ href: '/baby/', title: '아기 개월수 · 예방접종', sub: '생년월일로 오늘 몇 개월' }, { href: '/baby/percentile/', title: '아기 성장 백분위', sub: '몸무게가 또래 어디쯤' }, { href: '/guide/baby-food/', title: '이유식 단계', sub: '서재' }]))}
${NOTE}` }));
}
