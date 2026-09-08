/* 추가 페이지 2 — 아기 카드 · 성장 백분위 · 카페인 · 금연 */
import * as D from '../engine/dates.mjs';
import * as X from '../engine/extra.mjs';
import * as G from '../engine/growth.mjs';
import { num } from '../engine/fmt.mjs';
import { MONTHS as BM } from '../data/baby-months.mjs';

export const PCT_MONTHS = []; for (let m = 0; m <= 36; m++) PCT_MONTHS.push(m);
export const CAFFEINE_PAGES = ['americano', 'mix', 'canned', 'energy', 'cola', 'green-tea'];
export const CAFFEINE_COUNTS = [1, 2, 3, 4, 5];
export const QUIT_DAYS = [1, 3, 7, 14, 30, 60, 90, 100, 180, 365, 730, 1000, 1825, 3650];

export function buildMore(ctx) {
  const { write, shell, crumb, tiles, list, section, table, lead, ad, TODAY } = ctx;
  const wrapChips = (items) => `<div class="chips" style="flex-wrap:wrap;overflow:visible">${items.map((c) => c.on ? `<span class="chip on" style="min-width:0;padding:4px 9px">${c.label}</span>` : `<a class="chip" style="min-width:0;padding:4px 9px" href="${c.href}">${c.label}</a>`).join('')}</div>`;
  const NOTE = (s) => `<p class="note">${s} <a href="/method/">계산 기준 보기</a></p>`;

  /* ---------- 아기 100일·돌 카드 ---------- */
  write('/baby/card/', shell({ og: 'babycard', url: '/baby/card/', title: '아기 100일·200일·첫돌 카드 만들기 — 생일로 D+day 이미지 (카톡·인스타 공유)', desc: '아기 생년월일과 이름을 넣으면 오늘 D+며칠, 개월수, 다음 기념일(50일·100일·200일·첫돌)까지 남은 날이 들어간 카드 이미지가 만들어집니다. 저장하거나 카카오톡·인스타그램으로 바로 공유.', nav: 'baby', scripts: ['/js/engine.js', '/js/baby-card.js'], body: `
${crumb([['/baby/', '아기'], [null, '100일·돌 카드']])}
<h1 class="title">아기 100일·돌 카드</h1>
<p class="meta">D+day · 개월수 · 다음 기념일 · 카드는 이 기기 안에서만 만들어집니다</p>
<form class="quick live" data-live="babycard" style="margin-top:14px">
<div class="live-head"><b>카드 만들기</b><span>바꾸면 바로 다시 그립니다</span></div>
<div class="ye-grid">
<label class="ye-f"><span>생년월일</span><input data-k="birth" type="date" value=""></label>
<label class="ye-f"><span>이름·태명 (선택)</span><input data-k="name" type="text" maxlength="12" placeholder="예: 서준이" autocomplete="off"></label>
<label class="ye-f"><span>색</span><select data-k="theme"><option value="hanji">한지 (밝은 크림)</option><option value="teal">청록</option><option value="coral">산호</option><option value="ink">먹 (어두운)</option></select></label>
<label class="ye-f"><span>비율</span><select data-k="size"><option value="tall">세로 4:5 (인스타·카톡)</option><option value="square">정사각 1:1</option></select></label>
</div>
<p class="sub" style="margin-top:10px" data-out="hint"></p>
<div class="card-prev"><img id="card-img" alt="아기 기념일 카드 미리보기"><canvas id="card-canvas" hidden></canvas></div>
<div class="btn-row"><button type="button" class="btn" data-act="save">이미지 저장</button><button type="button" class="btn btn-share" data-act="share">바로 공유</button></div>
<p class="cal-how">100일·첫돌 당일에는 큰 글씨가 "100일", "첫돌"로 바뀝니다. 저장이 안 되면 카드를 길게 눌러 "이미지 저장"을 고르세요.</p>
</form>
${lead('생일만 넣으면 오늘 태어난 지 며칠째인지(D+), 몇 개월 며칠인지, 다음 기념일까지 며칠 남았는지가 카드 한 장에 들어갑니다. 50일·100일·200일·300일·첫돌·500일·두돌·1000일·세돌을 챙깁니다.')}
${section('이렇게 써 보세요', null, `<div class="doc">
<p><b>기념일 아침에 한 장.</b> 100일 당일에 만들면 "100일"이 크게 나옵니다. 가족 단톡방과 인스타에 같은 카드를 올리면 됩니다.</p>
<p><b>매달 같은 날.</b> 태어난 날짜마다 카드를 만들어 모으면 개월별 성장 기록이 됩니다. 이름을 넣어 두면 카드마다 붙습니다.</p>
</div>`)}
${ad()}
${section('이어서', null, list([{ href: '/baby/', title: '아기 개월수 · 예방접종 캘린더', sub: '접종 날짜를 캘린더에' }, { href: '/baby/percentile/', title: '아기 성장 백분위', sub: '몸무게·키·머리둘레가 또래 어디쯤' }, { href: '/pregnancy/card/', title: '임신 디데이 카드', sub: '태어나기 전에는 이쪽' }]))}
<p class="note">100일은 태어난 날을 1일로 세어 100일째(생후 99일 뒤)이고, 돌은 달력상 같은 날짜입니다. 카드 이미지는 브라우저 안에서 그려지며 서버로 전송되지 않습니다.</p>` }));

  /* ---------- 아기 성장 백분위 ---------- */
  const pctUrl = (sex, m) => `/baby/percentile/${sex === 'f' ? 'girl' : 'boy'}/${m}/`;
  const sexName = (s) => s === 'f' ? '여아' : '남아';
  const pctForm = (sex, m) => `<form class="quick live" data-live="percentile" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>WHO 표준 · 질병관리청 성장도표</span></div><div class="ye-grid"><label class="ye-f"><span>성별</span><select data-k="sex"><option value="m"${sex === 'm' ? ' selected' : ''}>남아</option><option value="f"${sex === 'f' ? ' selected' : ''}>여아</option></select></label><label class="ye-f"><span>생년월일 (넣으면 개월 자동)</span><input data-k="birth" type="date" value=""></label><label class="ye-f"><span>개월수</span><input data-k="month" type="text" inputmode="decimal" value="${m}"></label><label class="ye-f"><span>몸무게 (kg)</span><input data-k="w" type="text" inputmode="decimal" value=""></label><label class="ye-f"><span>키 (cm)</span><input data-k="h" type="text" inputmode="decimal" value=""></label><label class="ye-f"><span>머리둘레 (cm)</span><input data-k="hc" type="text" inputmode="decimal" value=""></label></div><div class="tiles"><div class="tile"><small>몸무게 백분위</small><span class="num" data-out="wp">—</span></div><div class="tile"><small>키 백분위</small><span class="num" data-out="hp">—</span></div><div class="tile"><small>머리둘레 백분위</small><span class="num" data-out="hcp">—</span></div></div><p class="sub" style="margin-top:8px" data-out="note"></p><div class="live-foot"><a data-out="link" href="/baby/percentile/">이 개월의 백분위표 →</a></div></form>`;
  for (const sex of ['m', 'f']) for (const m of PCT_MONTHS) {
    const url = pctUrl(sex, m);
    const W = G.percentileRow('weight', sex, m), H = G.percentileRow('length', sex, m), HC = G.percentileRow('head', sex, m);
    const med = (r) => r.find((x) => x[0] === 50)[1], lo = (r) => r[0][1], hi = (r) => r[r.length - 1][1];
    const title = `${sexName(sex)} ${m}개월 몸무게·키 백분위표 — 50백분위 ${med(W)}kg · ${med(H)}cm, 3~97백분위 범위`;
    const desc = `${sexName(sex)} ${m}개월 50백분위는 몸무게 ${med(W)}kg·키 ${med(H)}cm, 정상 범위(3~97백분위)는 몸무게 ${lo(W)}~${hi(W)}kg·키 ${lo(H)}~${hi(H)}cm. WHO·질병관리청 성장도표 기준, 내 아기 수치를 넣으면 백분위가 바로.`;
    const prev = m > 0 ? [pctUrl(sex, m - 1), `${m - 1}개월`] : null, next = m < 36 ? [pctUrl(sex, m + 1), `${m + 1}개월`] : null;
    const dev = BM.reduce((a, x) => m >= x.m ? x : a, BM[0]);
    const body = `
${crumb([['/baby/', '아기'], ['/baby/percentile/', '성장 백분위'], [null, `${sexName(sex)} ${m}개월`]])}
<h1 class="title">${sexName(sex)} ${m}개월 성장 백분위</h1>
<p class="meta">WHO 아동 성장 표준(2006) · 질병관리청 2017 성장도표 0~35개월 기준 · ${m === 36 ? '36개월은 WHO 참고값' : '개월은 만 개월'}</p>
${tiles([{ label: '몸무게 50백분위', value: `${med(W)}kg` }, { label: '키 50백분위', value: `${med(H)}cm` }, { label: '머리둘레 50백분위', value: `${med(HC)}cm` }])}
${lead(`${sexName(sex)} ${m}개월의 한가운데(50백분위)는 몸무게 <b>${med(W)}kg</b>, 키 <b>${med(H)}cm</b>입니다. 3백분위(${lo(W)}kg·${lo(H)}cm)부터 97백분위(${hi(W)}kg·${hi(H)}cm)까지는 모두 정상 범위이고, 백분위는 또래 100명을 작은 순으로 세웠을 때 몇 번째인지를 뜻합니다(97백분위면 97명보다 큼). 내 아기 수치를 넣으면 정확한 백분위가 나옵니다.`)}
${pctForm(sex, m)}
${section('백분위표', `${sexName(sex)} ${m}개월`, table(['백분위', '몸무게 (kg)', '키 (cm)', '머리둘레 (cm)'], G.PCTS.map((p, i) => ({ cells: [`${p}`, String(W[i][1]), String(H[i][1]), String(HC[i][1])], cls: p === 50 ? 'on' : '' }))))}
${ad()}
${section('이 시기 발달', null, `<div class="doc"><p>${dev.dev}</p><p>먹이기 ${dev.feed} · 잠 ${dev.sleep}</p></div>`)}
<div class="pager">${prev ? `<a href="${prev[0]}">← ${prev[1]}</a>` : '<span></span>'}${next ? `<a href="${next[0]}">${next[1]} →</a>` : '<span></span>'}</div>
${section('개월별', sexName(sex), wrapChips(PCT_MONTHS.map((k) => ({ label: `${k}`, href: pctUrl(sex, k), on: k === m }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>백분위 숫자보다 곡선이 중요합니다.</b> 25백분위든 75백분위든 자기 곡선을 따라 자라면 정상입니다. 두 구간(예: 75 → 25) 이상 떨어지거나 오르면 소아과에 물어보세요.</p>
<p><b>3백분위 미만·97백분위 초과</b>는 병이 아니라 "한 번 확인하자"는 신호입니다. 부모 키, 출생 체중, 미숙아 여부(교정 연령)를 함께 봅니다.</p>
<p><b>재는 법.</b> 몸무게는 기저귀를 벗기고, 키는 24개월 전에는 눕혀서(누운 키), 이후는 세워서(선 키) 잽니다. 머리둘레는 눈썹 위~뒤통수 가장 튀어나온 곳.</p>
</div>`)}
${section('이어서', null, list([{ href: pctUrl(sex === 'm' ? 'f' : 'm', m), title: `${sexName(sex === 'm' ? 'f' : 'm')} ${m}개월 백분위`, sub: '' }, { href: `/baby/month/${dev.m}/`, title: `아기 ${dev.m === 0 ? '신생아' : `${dev.m}개월`} 발달`, sub: '할 수 있는 것 · 돌봄' }, { href: '/baby/', title: '아기 개월수 · 예방접종', sub: '생일로' }]))}
${NOTE('WHO Child Growth Standards(2006) LMS 값으로 계산합니다. 질병관리청 2017 소아청소년 성장도표는 0~35개월에 같은 표준을 씁니다. 백분위는 참고용이며 진단은 소아과에서.')}`;
    write(url, shell({ og: 'percentile', url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
  }
  write('/baby/percentile/', shell({ og: 'percentile', url: '/baby/percentile/', title: '아기 성장 백분위 계산기 — 몸무게·키·머리둘레가 또래 어디쯤 (WHO·질병관리청 성장도표)', desc: '성별·개월·몸무게·키·머리둘레를 넣으면 백분위와 판정이 바로 나옵니다. 남아·여아 0~36개월 백분위표(3·5·10·25·50·75·90·95·97).', nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/baby/', '아기'], [null, '성장 백분위']])}
<h1 class="title">아기 성장 백분위</h1>
<p class="meta">WHO 아동 성장 표준 · 질병관리청 2017 성장도표 0~35개월 · 남아·여아</p>
${pctForm('m', 6)}
${lead('백분위는 같은 성별·개월의 아기 100명을 작은 순으로 세웠을 때 몇 번째인지입니다(75백분위면 75명보다 큼). 50이 한가운데, 3~97 사이면 정상 범위입니다. 생년월일을 넣으면 개월이 자동으로 계산되고, 개월을 누르면 남아·여아 백분위표가 나옵니다.')}
${section('남아 개월별 표', null, wrapChips(PCT_MONTHS.map((k) => ({ label: `${k}`, href: pctUrl('m', k) }))))}
${section('여아 개월별 표', null, wrapChips(PCT_MONTHS.map((k) => ({ label: `${k}`, href: pctUrl('f', k) }))))}
${ad()}
${section('50백분위 한눈에', '몸무게 kg · 키 cm', table(['개월', '남아 몸무게', '남아 키', '여아 몸무게', '여아 키'], [0, 1, 2, 3, 4, 5, 6, 9, 12, 18, 24, 30, 36].map((k) => ({ cells: [`<a href="${pctUrl('m', k)}">${k}</a>`, String(G.round('weight', G.valueAt('weight', 'm', k, 0))), String(G.round('length', G.valueAt('length', 'm', k, 0))), String(G.round('weight', G.valueAt('weight', 'f', k, 0))), String(G.round('length', G.valueAt('length', 'f', k, 0)))] }))))}
${section('이어서', null, list([{ href: '/baby/month/', title: '아기 개월별 발달', sub: '할 수 있는 것 · 수유 · 수면' }, { href: '/child-height/', title: '아이 예상 키', sub: '부모 키로' }, { href: '/baby/card/', title: '아기 100일·돌 카드', sub: '공유용 이미지' }]))}` }));

  /* ---------- 카페인 ---------- */
  const CF = Object.fromEntries(X.CAFFEINE.map((c) => [c.key, c]));
  const CU = { americano: ['아메리카노', '잔'], mix: ['믹스커피', '봉'], canned: ['캔커피', '캔'], energy: ['에너지드링크', '캔'], cola: ['콜라', '캔'], 'green-tea': ['녹차', '잔'] };
  const cName = (k, n) => `${CU[k][0]} ${n}${CU[k][1]}`;
  const cafUrl = (k, n) => `/caffeine/${k}/${n}/`;
  const cafForm = (k, n) => `<form class="quick live" data-live="caffeine" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>오늘 마신 것</span></div><div class="ye-grid">${X.CAFFEINE.slice(0, 8).map((c) => `<label class="ye-f"><span>${c.label}</span><input data-k="c-${c.key}" type="text" inputmode="numeric" value="${c.key === k ? n : 0}"></label>`).join('')}<label class="ye-f"><span>기준</span><select data-k="limit"><option value="400">성인 400mg</option><option value="300">임신·수유 300mg</option><option value="teen">청소년 (몸무게 × 2.5mg)</option></select></label><label class="ye-f"><span>몸무게 (청소년 기준용)</span><input data-k="kg" type="text" inputmode="numeric" value="50"></label><label class="ye-f"><span>마지막 잔 시각</span><input data-k="last" type="time" value="14:00"></label><label class="ye-f"><span>잘 시각</span><input data-k="bed" type="time" value="23:00"></label></div><div class="tiles"><div class="tile"><small>오늘 카페인</small><span class="num" data-out="total"></span></div><div class="tile"><small>기준 대비</small><span class="num" data-out="ratio"></span></div><div class="tile"><small>잘 때 남은 양</small><span class="num" data-out="left"></span></div></div><p class="sub" style="margin-top:8px" data-out="note"></p></form>`;
  for (const k of CAFFEINE_PAGES) for (const n of CAFFEINE_COUNTS) {
    const c = CF[k], url = cafUrl(k, n), mg = c.mg * n, left9 = X.caffeineLeft(mg, 9);
    const title = `${cName(k, n)} 카페인 — ${mg}mg, 성인 하루 기준 400mg의 ${Math.round(mg / 400 * 100)}% (임신 300mg)`;
    const desc = `${cName(k, n)}(${c.label})의 카페인은 약 ${mg}mg입니다. 성인 하루 권고 400mg의 ${Math.round(mg / 400 * 100)}%, 임신·수유 중 300mg의 ${Math.round(mg / 300 * 100)}%. 오후 2시에 마셨다면 밤 11시에 ${left9}mg이 남습니다(반감기 5시간).`;
    const body = `
${crumb([['/caffeine/', '카페인'], [null, cName(k, n)]])}
<h1 class="title">${cName(k, n)}</h1>
<p class="meta">${c.label} · 1${CU[k][1]}당 약 ${c.mg}mg · 반감기 약 5시간</p>
${tiles([{ label: '카페인', value: `${mg}mg` }, { label: '성인 400mg 대비', value: `${Math.round(mg / 400 * 100)}%` }, { label: '임신 300mg 대비', value: `${Math.round(mg / 300 * 100)}%` }])}
${lead(`${cName(k, n)}에는 카페인이 약 <b>${mg}mg</b> 들어 있습니다. 식약처 성인 하루 최대 섭취 권고량 400mg의 ${Math.round(mg / 400 * 100)}%${mg > 400 ? '로 기준을 넘습니다' : '입니다'}. 카페인은 5시간마다 절반씩 줄어, 오후 2시에 마셨다면 밤 11시에도 ${left9}mg이 남아 있습니다.`)}
${cafForm(k, n)}
${section('시간이 지나면', `${mg}mg · 반감기 5시간`, table(['지난 시간', '남은 카페인'], [0, 3, 5, 8, 10, 12, 15].map((h) => ({ cells: [h === 0 ? '마신 직후' : `${h}시간 뒤`, `${X.caffeineLeft(mg, h)}mg`] }))))}
${ad()}
${section('다른 양', null, wrapChips(CAFFEINE_COUNTS.map((x) => ({ label: `${x}${CU[k][1]}`, href: cafUrl(k, x), on: x === n }))))}
${section('다른 음료', `${n}${CU[k][1]}`, wrapChips(CAFFEINE_PAGES.filter((x) => x !== k).map((x) => ({ label: cName(x, n), href: cafUrl(x, n) }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>기준.</b> 식약처 하루 최대 섭취 권고량은 성인 400mg, 임산부 300mg, 어린이·청소년은 몸무게 1kg당 2.5mg(50kg이면 125mg)입니다.</p>
<p><b>잠에 영향을 주지 않으려면 자기 6시간 전까지.</b> 6시간 뒤에도 절반 가까이 남아 있어, 밤 11시에 자려면 오후 5시 이후 카페인은 피하는 것이 좋습니다. 카페인 대사가 느린 사람은 더 일찍 끊어야 합니다.</p>
<p><b>같은 아메리카노도 매장마다 다릅니다.</b> 샷 수와 원두에 따라 75~200mg까지 벌어집니다. 여기 값은 대표적인 매장 톨 사이즈 기준입니다.</p>
</div>`)}
${section('이어서', null, list([{ href: `/food/${k === 'americano' ? 'americano' : k === 'mix' ? 'mixed-coffee' : k === 'cola' ? 'cola' : 'americano'}/`, title: '음료 칼로리', sub: '음식 칼로리 사전' }, { href: '/sleep/', title: '몇 시에 자야 할까', sub: '수면 주기 계산' }, { href: '/water/', title: '하루 물 섭취량', sub: '커피도 수분에 포함' }]))}
${NOTE('카페인 함량은 식약처 식품영양성분 DB와 주요 매장 공개 자료의 대표값이며 제품마다 다릅니다. 반감기 5시간은 성인 평균(3~7시간)입니다.')}`;
    write(url, shell({ og: 'caffeine', url, title, desc, body, nav: 'food', scripts: ['/js/engine.js', '/js/live.js'] }));
  }
  write('/caffeine/', shell({ og: 'caffeine', url: '/caffeine/', title: '카페인 계산기 — 오늘 마신 커피·에너지드링크 카페인과 잘 때 남는 양 (성인 400mg·임신 300mg)', desc: '아메리카노·믹스커피·캔커피·에너지드링크·콜라·녹차를 잔 수로 넣으면 오늘 카페인 총량, 기준 대비 비율, 잠자리에 들 때 남은 양이 나옵니다. 음료별 카페인표.', nav: 'food', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/food/', '칼로리'], [null, '카페인']])}
<h1 class="title">오늘 카페인 얼마나</h1>
<p class="meta">성인 400mg · 임신 300mg · 청소년 몸무게 × 2.5mg · 반감기 5시간</p>
${cafForm('americano', 2)}
${lead('아메리카노 두 잔이면 300mg으로 성인 기준의 4분의 3입니다. 마신 잔 수를 넣으면 총량과 기준 대비 비율, 잘 시각에 남아 있을 카페인이 나옵니다.')}
${section('음료별 카페인', '1잔 · mg', table(['음료', '카페인', '400mg까지'], X.CAFFEINE.map((c) => ({ cells: [CAFFEINE_PAGES.includes(c.key) ? `<a href="${cafUrl(c.key, 1)}">${c.label}</a>` : c.label, `${c.mg}mg`, `${Math.floor(400 / c.mg)}잔`] }))))}
${ad()}
${section('이어서', null, list([{ href: '/sleep/', title: '몇 시에 자야 할까', sub: '수면 주기' }, { href: '/food/', title: '음식 칼로리 사전', sub: '커피 칼로리' }, { href: '/pregnancy/week/', title: '임신 주차별 안내', sub: '임신 중 카페인 300mg' }]))}` }));

  /* ---------- 금연 ---------- */
  const quitUrl = (d) => `/quit-smoking/${d}/`;
  const quitForm = (days) => `<form class="quick live" data-live="quit" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>끊은 날부터 오늘까지</span></div><div class="ye-grid"><label class="ye-f"><span>끊은 날</span><input data-k="date" type="date" value="${D.iso(D.addDays(TODAY, -days))}"></label><label class="ye-f"><span>하루 개비</span><input data-k="per" type="text" inputmode="numeric" value="20"></label><label class="ye-f"><span>한 갑 가격 (원)</span><input data-k="price" type="text" inputmode="numeric" value="4500"></label></div><div class="tiles"><div class="tile"><small>끊은 지</small><span class="num" data-out="days"></span></div><div class="tile"><small>안 피운 담배</small><span class="num" data-out="cigs"></span></div><div class="tile"><small>모은 돈</small><span class="num" data-out="money"></span></div></div><div class="tiles"><div class="tile"><small>되찾은 시간 (개비당 20분)</small><span class="num" data-out="life"></span></div><div class="tile"><small>몸의 변화</small><span class="num" data-out="stage"></span></div><div class="tile"><small>1년이면</small><span class="num" data-out="year"></span></div></div></form>`;
  for (const d of QUIT_DAYS) {
    const url = quitUrl(d), q = X.quitStats(d, 20, 4500), st = X.quitStage(d);
    const title = `금연 ${d}일 — 하루 한 갑이면 ${num(q.cigs)}개비, ${num(q.money)}원 아낌 · 몸의 변화: ${st.text.replace(/\.$/, '')}`;
    const desc = `담배를 끊은 지 ${d}일이면 하루 한 갑 기준 ${num(q.cigs)}개비를 안 피웠고 ${num(q.money)}원을 모았습니다. 되찾은 시간 약 ${q.lifeText}. 이 시기 몸의 변화: ${st.text}`;
    const body = `
${crumb([['/quit-smoking/', '금연'], [null, `${d}일`]])}
<h1 class="title">금연 ${d}일째</h1>
<p class="meta">하루 한 갑(20개비) · 4,500원 기준 · 개비당 20분(UCL 2024)</p>
${tiles([{ label: '안 피운 담배', value: `${num(q.cigs)}개비` }, { label: '모은 돈', value: `${num(q.money)}원` }, { label: '되찾은 시간', value: q.lifeText }])}
${lead(`끊은 지 <b>${d}일</b>이면 하루 한 갑 기준 ${num(q.cigs)}개비를 안 피웠고 <b>${num(q.money)}원</b>을 아꼈습니다. 담배 한 개비가 수명을 약 20분 줄인다는 계산으로는 ${q.lifeText}을 되찾았습니다. 지금 몸에서는 <b>${st.label}</b> — ${st.text}`)}
${quitForm(d)}
${section('몸의 변화', '금연 뒤 시간 순', table(['시점', '변화'], X.QUIT_STAGES.map((s) => ({ cells: [s.label, s.text], cls: s === st ? 'on' : '' }))))}
${ad()}
${section('날짜별', null, wrapChips(QUIT_DAYS.map((x) => ({ label: `${x}일`, href: quitUrl(x), on: x === d }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>가장 힘든 때는 3일째와 2주째.</b> 니코틴 금단은 72시간에 정점이고 2~4주면 크게 가라앉습니다. 이 페이지의 숫자를 보는 것이 그 시간을 버티는 방법 중 하나입니다.</p>
<p><b>보건소 금연클리닉은 무료.</b> 6개월 동안 상담과 니코틴 패치·껌을 지원하고, 병원 금연치료(8~12주 프로그램)는 건강보험공단이 비용을 지원합니다. 금연상담전화 1544-9030.</p>
<p><b>한 대 피웠다고 실패가 아닙니다.</b> 여러 번(평균 6~7번 이상) 시도 끝에 성공하는 것이 보통입니다. 날짜를 다시 넣고 이어 가세요.</p>
</div>`)}
${section('이어서', null, list([{ href: '/bmr/', title: '기초대사량', sub: '금연 뒤 체중 관리' }, { href: '/steps/', title: '걸음 수 칼로리', sub: '흡연 욕구가 올 때 10분 걷기' }, { href: 'https://donpyo.com/goal/', title: '모은 돈으로 목표 저축 (돈표)', sub: '자매 사이트' }]))}
${NOTE('되찾은 시간은 개비당 약 20분(University College London, 2024)이며 통계적 추정입니다. 몸의 변화 시점은 미국 폐협회(ALA)·보건복지부 금연길라잡이의 일반 안내입니다.')}`;
    write(url, shell({ og: 'quit', url, title, desc, body, nav: 'bmr', scripts: ['/js/engine.js', '/js/live.js'] }));
  }
  write('/quit-smoking/', shell({ og: 'quit', url: '/quit-smoking/', title: '금연 계산기 — 끊은 지 며칠, 안 피운 담배·모은 돈·되찾은 시간과 몸의 변화', desc: '담배 끊은 날짜와 하루 개비 수를 넣으면 안 피운 담배, 모은 돈, 되찾은 시간, 지금 몸에서 일어나는 변화가 나옵니다. 1일부터 10년까지 날짜별 표.', nav: 'bmr', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/', '홈'], [null, '금연']])}
<h1 class="title">담배 끊은 지</h1>
<p class="meta">안 피운 담배 · 모은 돈 · 되찾은 시간 · 몸의 변화</p>
${quitForm(30)}
${lead('끊은 날짜를 넣으면 오늘까지 안 피운 개비 수와 모은 돈, 개비당 20분으로 계산한 되찾은 시간, 지금 몸에서 일어나고 있는 회복 단계가 나옵니다. 날짜를 누르면 그 시점의 자세한 설명이 있습니다.')}
${section('날짜별', '하루 한 갑 · 4,500원', table(['금연', '안 피운 담배', '모은 돈', '몸의 변화'], QUIT_DAYS.map((d) => { const q = X.quitStats(d, 20, 4500); return { cells: [`<a href="${quitUrl(d)}">${d}일</a>`, `${num(q.cigs)}개비`, `${num(q.money)}원`, X.quitStage(d).text.replace(/\.$/, '')] }; })))}
${ad()}
${section('이어서', null, list([{ href: '/bmr/', title: '기초대사량', sub: '금연 뒤 체중 관리' }, { href: '/alcohol/', title: '혈중알코올농도', sub: '술자리가 고비' }]))}` }));
}
