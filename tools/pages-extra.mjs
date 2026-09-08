/* 추가 페이지 — 서재(guide) · 임신 주차 · 아기 개월별 발달 · 걸음 수 · 수면 · 아이 키 · 혈중알코올 · 다이어트 기간 · 나이별 권장 칼로리
 * build.mjs 가 조각 함수를 ctx 로 넘겨 호출한다 */
import * as B from '../engine/body.mjs';
import * as K from '../engine/kcal.mjs';
import * as D from '../engine/dates.mjs';
import * as X from '../engine/extra.mjs';
import { num } from '../engine/fmt.mjs';
import { FOODS } from '../data/foods.mjs';
import { EXERCISES } from '../data/exercises.mjs';
import { WEEKS } from '../data/pregnancy-weeks.mjs';
import { MONTHS as BM } from '../data/baby-months.mjs';
import { GUIDES } from '../data/guides.mjs';

export const STEPS = []; for (let s = 1000; s <= 30000; s += 1000) STEPS.push(s);
export const WAKES = []; for (let m = 5 * 60; m <= 10 * 60; m += 30) WAKES.push(m);
export const FATHERS = []; for (let h = 160; h <= 190; h++) FATHERS.push(h);
export const MOTHERS = []; for (let h = 150; h <= 175; h++) MOTHERS.push(h);
export const DIET_KG = []; for (let k = 1; k <= 30; k++) DIET_KG.push(k);
export const DRINK_PAGES = ['soju', 'beer', 'makgeolli', 'wine'];
export const DRINK_COUNTS = [1, 2, 3, 4, 5];
export const BABY_MONTHS = BM.map((x) => x.m);
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const slot = (min) => hhmm(min).replace(':', '-');
const EX = Object.fromEntries(EXERCISES.map((e) => [e.slug, e]));
const wk = (w) => w <= 13 ? 1 : w <= 27 ? 2 : 3;

export function buildExtra(ctx) {
  const { write, shell, crumb, tiles, list, section, table, lead, ad, TODAY, SISTERS, babyMin } = ctx;
  const pager = (prev, next) => `<div class="pager">${prev ? `<a href="${prev[0]}">← ${prev[1]}</a>` : '<span></span>'}${next ? `<a href="${next[0]}">${next[1]} →</a>` : '<span></span>'}</div>`;
  const wrapChips = (items) => `<div class="chips" style="flex-wrap:wrap;overflow:visible">${items.map((c) => c.on ? `<span class="chip on" style="min-width:0;padding:4px 9px">${c.label}</span>` : `<a class="chip" style="min-width:0;padding:4px 9px" href="${c.href}">${c.label}</a>`).join('')}</div>`;
  const NOTE = (s) => `<p class="note">${s} <a href="/method/">계산 기준 보기</a></p>`;

  /* ---------- 서재 ---------- */
  for (const g of GUIDES) {
    const url = `/guide/${g.slug}/`;
    const others = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 4);
    const chars = g.body.replace(/<[^>]+>/g, '').length;
    const body = `
${crumb([['/guide/', '서재'], [null, g.title.split(' — ')[0]]])}
<h1 class="title">${g.title}</h1>
<p class="meta">읽는 시간 약 ${Math.max(1, Math.round(chars / 500))}분 · 갱신 ${D.iso(TODAY)}</p>
<div class="doc">${g.body}</div>
${ad()}
${section('다른 글', null, list(others.map((o) => ({ href: `/guide/${o.slug}/`, title: o.title.split(' — ')[0], sub: o.desc.length > 60 ? o.desc.slice(0, 60) + '…' : o.desc }))))}
<p class="note">이 글은 공개된 의학 기준과 공식을 풀어 쓴 참고 정보이며 진단·치료를 대신하지 않습니다. 건강 문제는 의사와 상의하세요.</p>`;
    write(url, shell({ url, title: `${g.title} — 몸자 서재`, desc: g.desc, body, nav: 'guide', ld: { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.desc, inLanguage: 'ko', dateModified: D.iso(TODAY), author: { '@type': 'Organization', name: '몸자' }, publisher: { '@type': 'Organization', name: '몸자' }, mainEntityOfPage: `https://momja.com${url}` } }));
  }
  write('/guide/', shell({ url: '/guide/', title: '서재 — 몸 계산의 기준을 풀어 쓴 글 (BMI·대사량·체지방·임신·예방접종·수면·음주)', desc: 'BMI 한국 기준이 다른 이유, 기초대사량과 다이어트, 줄자로 재는 체지방률, 임신 주수 세는 법, 아기 예방접종 일정, 물 섭취량, 수면 주기, 아이 키 예측, 혈중알코올농도 계산법.', nav: 'guide', body: `
${crumb([['/', '홈'], [null, '서재']])}
<h1 class="title">서재</h1>
<p class="meta">계산기 뒤에 있는 기준과 공식을 풀어 쓴 글 · ${GUIDES.length}편</p>
${lead('"왜 한국은 BMI 23부터 과체중인가", "기초대사량보다 적게 먹으면 왜 안 빠지나" 같은, 숫자만 봐서는 풀리지 않는 질문을 하나씩 정리했습니다. 각 글 끝에 관련 계산기를 연결해 두었습니다.')}
${section('글', null, list(GUIDES.map((g) => ({ href: `/guide/${g.slug}/`, title: g.title.split(' — ')[0], sub: g.desc.length > 70 ? g.desc.slice(0, 70) + '…' : g.desc }))))}
${ad()}` }));

  /* ---------- 임신 주차 ---------- */
  const weekUrl = (w) => `/pregnancy/week/${w}/`;
  for (const x of WEEKS) {
    const w = x.w, url = weekUrl(w);
    const lmp = D.addDays(TODAY, -7 * w), due = D.addDays(lmp, 280), left = D.diffDays(TODAY, due);
    const prev = w > 1 ? [weekUrl(w - 1), `${w - 1}주`] : null, next = w < 42 ? [weekUrl(w + 1), `${w + 1}주`] : null;
    const sizeText = x.size !== '—' ? `아기는 ${x.size} 크기(${[x.len, x.wt].filter(Boolean).join(' · ')}). ` : (x.len ? `아기 키 약 ${x.len}, 몸무게 ${x.wt}. ` : '');
    const title = x.size !== '—' ? `임신 ${w}주 — 아기 크기 ${x.size}(${[x.len, x.wt].filter(Boolean).join('·')}), 엄마 몸의 변화와 검사·할 일` : `임신 ${w}주 — ${w <= 2 ? '수정 전 준비 기간' : '예정일 이후 관찰'}, 엄마 몸의 변화와 검사·할 일`;
    const desc = `임신 ${w}주(${wk(w)}분기): ${x.baby} ${x.mom}${x.check ? ` 검사·할 일: ${x.check}.` : ''}`.slice(0, 200);
    const body = `
${crumb([['/due-date/', '임신'], ['/pregnancy/week/', '주차별'], [null, `${w}주`]])}
<h1 class="title">임신 ${w}주</h1>
<p class="meta">${wk(w)}분기 · ${w >= 37 ? '만삭' : w >= 28 ? '후기' : w >= 14 ? '중기' : '초기'} · 주수는 마지막 생리 시작일 기준${w >= 20 ? ' · 길이는 20주부터 머리~발' : ''}</p>
${tiles([{ label: '아기 크기', value: x.size }, { label: w < 20 ? '길이 (머리~엉덩이)' : '길이 (머리~발)', value: x.len || '—' }, { label: '몸무게', value: x.wt || '—' }])}
${lead(`임신 ${w}주는 ${wk(w)}분기입니다. ${sizeText}${x.baby}`)}
<form class="quick live" data-live="week" style="margin-top:14px"><div class="live-head"><b>오늘 ${w}주라면</b><span>주·일을 바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>지금 주수</span><input data-k="w" type="text" inputmode="numeric" value="${w}"></label><label class="ye-f"><span>일</span><input data-k="d" type="text" inputmode="numeric" value="0"></label></div><div class="tiles"><div class="tile"><small>출산예정일</small><span class="num" data-out="due"></span></div><div class="tile"><small>남은 날</small><span class="num" data-out="left"></span></div><div class="tile"><small>마지막 생리 시작일</small><span class="num" data-out="lmp"></span></div></div><div class="live-foot"><a data-out="link" href="/due-date/">이 생리일의 전체 일정 →</a></div></form>
${section('아기', null, `<div class="doc"><p>${x.baby}</p></div>`)}
${section('엄마', null, `<div class="doc"><p>${x.mom}</p></div>`)}
${section('이번 주 검사·할 일', null, `<div class="callout">${x.check ? `<b>${x.check}</b>` : '이번 주에 정해진 검사는 없습니다. 정기 진료 일정(28주까지 4주, 36주까지 2주, 이후 매주)을 확인하세요.'}</div>`)}
${ad()}
${section('오늘 기준으로 보면', `${D.fmtShort(TODAY)}에 ${w}주 0일이라면`, tiles([{ label: '출산예정일', value: `${due.getUTCFullYear()}.${due.getUTCMonth() + 1}.${due.getUTCDate()}` }, { label: left >= 0 ? '남은 날' : '지난 날', value: `${Math.abs(left)}일` }, { label: '마지막 생리 시작', value: `${lmp.getUTCFullYear()}.${lmp.getUTCMonth() + 1}.${lmp.getUTCDate()}` }]))}
${pager(prev, next)}
${section('주차별 안내', null, wrapChips(WEEKS.map((y) => ({ label: `${y.w}주`, href: weekUrl(y.w), on: y.w === w }))))}
${section('이어서', null, list([{ href: '/due-date/', title: '출산예정일 계산기', sub: '마지막 생리일로 예정일·검사 일정' }, { href: '/guide/pregnancy-weeks/', title: '임신 주수 세는 법', sub: '왜 4주인데 아기는 2주인가' }, { href: '/baby/month/0/', title: '신생아 0개월 발달', sub: '태어난 뒤 첫 달' }]))}
${NOTE('아기 크기·몸무게는 주차별 평균 참고값이며 개인차가 큽니다. 검사 시기는 국내 산부인과의 일반적인 일정으로, 병원마다 다를 수 있습니다.')}`;
    write(url, shell({ url, title, desc, body, nav: 'preg', scripts: ['/js/engine.js', '/js/live.js'] }));
  }
  write('/pregnancy/week/', shell({ url: '/pregnancy/week/', title: '임신 주차별 안내 1~42주 — 아기 크기·엄마 몸의 변화·검사 일정', desc: '임신 1주부터 42주까지 주차별로 아기 크기(과일 비유·길이·몸무게), 엄마 몸의 변화, 이번 주 검사와 할 일을 정리했습니다. 오늘 몇 주인지 넣으면 출산예정일도 바로.', nav: 'preg', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/due-date/', '임신'], [null, '주차별']])}
<h1 class="title">임신 주차별 안내</h1>
<p class="meta">1~42주 · 아기 크기 · 엄마 몸의 변화 · 검사와 할 일</p>
<form class="quick live" data-live="week" style="margin-top:14px"><div class="live-head"><b>지금 몇 주?</b><span>주·일을 넣으면 예정일이 바로</span></div><div class="ye-grid"><label class="ye-f"><span>지금 주수</span><input data-k="w" type="text" inputmode="numeric" value="20"></label><label class="ye-f"><span>일</span><input data-k="d" type="text" inputmode="numeric" value="0"></label></div><div class="tiles"><div class="tile"><small>출산예정일</small><span class="num" data-out="due"></span></div><div class="tile"><small>남은 날</small><span class="num" data-out="left"></span></div><div class="tile"><small>마지막 생리 시작일</small><span class="num" data-out="lmp"></span></div></div><div class="live-foot"><a data-out="wlink" href="/pregnancy/week/20/">이 주차 안내 →</a></div></form>
${lead('임신 주수는 마지막 생리 시작일을 0주 0일로 셉니다. 주차를 누르면 그 주 아기의 크기와 엄마 몸의 변화, 받아야 할 검사가 나옵니다. 13주까지 1분기, 27주까지 2분기, 그 뒤 3분기이고 37주부터 만삭입니다.')}
${[[1, 13, '1분기 — 기관이 만들어지는 시기'], [14, 27, '2분기 — 가장 편한 시기, 정밀 초음파·임당 검사'], [28, 42, '3분기 — 출산 준비']].map(([a, b, t]) => section(t, null, wrapChips(WEEKS.filter((y) => y.w >= a && y.w <= b).map((y) => ({ label: `${y.w}주`, href: weekUrl(y.w) }))))).join('\n')}
${ad()}
${section('많이 보는 주차', null, list([8, 12, 16, 20, 24, 28, 32, 36].map((w) => { const y = WEEKS[w - 1]; return { href: weekUrl(w), title: `임신 ${w}주`, sub: y.check || y.baby.slice(0, 40), value: y.size }; })))}` }));

  /* ---------- 아기 개월별 발달 ---------- */
  const monthUrl = (m) => `/baby/month/${m}/`;
  const mLabel = (m) => m === 0 ? '신생아(0개월)' : `${m}개월`;
  const mHead = (m) => m === 0 ? '신생아 (0개월)' : `아기 ${m}개월`;
  BM.forEach((x, i) => {
    const m = x.m, url = monthUrl(m);
    let birth = D.addMonths(TODAY, -m); if (birth < babyMin) birth = babyMin;
    const prev = i > 0 ? [monthUrl(BM[i - 1].m), mLabel(BM[i - 1].m)] : null, next = i < BM.length - 1 ? [monthUrl(BM[i + 1].m), mLabel(BM[i + 1].m)] : null;
    const title = `${mHead(m)} 발달 — 평균 키 ${x.h}cm·몸무게 ${x.w}kg, 할 수 있는 것·수유·수면·예방접종`;
    const desc = `${mLabel(m)} 아기: ${x.dev} 먹이기 ${x.feed}, 잠 ${x.sleep}.${x.vac ? ` 접종·검진: ${x.vac}.` : ''}`.slice(0, 200);
    const body = `
${crumb([['/baby/', '아기'], ['/baby/month/', '개월별 발달'], [null, mLabel(m)]])}
<h1 class="title">${mHead(m)}</h1>
<p class="meta">평균은 질병관리청 2017 성장도표 남아 50백분위 부근 · 여아는 약 1~2cm·0.5kg 작음 · 개인차 큼</p>
${tiles([{ label: '평균 키', value: `${x.h}cm` }, { label: '평균 몸무게', value: `${x.w}kg` }, { label: '하루 잠', value: x.sleep.split(' ')[0] }])}
${lead(`${m === 0 ? '신생아는' : `${m}개월 아기는`} ${x.dev}`)}
${section('돌봄 포인트', null, `<div class="doc"><p>${x.care}</p></div>`)}
${section('먹이기 · 잠', null, table(['항목', '이 시기'], [{ cells: ['먹이기', x.feed] }, { cells: ['잠', x.sleep] }, { cells: ['예방접종 · 검진', x.vac || '이번 달 정해진 접종 없음'] }]))}
${ad()}
${section('내 아기 날짜로 보기', `${D.fmtShort(TODAY)} 기준 ${mLabel(m)}이면 생일은 ${D.fmt(birth)} 무렵`, list([{ href: `/baby/${D.iso(birth)}/`, title: `${D.fmt(birth)}생 아기 일정표`, sub: '접종 날짜 · 100일·돌 · 오늘 개월수' }, { href: '/baby/', title: '다른 생일로 계산', sub: '생년월일을 넣으면 바로' }]))}
${pager(prev, next)}
${section('개월별', null, wrapChips(BM.map((y) => ({ label: y.m === 0 ? '신생아' : `${y.m}개월`, href: monthUrl(y.m), on: y.m === m }))))}
${section('이어서', null, list([{ href: '/guide/baby-vaccines/', title: '예방접종 일정 총정리', sub: '언제 무엇을 맞나 · 미뤄도 되나' }, { href: '/child-height/', title: '아이 키 예측', sub: '부모 키로 계산' }, { href: `${SISTERS.saju}/`, title: '아기 사주 (사주첩)', sub: '태어난 시각까지 넣으면' }]))}
<p class="note">발달 시기는 평균이며 아기마다 몇 주에서 몇 달까지 차이가 납니다. 걱정되는 점은 영유아 건강검진에서 소아과 의사와 상의하세요. 접종 일정은 질병관리청 표준 예방접종 일정표 기준입니다.</p>`;
    write(url, shell({ url, title, desc, body, nav: 'baby' }));
  });
  write('/baby/month/', shell({ url: '/baby/month/', title: '아기 개월별 발달 — 0~36개월 평균 키·몸무게, 할 수 있는 것, 수유·수면·접종', desc: '신생아부터 36개월까지 개월별로 평균 키·몸무게, 이 시기에 하는 것(뒤집기·앉기·걷기·말), 돌봄 포인트, 수유·수면, 예방접종과 검진을 정리했습니다.', nav: 'baby', body: `
${crumb([['/baby/', '아기'], [null, '개월별 발달']])}
<h1 class="title">아기 개월별 발달</h1>
<p class="meta">0~36개월 · 평균 키·몸무게 · 발달 · 돌봄 · 접종</p>
${lead('개월을 누르면 그 시기 아기의 평균 키·몸무게, 할 수 있는 것, 돌봄 포인트, 수유·수면 양, 예방접종이 나옵니다. 생일로 정확한 개월수를 알고 싶으면 아기 개월수 계산기를 쓰세요.')}
${section('첫돌까지', null, wrapChips(BM.filter((y) => y.m <= 12).map((y) => ({ label: y.m === 0 ? '신생아' : `${y.m}개월`, href: monthUrl(y.m) }))))}
${section('돌 이후', null, wrapChips(BM.filter((y) => y.m > 12).map((y) => ({ label: `${y.m}개월`, href: monthUrl(y.m) }))))}
${ad()}
${section('평균 키·몸무게', '남아 50백분위 부근 · 여아는 약 1~2cm·0.5kg 작음 · cm · kg', table(['개월', '키', '몸무게', '잠'], BM.map((y) => ({ cells: [`<a href="${monthUrl(y.m)}">${mLabel(y.m)}</a>`, y.h, y.w, y.sleep.split(' ')[0]] }))))}
${section('이어서', null, list([{ href: '/baby/', title: '아기 개월수 계산기', sub: '생년월일로 오늘 몇 개월·접종 날짜' }, { href: '/guide/baby-vaccines/', title: '예방접종 일정 총정리', sub: '서재' }]))}` }));

  /* ---------- 걸음 수 ---------- */
  const stepUrl = (s) => `/steps/${s}/`;
  const KGS = [50, 60, 70, 80, 90];
  const stepsForm = (n) => `<form class="quick live" data-live="steps" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>걸음 수·몸무게·키</span></div><div class="ye-grid"><label class="ye-f"><span>걸음 수</span><input data-k="n" type="text" inputmode="numeric" value="${n}"></label><label class="ye-f"><span>몸무게 (kg)</span><input data-k="w" type="text" inputmode="numeric" value="60"></label><label class="ye-f"><span>키 (cm)</span><input data-k="h" type="text" inputmode="numeric" value="170"></label></div><div class="tiles"><div class="tile"><small>거리</small><span class="num" data-out="km"></span></div><div class="tile"><small>걷는 시간</small><span class="num" data-out="min"></span></div><div class="tile"><small>소모 칼로리</small><span class="num" data-out="kcal"></span></div></div><div class="live-foot"><a data-out="link" href="/steps/10000/">걸음 수별 표 →</a></div></form>`;
  for (const s of STEPS) {
    const url = stepUrl(s), r = X.steps(s, 60, 170);
    const foods = FOODS.filter((f) => f.kcal <= r.kcal && f.kcal >= r.kcal * 0.5).sort((a, b) => b.kcal - a.kcal).slice(0, 5);
    const title = `${num(s)}보 걸으면 몇 칼로리? — 약 ${num(r.kcal)}kcal · ${r.km}km · ${r.minutes}분 (60kg 기준)`;
    const desc = `하루 ${num(s)}보는 보폭 ${r.stride}m 기준 약 ${r.km}km, 시속 4km로 ${r.minutes}분 걷는 거리이며 60kg 성인은 약 ${num(r.kcal)}kcal을 씁니다. 몸무게·키별 표와 음식 환산.`;
    const body = `
${crumb([['/exercise/', '운동'], ['/steps/', '걸음 수'], [null, `${num(s)}보`]])}
<h1 class="title">${num(s)}보 걸으면</h1>
<p class="meta">60kg · 키 170cm · 보통 걷기(시속 4km) 기준</p>
${tiles([{ label: '거리', value: `${r.km}km` }, { label: '걷는 시간', value: `${r.minutes}분` }, { label: '소모 칼로리', value: `${num(r.kcal)}kcal` }])}
${lead(`${num(s)}보는 보폭 ${r.stride}m(키 170cm)로 약 <b>${r.km}km</b>, 보통 속도로 <b>${r.minutes}분</b> 걷는 거리입니다. 60kg 성인이 쓰는 에너지는 약 <b>${num(r.kcal)}kcal</b>로 밥 ${K.bowls(r.kcal)}공기입니다. 몸무게가 무거울수록, 빨리 걸을수록 더 많이 씁니다.`)}
${stepsForm(s)}
${section('몸무게별 소모 칼로리', `${num(s)}보 · 키 170cm`, table(['몸무게', '칼로리', '밥 공기'], KGS.map((kg) => { const q = X.steps(s, kg, 170); return { cells: [`${kg}kg`, `${num(q.kcal)}kcal`, `${K.bowls(q.kcal)}공기`], cls: kg === 60 ? 'on' : '' }; })))}
${section('키별 거리', '보폭 = 키 × 0.415', table(['키', '보폭', '거리', '시간'], [150, 160, 170, 180, 190].map((cm) => { const q = X.steps(s, 60, cm); return { cells: [`${cm}cm`, `${q.stride}m`, `${q.km}km`, `${q.minutes}분`], cls: cm === 170 ? 'on' : '' }; })))}
${ad()}
${foods.length ? section('이만큼 태우면', `${num(r.kcal)}kcal 안팎의 음식`, list(foods.map((f) => ({ href: `/food/${f.slug}/`, title: f.name, sub: f.serving, value: `${num(f.kcal)}kcal` })))) : ''}
${section('걸음 수별', null, wrapChips(STEPS.map((t) => ({ label: t < 10000 ? `${t / 1000}천보` : t % 10000 === 0 ? `${t / 10000}만보` : `${(t / 10000).toFixed(1)}만보`, href: stepUrl(t), on: t === s }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>만보는 마케팅에서 나온 숫자입니다.</b> 1960년대 일본 만보계 이름에서 시작됐고, 최근 연구는 하루 7,000~8,000보부터 사망률 감소 효과가 뚜렷하고 그 이상은 완만하다고 봅니다. 목표는 지금보다 2,000보 늘리는 것부터.</p>
<p><b>스마트폰·워치 숫자와 다를 수 있습니다.</b> 기기는 보폭을 키로 추정하거나 GPS로 재고, 칼로리는 심박수로 추정합니다. 여기 숫자는 MET 3.0(보통 걷기) 공식이며 ±20%는 보통입니다.</p>
<p><b>빠르게 걸으면 같은 시간에 칼로리 1.4배.</b> 시속 5.6km(MET 4.3)로 걸으면 같은 시간에 더 많이 쓰고, 같은 거리라면 시간은 30% 줄고 칼로리는 거의 같습니다.</p>
</div>`)}
${section('이어서', null, list([{ href: '/exercise/walking/', title: '걷기 소모 칼로리', sub: '시간별·몸무게별' }, { href: '/exercise/brisk-walking/', title: '빠르게 걷기', sub: '시속 5.6km' }, { href: '/diet/', title: '다이어트 기간 계산', sub: '목표 체중까지 몇 주' }]))}
${NOTE('소모 칼로리 = MET 3.0 × 3.5 × 몸무게 ÷ 200 × 분. 보폭은 키 × 0.415(평균 어림값), 시속 4km 가정.')}`;
    write(url, shell({ url, title, desc, body, nav: 'exercise', scripts: ['/js/engine.js', '/js/live.js'] }));
  }
  { const r = X.steps(10000, 60, 170);
  write('/steps/', shell({ url: '/steps/', title: '걸음 수 칼로리 계산기 — 만보 걸으면 몇 칼로리·몇 km (몸무게·키별)', desc: `만보는 약 ${r.km}km, ${r.minutes}분, 60kg 기준 ${num(r.kcal)}kcal입니다. 1,000~30,000보를 걸음 수·몸무게·키별로 거리와 소모 칼로리로 환산했습니다.`, nav: 'exercise', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/exercise/', '운동'], [null, '걸음 수']])}
<h1 class="title">걸음 수 → 거리·칼로리</h1>
<p class="meta">보폭 = 키 × 0.415 · 보통 걷기 시속 4km · MET 3.0</p>
${stepsForm(10000)}
${lead(`만보는 키 170cm 기준 약 ${r.km}km, ${r.minutes}분이고 60kg 성인은 ${num(r.kcal)}kcal을 씁니다. 걸음 수를 누르면 몸무게·키별 표와 그만큼의 음식이 나옵니다.`)}
${section('걸음 수별', '60kg · 170cm', table(['걸음', '거리', '시간', '칼로리'], STEPS.map((s) => { const q = X.steps(s, 60, 170); return { cells: [`<a href="${stepUrl(s)}">${num(s)}보</a>`, `${q.km}km`, `${q.minutes}분`, `${num(q.kcal)}kcal`], cls: s === 10000 ? 'on' : '' }; })))}
${ad()}
${section('이어서', null, list([{ href: '/exercise/', title: '운동별 소모 칼로리표', sub: '걷기·달리기·자전거·수영' }, { href: '/guide/calorie-burn/', title: 'MET로 계산하기', sub: '서재 — 치킨 한 마리를 태우려면' }]))}` })); }

  /* ---------- 수면 ---------- */
  const sleepUrl = (min) => `/sleep/${slot(min)}/`;
  const sleepForm = (wake) => `<form class="quick live" data-live="sleep" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>90분 주기 · 잠드는 데 15분</span></div><div class="ye-grid"><label class="ye-f"><span>일어날 시각</span><input data-k="wake" type="time" value="${hhmm(wake)}"></label><label class="ye-f"><span>눕는 시각 (기본 지금)</span><input data-k="bed" type="time" value=""></label></div><div class="tiles"><div class="tile"><small>취침 6주기 (9시간)</small><span class="num" data-out="b6"></span></div><div class="tile"><small>5주기 (7.5시간)</small><span class="num" data-out="b5"></span></div><div class="tile"><small>4주기 (6시간)</small><span class="num" data-out="b4"></span></div></div><div class="tiles"><div class="tile"><small>지금 누우면 · 6주기</small><span class="num" data-out="n6"></span></div><div class="tile"><small>5주기</small><span class="num" data-out="n5"></span></div><div class="tile"><small>4주기</small><span class="num" data-out="n4"></span></div></div></form>`;
  for (const wake of WAKES) {
    const url = sleepUrl(wake), bt = X.bedtimes(Math.floor(wake / 60), wake % 60);
    const title = `${hhmm(wake)}에 일어나려면 몇 시에 자야 할까 — 취침 ${bt[1].time} (5주기 7.5시간) · ${bt[0].time} (6주기)`;
    const desc = `${hhmm(wake)} 기상 기준 90분 수면 주기로 계산한 취침 시각: 6주기 ${bt[0].time}, 5주기 ${bt[1].time}, 4주기 ${bt[2].time}, 3주기 ${bt[3].time}. 잠드는 데 걸리는 15분을 감안한 시각입니다.`;
    const body = `
${crumb([['/sleep/', '수면'], [null, `${hhmm(wake)} 기상`]])}
<h1 class="title">${hhmm(wake)}에 일어나려면</h1>
<p class="meta">90분 수면 주기 × n + 잠드는 데 15분 · 얕은 잠 단계에서 깨도록</p>
${tiles(bt.slice(0, 3).map((b) => ({ label: `${b.cycles}주기 · ${b.hours}시간`, value: b.time })))}
${lead(`${hhmm(wake)}에 개운하게 일어나려면 <b>${bt[1].time}</b>(5주기, 7.5시간) 또는 <b>${bt[0].time}</b>(6주기, 9시간)에 눕는 것이 좋습니다. 늦었다면 ${bt[2].time}(4주기, 6시간)이 다음 후보입니다. 잠드는 데 걸리는 15분을 이미 뺀 시각입니다.`)}
${sleepForm(wake)}
${section('취침 시각 후보', `${hhmm(wake)} 기상`, table(['주기', '수면 시간', '눕는 시각'], bt.map((b) => ({ cells: [`${b.cycles}주기`, `${b.hours}시간`, b.time], cls: b.cycles === 5 ? 'on' : '' }))))}
${ad()}
${section('기상 시각별', null, wrapChips(WAKES.map((t) => ({ label: hhmm(t), href: sleepUrl(t), on: t === wake }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>성인 권장 수면은 7~9시간</b>(5~6주기)입니다. 4주기(6시간)는 며칠은 버틸 수 있지만 이어지면 집중력·식욕 조절이 무너집니다. 3주기(4.5시간)는 비상용입니다.</p>
<p><b>주기는 사람마다 70~120분.</b> 계산 시각이 안 맞으면 15분씩 당기거나 늦춰 보며 자기 리듬을 찾으세요. 매일 같은 시각에 일어나는 것이 가장 강력한 방법입니다.</p>
<p><b>낮잠은 20분 또는 90분.</b> 30~60분은 깊은 잠 도중 깨어 오히려 멍합니다.</p>
</div>`)}
${section('이어서', null, list([{ href: '/guide/sleep-cycle/', title: '90분 수면 주기 계산', sub: '서재 — 몇 시에 자야 개운할까' }, { href: '/bmr/', title: '기초대사량', sub: '수면 부족은 대사에도 영향' }]))}
<p class="note">수면 주기 90분은 평균값이며, 계산은 참고용입니다. 만성 불면·코골이·주간 졸림은 수면클리닉 상담을 권합니다.</p>`;
    write(url, shell({ url, title, desc, body, nav: 'bmr', scripts: ['/js/engine.js', '/js/live.js'] }));
  }
  write('/sleep/', shell({ url: '/sleep/', title: '수면 시간 계산기 — 몇 시에 자야 개운할까 (90분 수면 주기 · 기상 시각별 취침 시각)', desc: '일어날 시각을 넣으면 90분 수면 주기에 맞춘 취침 시각이, 지금 누우면 언제 일어나야 하는지가 바로 나옵니다. 기상 5시~10시 30분 단위 표.', nav: 'bmr', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/', '홈'], [null, '수면']])}
<h1 class="title">몇 시에 자야 개운할까</h1>
<p class="meta">90분 수면 주기 · 잠드는 데 15분 · 얕은 잠에서 깨기</p>
${sleepForm(7 * 60)}
${lead('잠은 얕은 잠→깊은 잠→렘수면이 한 바퀴 도는 데 약 90분이 걸리고, 주기가 끝나는 얕은 잠 단계에서 깨면 개운합니다. 일어날 시각에서 90분 단위로 거꾸로 세고 잠드는 15분을 더 빼면 취침 시각입니다.')}
${section('기상 시각별 취침 시각', '5주기(7.5시간) · 6주기(9시간)', table(['기상', '5주기', '6주기', '4주기'], WAKES.map((t) => { const b = X.bedtimes(Math.floor(t / 60), t % 60); return { cells: [`<a href="${sleepUrl(t)}">${hhmm(t)}</a>`, b[1].time, b[0].time, b[2].time], cls: t === 7 * 60 ? 'on' : '' }; })))}
${ad()}
${section('이어서', null, list([{ href: '/guide/sleep-cycle/', title: '90분 수면 주기 계산', sub: '서재' }, { href: '/baby/month/', title: '아기 개월별 수면 시간', sub: '신생아 14~17시간부터' }]))}` }));

  /* ---------- 아이 키 예측 ---------- */
  const chUrl = (f, m) => `/child-height/${f}-${m}/`;
  const chForm = (f, m) => `<form class="quick live" data-live="child" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>부모 키(cm)</span></div><div class="ye-grid"><label class="ye-f"><span>아빠 키</span><input data-k="f" type="text" inputmode="numeric" value="${f}"></label><label class="ye-f"><span>엄마 키</span><input data-k="m" type="text" inputmode="numeric" value="${m}"></label></div><div class="tiles"><div class="tile"><small>아들 예상</small><span class="num" data-out="boy"></span></div><div class="tile"><small>딸 예상</small><span class="num" data-out="girl"></span></div><div class="tile"><small>범위 (±8.5cm)</small><span class="num" data-out="range"></span></div></div><div class="live-foot"><a data-out="link" href="/child-height/">이 조합 표 →</a></div></form>`;
  for (const f of FATHERS) for (const m of MOTHERS) {
    const url = chUrl(f, m), c = X.childHeight(f, m);
    const title = `아빠 ${f}cm 엄마 ${m}cm 아이 예상 키 — 아들 ${c.boy}cm · 딸 ${c.girl}cm (부모 키로 계산)`;
    const desc = `아버지 ${f}cm, 어머니 ${m}cm이면 중간 부모 키 공식으로 아들은 약 ${c.boy}cm(${c.boy - 8.5}~${c.boy + 8.5}), 딸은 약 ${c.girl}cm(${c.girl - 8.5}~${c.girl + 8.5})로 예상됩니다. 유전 외에 키를 좌우하는 것.`;
    const near = (arr, v, k) => { const i = arr.indexOf(v); return arr.slice(Math.max(0, i - k), i + k + 1); };
    const body = `
${crumb([['/child-height/', '아이 키 예측'], [null, `아빠 ${f} · 엄마 ${m}`]])}
<h1 class="title">아빠 ${f}cm · 엄마 ${m}cm</h1>
<p class="meta">중간 부모 키(mid-parental height) · 아들 (아빠+엄마+13)÷2 · 딸 (아빠+엄마−13)÷2</p>
${tiles([{ label: '아들 예상 키', value: `${c.boy}cm` }, { label: '딸 예상 키', value: `${c.girl}cm` }, { label: '95% 범위', value: '±8.5cm' }])}
${lead(`아버지 ${f}cm, 어머니 ${m}cm이면 아들은 약 <b>${c.boy}cm</b>, 딸은 약 <b>${c.girl}cm</b>로 예상됩니다. 실제 성인 키는 이 값 앞뒤 8.5cm 안에 약 95%가 들어가니, 아들은 ${c.boy - 8.5}~${c.boy + 8.5}cm, 딸은 ${c.girl - 8.5}~${c.girl + 8.5}cm 어디든 정상 범위입니다.`)}
${chForm(f, m)}
${section('아빠 키가 다르면', `엄마 ${m}cm 고정`, table(['아빠', '아들', '딸'], near(FATHERS, f, 3).map((x) => { const y = X.childHeight(x, m); return { cells: [`<a href="${chUrl(x, m)}">${x}cm</a>`, `${y.boy}cm`, `${y.girl}cm`], cls: x === f ? 'on' : '' }; })))}
${section('엄마 키가 다르면', `아빠 ${f}cm 고정`, table(['엄마', '아들', '딸'], near(MOTHERS, m, 3).map((x) => { const y = X.childHeight(f, x); return { cells: [`<a href="${chUrl(f, x)}">${x}cm</a>`, `${y.boy}cm`, `${y.girl}cm`], cls: x === m ? 'on' : '' }; })))}
${ad()}
${section('유전 말고 키를 좌우하는 것', null, `<div class="doc">
<p><b>잠.</b> 성장호르몬은 깊은 잠에서 나옵니다. 취학 전 10~12시간, 초등 9~11시간, 늦어도 밤 10시 전에.</p>
<p><b>먹기.</b> 단백질·칼슘·비타민 D. 과도한 열량과 비만은 사춘기를 앞당겨 성장 기간을 줄입니다.</p>
<p><b>움직이기.</b> 줄넘기·농구·달리기처럼 뼈에 자극을 주는 운동. 하루 1시간.</p>
<p><b>사춘기 시기.</b> 여아 8세·남아 9세 전에 2차 성징이 보이면 성조숙증 검사를 받으세요. 또래 3백분위 아래이거나 1년에 4cm 미만 자라면 소아내분비과 진료를 권합니다.</p>
</div>`)}
${section('이어서', null, list([{ href: '/guide/child-height/', title: '우리 아이 키 예측 — 공식과 한계', sub: '서재' }, { href: '/baby/month/', title: '아기 개월별 평균 키·몸무게', sub: '0~36개월' }, { href: '/bmi/', title: '부모 BMI', sub: '키·몸무게별' }]))}
<p class="note">Tanner 중간 부모 키 공식(1970)입니다. 예측값은 통계적 평균이며 실제 키는 영양·수면·질병·사춘기 시기에 따라 달라집니다. 정확한 예측은 손목 X선 뼈 나이 검사로 합니다.</p>`;
    write(url, shell({ url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
  }
  write('/child-height/', shell({ url: '/child-height/', title: '아이 키 예측 계산기 — 부모 키로 아들·딸 예상 키 (중간 부모 키 공식)', desc: '아빠 키와 엄마 키를 넣으면 아들·딸의 예상 성인 키와 95% 범위가 나옵니다. 아빠 160~190cm × 엄마 150~175cm 조합표.', nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/', '홈'], [null, '아이 키 예측']])}
<h1 class="title">아이 키 예측</h1>
<p class="meta">중간 부모 키 공식 · 아들 (아빠+엄마+13)÷2 · 딸 (아빠+엄마−13)÷2 · ±8.5cm</p>
${chForm(175, 162)}
${lead('아이의 최종 키는 유전이 70~80%를 결정합니다. 부모 키로 어림하는 가장 단순한 방법이 중간 부모 키 공식이며, 실제 키는 예측값 앞뒤 8.5cm 안에 약 95%가 들어갑니다. 아래 표에서 아빠 키를 고르면 엄마 키별 페이지가 열립니다.')}
${section('아빠 키 × 엄마 키', '아들 예상 키 · cm', `<div class="tbl"><table><thead><tr><th>아빠 \\ 엄마</th>${[150, 155, 160, 165, 170, 175].map((m) => `<th>${m}</th>`).join('')}</tr></thead><tbody>${[160, 165, 170, 175, 180, 185, 190].map((f) => `<tr><td>${f}cm</td>${[150, 155, 160, 165, 170, 175].map((m) => `<td><a href="${chUrl(f, m)}">${X.childHeight(f, m).boy}</a></td>`).join('')}</tr>`).join('')}</tbody></table></div>`)}
${section('딸 예상 키', 'cm', `<div class="tbl"><table><thead><tr><th>아빠 \\ 엄마</th>${[150, 155, 160, 165, 170, 175].map((m) => `<th>${m}</th>`).join('')}</tr></thead><tbody>${[160, 165, 170, 175, 180, 185, 190].map((f) => `<tr><td>${f}cm</td>${[150, 155, 160, 165, 170, 175].map((m) => `<td><a href="${chUrl(f, m)}">${X.childHeight(f, m).girl}</a></td>`).join('')}</tr>`).join('')}</tbody></table></div>`)}
${ad()}
${section('아빠 키별', null, wrapChips(FATHERS.map((f) => ({ label: `${f}`, href: chUrl(f, 162) }))))}
${section('이어서', null, list([{ href: '/guide/child-height/', title: '우리 아이 키 예측 — 공식과 한계', sub: '서재' }, { href: '/baby/month/', title: '아기 개월별 발달', sub: '평균 키·몸무게' }]))}` }));

  /* ---------- 혈중알코올농도 ---------- */
  const DR = Object.fromEntries(X.DRINKS.map((d) => [d.key, d]));
  const alUrl = (k, c) => `/alcohol/${k}/${c}/`;
  const alName = (k, c) => `${DR[k].label.split(' ')[0]} ${c}${k === 'wine' ? '잔' : '병'}`;
  const alForm = (k, c) => `<form class="quick live" data-live="alcohol" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>위드마크 공식</span></div><div class="ye-grid"><label class="ye-f"><span>술</span><select data-k="drink">${X.DRINKS.map((d) => `<option value="${d.key}"${d.key === k ? ' selected' : ''}>${d.label}</option>`).join('')}</select></label><label class="ye-f"><span>양 (병·잔)</span><input data-k="n" type="text" inputmode="decimal" value="${c}"></label><label class="ye-f"><span>성별</span><select data-k="sex"><option value="m">남</option><option value="f">여</option></select></label><label class="ye-f"><span>몸무게 (kg)</span><input data-k="w" type="text" inputmode="numeric" value="70"></label><label class="ye-f"><span>마지막 잔 마신 지 (시간)</span><input data-k="hrs" type="text" inputmode="decimal" value="0"></label></div><div class="tiles"><div class="tile"><small>최고 농도</small><span class="num" data-out="peak"></span></div><div class="tile"><small>지금 농도</small><span class="num" data-out="now"></span></div><div class="tile"><small>판정</small><span class="num" data-out="level"></span></div></div><div class="tiles"><div class="tile"><small>0.03% 아래로 (마지막 잔부터)</small><span class="num" data-out="drive"></span></div><div class="tile"><small>완전 분해</small><span class="num" data-out="sober"></span></div><div class="tile"><small>알코올 양</small><span class="num" data-out="grams"></span></div></div></form>`;
  const ROWS = [['m', 60], ['m', 70], ['m', 80], ['m', 90], ['f', 50], ['f', 55], ['f', 60], ['f', 70]];
  for (const k of DRINK_PAGES) for (const c of DRINK_COUNTS) {
    const d = DR[k], url = alUrl(k, c), g = X.alcoholGrams(d.ml * c, d.abv), m70 = X.bac(g, 70, 'm'), f55 = X.bac(g, 55, 'f');
    const name = alName(k, c);
    const title = `${name} 마시면 혈중알코올농도 — 70kg 남 ${m70.peak}% · 55kg 여 ${f55.peak}%, 0.03% 아래로 ${m70.driveHours}~${f55.driveHours}시간`;
    const desc = `${name}(알코올 약 ${Math.round(g)}g)을 마시면 위드마크 공식으로 70kg 남성은 최고 ${m70.peak}%(${X.bacLevel(m70.peak)}), 55kg 여성은 ${f55.peak}%입니다. 마지막 잔부터 0.03% 아래로 내려오는 데 ${m70.driveHours}~${f55.driveHours}시간, 완전 분해까지 ${m70.soberHours}~${f55.soberHours}시간.`;
    const body = `
${crumb([['/alcohol/', '혈중알코올농도'], [null, name]])}
<h1 class="title">${name} 마시면</h1>
<p class="meta">${d.label} × ${c} · 알코올 약 ${Math.round(g)}g · 위드마크 공식 · 마지막 잔 뒤 흡수 1.5시간 + 시간당 0.015%p 분해</p>
${tiles([{ label: '70kg 남성 최고 농도', value: `${m70.peak}%` }, { label: '55kg 여성 최고 농도', value: `${f55.peak}%` }, { label: '0.03% 아래로 (남/여)', value: `${m70.driveHours}/${f55.driveHours}시간` }])}
${lead(`${name}에는 순수 알코올이 약 ${Math.round(g)}g 들어 있습니다. 70kg 남성이 마시면 혈중알코올농도가 최고 <b>${m70.peak}%</b>(${X.bacLevel(m70.peak).split(' (')[0]}), 55kg 여성은 <b>${f55.peak}%</b>(${X.bacLevel(f55.peak).split(' (')[0]})까지 오릅니다. 마지막 잔을 마신 때부터 흡수 시간 1.5시간을 포함해 단속 기준 0.03% 아래로 내려오는 데 남성 ${m70.driveHours}시간, 여성 ${f55.driveHours}시간이 걸리고 완전히 0이 되는 데는 ${m70.soberHours}~${f55.soberHours}시간입니다.`)}
${alForm(k, c)}
${section('몸무게·성별로', `${name}`, table(['구분', '최고 농도', '판정', '0.03% 아래로', '완전 분해'], ROWS.map(([s, kg]) => { const r = X.bac(g, kg, s); return { cells: [`${s === 'm' ? '남' : '여'} ${kg}kg`, `${r.peak}%`, X.bacLevel(r.peak).split(' (')[0], `${r.driveHours}시간`, `${r.soberHours}시간`], cls: (s === 'm' && kg === 70) ? 'on' : '' }; })))}
${ad()}
${section('같은 술 다른 양', null, wrapChips(DRINK_COUNTS.map((x) => ({ label: alName(k, x), href: alUrl(k, x), on: x === c }))))}
${section('다른 술', `${c}${k === 'wine' ? '잔' : '병'} 기준`, wrapChips(DRINK_PAGES.filter((x) => x !== k).map((x) => ({ label: alName(x, c), href: alUrl(x, c) }))))}
${section('단속 기준', '도로교통법', table(['농도', '처분'], [{ cells: ['0.03% 이상', '면허 정지 · 1년 이하 징역 또는 500만원 이하 벌금'] }, { cells: ['0.08% 이상', '면허 취소 · 1~2년 징역 또는 500~1,000만원 벌금'] }, { cells: ['0.2% 이상', '면허 취소 · 2~5년 징역 또는 1,000~2,000만원 벌금'] }]))}
${section('이어서', null, list([{ href: '/guide/alcohol-bac/', title: '소주 한 병 마시면 몇 시간 뒤 운전할 수 있나', sub: '서재 — 위드마크 공식' }, { href: `/food/${k === 'wine' ? 'wine' : k === 'beer' ? 'beer' : k}/`, title: `${DR[k].label.split(' ')[0]} 칼로리`, sub: '음식 칼로리 사전' }]))}
<p class="note">위드마크 공식(흡수율 90%, 남 0.68·여 0.55, 마지막 잔 뒤 흡수 1.5시간, 시간당 0.015%p 분해)의 평균값이며 공복·음주 속도·체지방에 따라 실제 농도는 더 높을 수 있습니다. 실제 단속은 호흡측정기로 하며, 이 계산은 음주운전 가능 여부를 보증하지 않습니다. 술을 마셨다면 운전하지 마세요.</p>`;
    write(url, shell({ url, title, desc, body, nav: 'food', scripts: ['/js/engine.js', '/js/live.js'] }));
  }
  write('/alcohol/', shell({ url: '/alcohol/', title: '혈중알코올농도 계산기 — 소주·맥주 몇 병이면 면허 정지, 몇 시간 뒤 운전 가능한지 (위드마크)', desc: '술 종류와 양, 몸무게, 성별, 지난 시간을 넣으면 위드마크 공식으로 혈중알코올농도와 0.03% 아래로 내려오는 시간이 나옵니다. 소주·맥주·막걸리·와인 1~5병 표.', nav: 'food', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/', '홈'], [null, '혈중알코올농도']])}
<h1 class="title">혈중알코올농도</h1>
<p class="meta">위드마크 공식 · 단속 0.03% · 취소 0.08% · 마지막 잔 뒤 흡수 1.5시간 + 시간당 0.015%p 분해</p>
${alForm('soju', 1)}
${lead('알코올은 시간당 혈중농도 0.015%p씩만 분해되고, 물·커피·사우나로 빨라지지 않습니다. 소주 1병을 마신 70kg 남성이 마지막 잔 뒤 0.03% 아래로 내려오는 데 약 5시간 30분, 2병이면 11시간 넘게 걸립니다. 술 종류와 양을 누르면 몸무게·성별 표가 나옵니다.')}
${section('소주 · 맥주 · 막걸리 · 와인', '70kg 남성 최고 농도 · 마지막 잔부터 0.03% 아래로 걸리는 시간', table(['술', '1', '2', '3', '4', '5'], DRINK_PAGES.map((k) => ({ cells: [DR[k].label.split(' ')[0]].concat(DRINK_COUNTS.map((c) => { const r = X.bac(X.alcoholGrams(DR[k].ml * c, DR[k].abv), 70, 'm'); return `<a href="${alUrl(k, c)}">${r.peak}%<br><small>${r.driveHours}h</small></a>`; })) }))))}
${ad()}
${section('이어서', null, list([{ href: '/guide/alcohol-bac/', title: '소주 한 병 마시면 몇 시간 뒤 운전할 수 있나', sub: '서재' }, { href: '/food/soju/', title: '술 칼로리', sub: '소주 1병 · 맥주 500ml' }]))}
<p class="note">이 계산은 참고용이며 음주운전 가능 여부를 보증하지 않습니다. 술을 마셨다면 운전하지 마세요.</p>` }));

  /* ---------- 다이어트 기간 ---------- */
  const dietUrl = (kg) => `/diet/${kg}/`;
  const DEF = [300, 500, 750, 1000];
  const dietForm = (from, to) => `<form class="quick live" data-live="diet" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>체지방 1kg = 7,700kcal</span></div><div class="ye-grid"><label class="ye-f"><span>지금 몸무게 (kg)</span><input data-k="from" type="text" inputmode="decimal" value="${from}"></label><label class="ye-f"><span>목표 몸무게 (kg)</span><input data-k="to" type="text" inputmode="decimal" value="${to}"></label><label class="ye-f"><span>하루 줄일 칼로리</span><select data-k="def">${DEF.map((d) => `<option value="${d}"${d === 500 ? ' selected' : ''}>${d}kcal${d === 500 ? ' (권장)' : ''}</option>`).join('')}</select></label></div><div class="tiles"><div class="tile"><small>뺄 몸무게</small><span class="num" data-out="diff"></span></div><div class="tile"><small>걸리는 기간</small><span class="num" data-out="weeks"></span></div><div class="tile"><small>목표 날짜</small><span class="num" data-out="date"></span></div></div><div class="live-foot"><span>한 주에 <b class="num" data-out="perweek"></b>kg</span><a data-out="link" href="/diet/5/">감량 kg별 표 →</a></div></form>`;
  for (const kg of DIET_KG) {
    const url = dietUrl(kg), p = X.dietPlan(kg, 0, 500), end = D.addDays(TODAY, p.days);
    const walk = K.minutesFor(500, EX.walking.met, 60), run = K.minutesFor(500, EX['running-8'].met, 60);
    const foods = FOODS.filter((f) => f.kcal >= 400 && f.kcal <= 600).sort((a, b) => Math.abs(a.kcal - 500) - Math.abs(b.kcal - 500)).slice(0, 6);
    const title = `${kg}kg 빼는 데 걸리는 기간 — 하루 500kcal 줄이면 ${p.weeks}주 (${p.days}일), 300·750·1,000kcal일 때`;
    const desc = `체지방 ${kg}kg은 약 ${num(kg * 7700)}kcal입니다. 하루 500kcal을 덜 먹으면 ${p.weeks}주(${p.days}일), 300kcal이면 ${X.dietPlan(kg, 0, 300).weeks}주, 1,000kcal이면 ${X.dietPlan(kg, 0, 1000).weeks}주가 걸립니다. 500kcal은 걷기 ${walk}분·달리기 ${run}분.`;
    const body = `
${crumb([['/diet/', '다이어트 기간'], [null, `${kg}kg 감량`]])}
<h1 class="title">${kg}kg 빼려면</h1>
<p class="meta">체지방 1kg ≈ 7,700kcal · 하루 결손 칼로리별 · 오늘 시작하면</p>
${tiles([{ label: '하루 500kcal 줄이면', value: `${p.weeks}주` }, { label: '날수', value: `${p.days}일` }, { label: '오늘 시작 → 목표일', value: `${end.getUTCFullYear()}.${end.getUTCMonth() + 1}.${end.getUTCDate()}` }])}
${lead(`체지방 ${kg}kg은 약 <b>${num(kg * 7700)}kcal</b>입니다. 하루 500kcal을 덜 먹거나 더 태우면 한 주에 약 0.45kg이 빠져 <b>${p.weeks}주</b>(${p.days}일) 걸립니다. 오늘 시작하면 ${D.fmt(end)} 무렵입니다. 주 0.5~1kg이 의학계가 권하는 안전한 속도입니다.`)}
${dietForm(65 + kg, 65)}
${section('하루 줄이는 칼로리별', `${kg}kg 감량`, table(['하루 결손', '한 주에', '기간', '날수'], DEF.map((d) => { const q = X.dietPlan(kg, 0, d); return { cells: [`${num(d)}kcal`, `${q.perWeek}kg`, `${q.weeks}주`, `${q.days}일`], cls: d === 500 ? 'on' : '' }; })))}
${ad()}
${section('500kcal은 이만큼', '60kg 기준', tiles([{ label: '걷기', value: `${walk}분` }, { label: '달리기 8km/h', value: `${run}분` }, { label: '밥', value: `${K.bowls(500)}공기` }]))}
${section('500kcal 안팎 음식', '이 중 하나를 빼면 하루 결손', list(foods.map((f) => ({ href: `/food/${f.slug}/`, title: f.name, sub: f.serving, value: `${num(f.kcal)}kcal` }))))}
${section('감량 kg별', null, wrapChips(DIET_KG.map((x) => ({ label: `${x}kg`, href: dietUrl(x), on: x === kg }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>처음 1~2주는 더 빨리 빠집니다.</b> 탄수화물을 줄이면 글리코겐과 함께 물이 1~2kg 빠지는데, 이것은 체지방이 아니라서 곧 멈춥니다. 표의 기간은 그 뒤의 속도입니다.</p>
<p><b>하루 1,000kcal 결손은 의사와 상의할 수준입니다.</b> 근육 손실·담석·생리 불순 위험이 커집니다. 기초대사량 아래로는 먹지 마세요.</p>
<p><b>정체기는 정상입니다.</b> 몸무게가 줄면 하루 필요 칼로리도 줄어 같은 식사로 결손이 작아집니다. 3~4주마다 기초대사량을 다시 계산하세요.</p>
</div>`)}
${section('이어서', null, list([{ href: '/bmr/', title: '기초대사량·하루 칼로리', sub: '내 결손을 어디서 만들지' }, { href: '/guide/bmr-diet/', title: '기초대사량보다 적게 먹으면 왜 살이 안 빠지나', sub: '서재' }, { href: '/bmi/', title: '내 키의 정상 체중', sub: '목표를 어디에 둘지' }]))}
${NOTE('체지방 1kg ≈ 7,700kcal 가정. 실제 감량 속도는 체성분·대사 적응·수분 변화에 따라 달라집니다.')}`;
    write(url, shell({ url, title, desc, body, nav: 'bmr', scripts: ['/js/engine.js', '/js/live.js'] }));
  }
  write('/diet/', shell({ url: '/diet/', title: '다이어트 기간 계산기 — 목표 체중까지 몇 주 걸리나 (하루 500kcal 기준 감량 kg별 표)', desc: '지금 몸무게와 목표 몸무게를 넣으면 하루 줄이는 칼로리별로 걸리는 기간과 목표 날짜가 나옵니다. 1~30kg 감량 표, 500kcal을 만드는 운동·음식.', nav: 'bmr', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/', '홈'], [null, '다이어트 기간']])}
<h1 class="title">목표 체중까지 몇 주</h1>
<p class="meta">체지방 1kg ≈ 7,700kcal · 하루 500kcal 결손 = 주 0.45kg</p>
${dietForm(75, 68)}
${lead('하루 500kcal을 덜 먹으면 일주일에 3,500kcal, 체지방 약 0.45kg이 빠집니다. 5kg이면 11주, 10kg이면 22주입니다. 아래에서 뺄 kg을 누르면 결손 칼로리별 기간과 목표 날짜, 500kcal을 만드는 방법이 나옵니다.')}
${section('감량 kg별 기간', '하루 500kcal · 오늘 시작', table(['뺄 몸무게', '기간', '날수', '목표일'], DIET_KG.map((kg) => { const q = X.dietPlan(kg, 0, 500), e = D.addDays(TODAY, q.days); return { cells: [`<a href="${dietUrl(kg)}">${kg}kg</a>`, `${q.weeks}주`, `${q.days}일`, `${e.getUTCFullYear()}.${e.getUTCMonth() + 1}.${e.getUTCDate()}`], cls: kg === 5 ? 'on' : '' }; })))}
${ad()}
${section('이어서', null, list([{ href: '/bmr/', title: '기초대사량·하루 칼로리', sub: '결손을 만들 기준 숫자' }, { href: '/steps/', title: '걸음 수 칼로리', sub: '만보는 몇 칼로리' }, { href: '/guide/bmr-diet/', title: '기초대사량보다 적게 먹으면 왜 살이 안 빠지나', sub: '서재' }]))}` }));

  /* ---------- 나이별 권장 칼로리 ---------- */
  write('/kcal-need/', shell({ url: '/kcal-need/', title: '나이별 하루 권장 칼로리표 — 남녀 1세부터 75세 이상까지 (한국인 영양소 섭취기준 2020)', desc: '한국인 영양소 섭취기준(2020)의 에너지 필요추정량을 나이·성별로 정리했습니다. 성인 남성 19~29세 2,600kcal, 여성 2,000kcal 등. 내 몸에 맞춘 값은 기초대사량 계산기에서.', nav: 'bmr', body: `
${crumb([['/bmr/', '대사량'], [null, '나이별 권장 칼로리']])}
<h1 class="title">나이별 하루 권장 칼로리</h1>
<p class="meta">한국인 영양소 섭취기준(2020) 에너지 필요추정량 · 보통 활동 · kcal</p>
${tiles([{ label: '남 19~29세', value: '2,600' }, { label: '여 19~29세', value: '2,000' }, { label: '남/여 30~49세', value: '2,500/1,900' }])}
${lead('보건복지부·한국영양학회가 정한 기준 체격과 보통 활동량을 가정한 평균값입니다. 같은 나이라도 키·몸무게·활동량에 따라 ±300kcal 이상 차이 나므로, 내 값은 기초대사량 계산기로 구하는 것이 정확합니다.')}
${section('나이·성별', 'kcal/일', table(['나이', '남', '여'], X.KCAL_NEED.map(([a, m, f]) => ({ cells: [a, num(m), num(f)] }))))}
${ad()}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>임신·수유부는 더 필요합니다.</b> 임신 2분기 +340kcal, 3분기 +450kcal, 수유 중 +340kcal(한국인 영양소 섭취기준).</p>
<p><b>65세 이상은 줄어들지만 단백질은 유지.</b> 근육 손실을 막기 위해 몸무게 1kg당 1~1.2g의 단백질이 권장됩니다.</p>
<p><b>청소년 남자 15~18세가 가장 많이 먹어야 하는 시기</b>(2,700kcal)입니다. 다이어트를 한다면 이 시기는 피하세요.</p>
</div>`)}
${section('이어서', null, list([{ href: '/bmr/', title: '기초대사량 계산기', sub: '내 키·몸무게·활동량으로' }, { href: '/water/', title: '물 · 단백질 권장량', sub: '몸무게별' }, { href: '/food/', title: '음식 칼로리 사전', sub: '하루 섭취량을 채우는 음식' }]))}
<p class="note">「2020 한국인 영양소 섭취기준」(보건복지부·한국영양학회)의 에너지 필요추정량을 100kcal 단위로 정리했습니다. 개인의 필요량은 체격·활동량·건강 상태에 따라 다릅니다.</p>` }));
}
