/* 바디집 정적 사이트 생성기 — node tools/build.mjs → dist/
 * BMI(키×몸무게)·정상 체중·기초대사량·체지방·음식 칼로리·운동 소모 칼로리·출산예정일·배란일·아기 개월수/예방접종·물 섭취량 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as B from '../engine/body.mjs';
import * as K from '../engine/kcal.mjs';
import * as D from '../engine/dates.mjs';
import * as X from '../engine/extra.mjs';
import * as I from '../engine/ics.mjs';
import * as P from '../engine/pet.mjs';
import { num, pct } from '../engine/fmt.mjs';
import { FOODS, FOOD_CATS, FOODS_ASOF, FOOD_ALIAS } from '../data/foods.mjs';
import { EXERCISES, EX_ALIAS } from '../data/exercises.mjs';
import { makeBundle } from './bundle.mjs';
import { buildExtra, STEPS, WAKES, FATHERS, MOTHERS, DIET_KG, DRINK_PAGES, DRINK_COUNTS, BABY_MONTHS } from './pages-extra.mjs';
import { buildPet, DOG_YEARS, CAT_YEARS, DOG_KG, CAT_KG } from './pages-pet.mjs';
import { buildMore, PCT_MONTHS, CAFFEINE_PAGES, CAFFEINE_COUNTS, QUIT_DAYS } from './pages-more.mjs';
import { buildCheckup, SYS, DIA, GLU, TC, LDL, HDL, TG, ALT, URIC } from './pages-checkup.mjs';
import { buildKids } from './pages-kids.mjs';
import { buildFormula } from './pages-formula.mjs';
import * as FM from '../engine/formula.mjs';
import { buildPregWeight } from './pages-pregweight.mjs';
import * as PW from '../engine/pregweight.mjs';
import { buildBpLog } from './pages-bplog.mjs';
import * as KD from '../engine/kids.mjs';
import { GUIDES } from '../data/guides.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');
const SITE = 'https://bodyzip.com';
const DOMAIN_READY = true;                          /* 도메인 연결 뒤 true → CNAME 생성 */
const GA_ID = 'G-QFFQZVRKQJ';                   /* GA4 측정 ID */
const ADSENSE = 'ca-pub-9924140539322407';
/* 검색엔진 소유권 확인 태그 — 사용자가 서치콘솔·서치어드바이저에서 받은 값 */
const VERIFY = [
  '<meta name="google-site-verification" content="BmKABvMzaldm5ivGRxxdylslRPgulwiDNnL5Iculrqw">',
  '<meta name="naver-site-verification" content="9f06f0a8ddadf03eb6d3170a3a51626954f8a03a" />',
];
const SISTERS = { donpyo: 'https://donpyo.com', saju: 'https://sajucheop.com' };
const OG_KEYS = new Set(fs.existsSync(path.join(SRC, 'og')) ? fs.readdirSync(path.join(SRC, 'og')).filter((f) => f.endsWith('.png')).map((f) => f.replace('.png', '')) : []);
const kst = new Date(Date.now() + 9 * 3600 * 1000);
const TODAY = D.utc(kst.getUTCFullYear(), kst.getUTCMonth() + 1, kst.getUTCDate());
const YEAR = TODAY.getUTCFullYear();
const BUILD_ISO = D.iso(TODAY);
const t0 = Date.now();
const urls = [];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v, unit = '') => `<span class="num">${typeof v === 'number' ? num(v) : v}${unit}</span>`;
const CHEV = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" stroke="#8A948E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
const LOGO = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="6.5" width="19" height="11" rx="2.5" stroke="#1F6F6B" stroke-width="1.6"></rect><path d="M6.5 6.5v4M10 6.5v6M13.5 6.5v4M17 6.5v6" stroke="#1F6F6B" stroke-width="1.6" stroke-linecap="round"></path></svg>';
const pad = (x) => String(x).padStart(2, '0');

function write(url, html) {
  const dir = path.join(OUT, url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  urls.push(url);
}

function shell(o) {
  const GA = GA_ID ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script><script>if(location.hostname.indexOf('localhost')<0&&location.hostname.indexOf('127.0.0.1')<0&&location.protocol!=='file:'){window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');}</script>\n` : '';
  const ADS = ADSENSE && !o.bare ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}" crossorigin="anonymous"></script>\n` : '';
  const ld = o.ld || { '@context': 'https://schema.org', '@type': 'WebPage', name: o.title, description: o.desc, url: SITE + o.url, inLanguage: 'ko', isPartOf: { '@type': 'WebSite', name: '바디집', url: SITE } };
  const on = (k) => o.nav === k ? ' class="on"' : '';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
${GA}${ADS}<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
${VERIFY.join('\n')}
<link rel="canonical" href="${SITE}${o.url}">
${o.noindex ? '<meta name="robots" content="noindex">\n' : ''}<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<link rel="stylesheet" href="/css/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}${o.url}">
<meta property="og:image" content="${SITE}/og/${OG_KEYS.has(o.og || o.nav) ? (o.og || o.nav) : 'home'}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
</head>
<body${o.bare ? ' class="bare"' : ''}>
${o.bare ? o.body : `<div class="app">
<header class="hdr">
  <a class="brand" href="/">${LOGO}<span class="brand-name">바디집</span></a>
  <nav class="nav"><a href="/bmi/"${on('bmi')}>BMI</a><a href="/bmr/"${on('bmr')}>대사량</a><a href="/food/"${on('food')}>칼로리</a><a href="/exercise/"${on('exercise')}>운동</a><a href="/due-date/"${on('preg')}>임신</a><a href="/baby/"${on('baby')}>아기</a><a href="/today/"${on('today')}>오늘</a><a href="/checkup/"${on('checkup')}>검진</a><a href="/pet/"${on('pet')}>반려</a><a href="/guide/"${on('guide')}>서재</a></nav>
  <span class="year-pill">${YEAR}</span>
</header>
${o.body}
<footer class="foot">
  <div class="frow"><span>© 바디집 · 갱신 ${BUILD_ISO}</span><nav><a href="/guide/">서재</a><a href="/embed/">위젯</a><a href="/method/">계산 기준</a><a href="/about/">소개</a><a href="/terms/">이용약관</a><a href="/privacy/">개인정보</a><a href="${SISTERS.donpyo}/">돈표</a><a href="${SISTERS.saju}/">사주첩</a></nav></div>
  <p class="fnote">계산 결과는 참고용입니다. 건강 상태와 체성분에 따라 실제와 다를 수 있으며, 진단이나 치료를 대신하지 않습니다.</p>
</footer>
</div>`}
<script src="/js/app.js" defer></script>
${(o.scripts || []).map((s) => `<script src="${s}" defer></script>`).join('\n')}
</body>
</html>`;
}

/* ---------- 조각 ---------- */
const crumb = (items) => `<div class="crumb">${items.map(([h, t]) => h ? `<a href="${h}">${t}</a>` : `<span>${t}</span>`).join('<span>›</span>')}</div>`;
const hero = (o) => `<div class="hero"><div class="hero-label">${o.label}</div><div class="hero-num"><span class="num">${o.value}</span><span class="unit">${o.unit == null ? '' : o.unit}</span></div><div class="hero-sub">${o.sub}</div>${o.bars ? `<div class="bar">${o.bars.map((w) => `<i style="width:${(w * 100).toFixed(1)}%"></i>`).join('')}</div><div class="bar-legend"><span>${o.legendL}</span><span>${o.legendR}</span></div>` : ''}</div>`;
const led = (title, unit, rows) => `<div class="ledger"><div class="lg-head"><h2>${title}</h2><span>${unit}</span></div>${rows.map((r) => `<div class="lg-row"><div class="lbl"><span>${r[0]}</span>${r[2] ? `<small>${r[2]}</small>` : ''}</div><span class="num">${r[1]}</span></div>`).join('')}</div>`;
const tiles = (items) => `<div class="tiles${items.some((t) => String(t.value).length >= 11) ? ' tiles-wide' : ''}">${items.map((t) => `<div class="tile"><small>${t.label}</small><span class="num">${t.value}</span></div>`).join('')}</div>`;
const chips = (items) => `<div class="chips">${items.map((c) => c.on ? `<span class="chip on"><small>${c.label}</small><span class="num">${c.value}</span></span>` : `<a class="chip" href="${c.href}"><small>${c.label}</small><span class="num">${c.value}</span></a>`).join('')}</div>`;
const cells = (items, cols = 3) => `<div class="grid${cols === 2 ? ' grid-2' : cols === 4 ? ' grid-4' : ''}">${items.map((c) => c.on ? `<span class="cell on"><small>${c.label}</small><span class="num">${c.value}</span></span>` : `<a class="cell" href="${c.href}"><small>${c.label}</small><span class="num">${c.value}</span></a>`).join('')}</div>`;
const list = (items) => `<div class="list">${items.map((i) => `<a href="${i.href}"><span class="t"><b>${i.title}</b>${i.sub ? `<small>${i.sub}</small>` : ''}</span>${i.value != null ? `<span class="num">${i.value}</span>` : CHEV}</a>`).join('')}</div>`;
const section = (title, sub, inner) => `<section class="section"><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}${inner}</section>`;
const ad = () => `<div class="adslot" aria-hidden="true"></div>`;
const lead = (s) => `<p class="lead">${s}</p>`;
const table = (head, rows) => `<div class="tbl"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr${r.cls ? ` class="${r.cls}"` : ''}>${r.cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const nearest = (arr, v) => arr.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
const neighbors = (arr, v, k = 2) => { const i = arr.indexOf(v); return arr.slice(Math.max(0, i - k), i + k + 1); };
const k1 = (x) => Math.round(x * 10) / 10;
const NOTE_BMI = `<p class="note">BMI 판정은 대한비만학회 「비만 진료지침 2022」의 아시아·한국인 기준(저체중 18.5 미만, 정상 18.5~22.9, 비만 전단계 23~24.9, 1단계 비만 25~29.9, 2단계 30~34.9, 3단계 35 이상)입니다. 근육량이 많으면 BMI가 높아도 비만이 아닐 수 있고, 허리둘레(남 90cm·여 85cm 이상 복부비만)를 함께 봅니다. 기초대사량은 Mifflin-St Jeor 식입니다. <a href="/method/">계산 기준 보기</a></p>`;

/* ---------- 격자 ---------- */
const HEIGHTS = []; for (let h = 140; h <= 200; h++) HEIGHTS.push(h);
const WMIN = 40, WMAX = 120;
const WEIGHTS = []; for (let w = WMIN; w <= WMAX; w++) WEIGHTS.push(w);
const WATER_KG = []; for (let w = 40; w <= 120; w += 5) WATER_KG.push(w);
const AGES = [20, 30, 40, 50, 60];
const bmiUrl = (h, w) => w ? `/bmi/${h}/${w}/` : `/bmi/${h}/`;
const foodUrl = (s) => `/food/${s}/`;
const exUrl = (s) => `/exercise/${s}/`;
const EX = Object.fromEntries(EXERCISES.map((e) => [e.slug, e]));
const grid = () => `<script>window.BODYZIP_GRID=${JSON.stringify({ heights: HEIGHTS, wmin: WMIN, wmax: WMAX, water: WATER_KG, foods: FOODS.map((f) => ({ ks: [f.name.replace(/\s*\(.*?\)|\s*\d.*$| 한 .*$| 1개.*$| 1잔.*$| 1병.*$| 1봉.*$| 1장.*$| 1조각.*$/g, '').trim().toLowerCase()].concat(FOOD_ALIAS[f.slug] || []), name: f.name, slug: f.slug })), kidsRange: Object.fromEntries(['m', 'f'].flatMap((s) => KD.KIDS_AGES.map((y) => [(s === 'f' ? 'girl' : 'boy') + y, KD.kidsHeightRange(s, y)]))), kcal: Object.fromEntries(FOODS.map((f) => [f.slug, f.kcal])), exercises: EXERCISES.map((e) => ({ ks: [e.short.toLowerCase()].concat(EX_ALIAS[e.slug] || []), name: e.short, slug: e.slug })), months: BABY_MONTHS, wakes: WAKES, fathers: [FATHERS[0], FATHERS[FATHERS.length - 1]], mothers: [MOTHERS[0], MOTHERS[MOTHERS.length - 1]], steps: [STEPS[0], STEPS[STEPS.length - 1]], diet: [DIET_KG[0], DIET_KG[DIET_KG.length - 1]], drinks: DRINK_PAGES, counts: [DRINK_COUNTS[0], DRINK_COUNTS[DRINK_COUNTS.length - 1]], dogYears: [DOG_YEARS[0], DOG_YEARS[DOG_YEARS.length - 1]], catYears: [CAT_YEARS[0], CAT_YEARS[CAT_YEARS.length - 1]], dogKg: [DOG_KG[0], DOG_KG[DOG_KG.length - 1]], catKg: [CAT_KG[0], CAT_KG[CAT_KG.length - 1]], pctMonths: [PCT_MONTHS[0], PCT_MONTHS[PCT_MONTHS.length - 1]], caffeine: CAFFEINE_PAGES, quitDays: QUIT_DAYS, sys: SYS, dia: DIA, glu: GLU, tc: TC, ldl: LDL, hdl: HDL, tg: TG, alt: ALT, uric: URIC })}</script>`;

/* ---------- BMI 키×몸무게 ---------- */
function bmiPage(h, w) {
  const url = bmiUrl(h, w), b = B.bmiOf(h, w), r = B.normalRange(h), tn = B.toNormal(h, w);
  const swM = B.standardWeight(h, 'm'), swF = B.standardWeight(h, 'f');
  const title = `키 ${h}cm 몸무게 ${w}kg — BMI ${b.bmi} ${b.label.replace(/\s*\(.*\)/, '')} · 정상 체중 ${r.min}~${r.max}kg`;
  const desc = `키 ${h}cm에 몸무게 ${w}kg이면 BMI ${b.bmi}로 ${b.label}입니다. 정상 체중 범위 ${r.min}~${r.max}kg, 표준체중 남 ${swM}kg·여 ${swF}kg${tn.dir === 'ok' ? '' : `, 정상까지 ${tn.kg}kg ${tn.dir === 'lose' ? '감량' : '증량'}`}. 나이별 기초대사량·하루 칼로리, 운동 소모 칼로리, 물 섭취량까지.`;
  const wt = B.water(w), pr = B.protein(w);
  const dur = (kg, d = 500) => { const wk = B.weeksFor(kg, d); return wk < 2 ? `${Math.ceil(kg * 7700 / d)}일` : `${wk}주`; };
  const m2 = Math.pow(h / 100, 2), up = k1(23 * m2 - w), down = k1(w - 18.5 * m2);
  const planRows = tn.dir === 'ok' ? [] : [300, 500, 750].map((d) => ({ cells: [`하루 ${num(d)}kcal ${tn.dir === 'lose' ? '덜' : '더'} 먹기`, dur(tn.kg, d), `${k1(d * 7 / 7700)}kg`] }));
  const bmrRows = AGES.map((a) => { const bm = B.bmr('m', h, w, a), bf = B.bmr('f', h, w, a); return { cells: [`${a}세`, num(bm), num(B.tdee(bm, 'light')), num(bf), num(B.tdee(bf, 'light'))] }; });
  const body = `
${crumb([['/bmi/', 'BMI'], [bmiUrl(h), `${h}cm`], [null, `${w}kg`]])}
<h1 class="title">키 ${h}cm · 몸무게 ${w}kg</h1>
<p class="meta">BMI ${b.bmi} — ${b.label} · 대한비만학회 기준 · 남녀 공통</p>
${lead(`키 ${h}cm에 몸무게 ${w}kg이면 체질량지수(BMI)는 ${b.bmi}로 <b>${b.label}</b>에 해당합니다. 이 키의 정상 체중 범위는 ${r.min}~${r.max}kg이고, 표준체중은 남성 ${swM}kg·여성 ${swF}kg입니다. ${tn.dir === 'ok' ? `정상 범위 안이라 지금 몸무게를 유지하면 됩니다. ${up < 0.5 ? '다만 범위의 위쪽 끝이라 조금만 늘어도 비만 전단계입니다.' : down < 0.5 ? '다만 범위의 아래쪽 끝이라 조금만 줄어도 저체중입니다.' : `위로 ${up}kg, 아래로 ${down}kg 여유가 있습니다.`}` : tn.dir === 'lose' ? `정상 범위에 들어가려면 ${tn.kg}kg을 빼야 하고, 하루 500kcal씩 줄이면 약 ${dur(tn.kg)} 걸립니다.` : `정상 범위에 들어가려면 ${tn.kg}kg을 늘려야 하고, 하루 500kcal씩 더 먹으면 약 ${dur(tn.kg)} 걸립니다.`}`)}
${hero({ label: '체질량지수 (BMI)', value: b.bmi, unit: '', sub: `${b.label} · 정상 18.5~22.9 · 몸무게 ÷ 키(m)² = ${w} ÷ ${(h / 100).toFixed(2)}²`, bars: [Math.min(1, b.bmi / 40)], legendL: '0', legendR: '40' })}
${tiles([{ label: '정상 체중 범위', value: `${r.min}~${r.max}kg` }, { label: '표준체중 (남)', value: `${swM}kg` }, { label: '표준체중 (여)', value: `${swF}kg` }])}
${tn.dir === 'ok' ? section('정상 범위 안', null, `<div class="callout">지금 몸무게는 정상 범위 안입니다. <b>${up < 0.5 ? '0.5kg 미만' : up + 'kg'}</b> 더 늘면 비만 전단계, <b>${down < 0.5 ? '0.5kg 미만' : down + 'kg'}</b> 줄면 저체중이 됩니다. 체중보다 허리둘레(남 90cm·여 85cm 미만)와 근육량을 챙기는 것이 건강에는 더 중요합니다.</div>`) : section(tn.dir === 'lose' ? `정상 범위까지 ${tn.kg}kg 감량` : `정상 범위까지 ${tn.kg}kg 증량`, '체지방 1kg ≈ 7,700kcal · 하루 결손(또는 잉여)량으로 나눈 기간', table(['방법', '걸리는 기간', '1주에'], planRows) + `<div class="callout">${tn.dir === 'lose' ? '한 주에 1kg 넘게 빼면 근육이 함께 빠지고 요요가 오기 쉽습니다. 0.5~1kg이 안전한 속도입니다. 하루 500kcal 줄이기 = 밥 반 공기 + 간식 하나 정도입니다.' : '근육으로 늘리려면 단백질을 몸무게 1kg당 1.2~1.6g 먹고 근력 운동을 곁들이세요.'}</div>`)}
${section('기초대사량과 하루 필요 칼로리', `키 ${h}cm · ${w}kg 기준 · Mifflin-St Jeor · 하루 칼로리는 '가벼운 활동(주 1~3회 운동)' 기준`, table(['나이', '남 기초대사량', '남 하루 필요', '여 기초대사량', '여 하루 필요'], bmrRows) + list([{ href: '/bmr/', title: '활동량·목표를 바꿔 직접 계산', sub: '감량·유지·증량 섭취 칼로리' }]))}
${section('이 몸무게로 30분 운동하면', 'kcal · MET 기준', tiles([{ label: '걷기 (보통)', value: num(K.burn(EX.walking.met, w, 30)) }, { label: '달리기 (8km/h)', value: num(K.burn(EX['running-8'].met, w, 30)) }, { label: '자전거', value: num(K.burn(EX.cycling.met, w, 30)) }]) + list([{ href: '/exercise/', title: '운동별 소모 칼로리표', sub: `${EXERCISES.length}가지 운동 × 몸무게 × 시간` }]))}
${ad()}
${section('물과 단백질', `${w}kg 기준 하루 권장`, tiles([{ label: '물', value: `${num(wt.ml)}ml` }, { label: '컵 (200ml)', value: `${wt.cups}잔` }, { label: '단백질', value: `${pr.base}~${pr.active}g` }]))}
${section('몸무게가 바뀌면', `키 ${h}cm`, chips(neighbors(WEIGHTS, w, 3).map((x) => ({ label: `${x}kg`, value: B.bmi(h, x), href: bmiUrl(h, x), on: x === w }))))}
${section('키가 바뀌면', `${w}kg`, chips([-10, -5, -3, 0, 3, 5, 10].map((d) => h + d).filter((x) => HEIGHTS.includes(x)).map((x) => ({ label: `${x}cm`, value: B.bmi(x, w), href: bmiUrl(x, w), on: x === h }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>BMI는 근육을 모릅니다.</b> 같은 ${w}kg이라도 근육이 많은 사람과 체지방이 많은 사람의 건강 상태는 다릅니다. BMI가 23~25인데 허리둘레가 정상이고 운동을 하는 사람은 걱정할 필요가 적습니다. <a href="/bodyfat/">체지방률</a>을 함께 보세요.</p>
<p><b>한국 기준은 세계 기준보다 엄격합니다.</b> WHO는 25 이상을 과체중, 30 이상을 비만으로 보지만 아시아인은 같은 BMI에서 당뇨·고혈압 위험이 더 높아 대한비만학회는 23·25를 씁니다.</p>
<p><b>건강검진 결과표의 판정</b>도 같은 기준입니다. "비만 전단계"는 병이 아니라 관리 구간이라는 뜻이고, 5%만 감량해도(${w}kg이면 ${k1(w * 0.05)}kg) 혈압·혈당이 눈에 띄게 좋아진다는 연구가 많습니다.</p>
</div>`)}
${NOTE_BMI}`;
  write(url, shell({ url, title, desc, body, nav: 'bmi' }));
}

function heightPage(h) {
  const url = bmiUrl(h), r = B.normalRange(h), swM = B.standardWeight(h, 'm'), swF = B.standardWeight(h, 'f');
  const rows = []; for (let w = WMIN; w <= WMAX; w += 2) { const b = B.bmiOf(h, w); rows.push({ cls: b.key === 'ok' ? 'on' : '', cells: [`<a href="${bmiUrl(h, w)}">${w}kg</a>`, String(b.bmi), b.label] }); }
  const title = `키 ${h}cm 정상 체중 ${r.min}~${r.max}kg — 표준체중 남 ${swM}kg·여 ${swF}kg, 몸무게별 BMI표`;
  const desc = `키 ${h}cm의 정상 체중은 ${r.min}~${r.max}kg(BMI 18.5~22.9), 표준체중은 남 ${swM}kg·여 ${swF}kg입니다. 몸무게 ${WMIN}~${WMAX}kg별 BMI와 판정, 나이별 기초대사량을 표로 정리했습니다.`;
  const body = `
${crumb([['/bmi/', 'BMI'], [null, `${h}cm`]])}
<h1 class="title">키 ${h}cm — 정상 체중과 몸무게별 BMI</h1>
<p class="meta">정상 ${r.min}~${r.max}kg · 표준체중 남 ${swM}kg · 여 ${swF}kg · 브로카 ${B.broca(h)}kg</p>
${lead(`키 ${h}cm이면 BMI 18.5~22.9에 해당하는 정상 체중은 ${r.min}kg에서 ${r.max}kg 사이입니다. 표준체중(BMI 22·21)은 남성 ${swM}kg, 여성 ${swF}kg이고, ${k1(23 * Math.pow(h / 100, 2))}kg부터 비만 전단계, ${k1(25 * Math.pow(h / 100, 2))}kg부터 1단계 비만으로 봅니다.`)}
${hero({ label: '정상 체중 범위', value: `${r.min}~${r.max}`, unit: 'kg', sub: `BMI 18.5~22.9 · 표준체중 남 ${swM}kg · 여 ${swF}kg` })}
<form class="quick" data-quick="hw"><label>몸무게를 넣으면 바로</label><div class="quick-row"><div class="quick-in"><input type="hidden" name="h" value="${h}"><input name="w" type="text" inputmode="numeric" placeholder="65"><span>kg</span></div><button class="btn" type="submit">BMI 보기</button></div></form>
${section('몸무게별 BMI', `키 ${h}cm · 2kg 간격 · 몸무게를 누르면 상세`, table(['몸무게', 'BMI', '판정'], rows))}
${ad()}
${section('구간 경계', null, tiles([{ label: '이 아래는 저체중', value: `${k1(18.5 * Math.pow(h / 100, 2))}kg` }, { label: '여기부터 비만 전단계', value: `${k1(23 * Math.pow(h / 100, 2))}kg` }, { label: '여기부터 1단계 비만', value: `${k1(25 * Math.pow(h / 100, 2))}kg` }]))}
${section('기초대사량 (표준체중 기준)', `남 ${swM}kg · 여 ${swF}kg`, table(['나이', '남 기초대사량', '여 기초대사량'], AGES.map((a) => ({ cells: [`${a}세`, num(B.bmr('m', h, swM, a)), num(B.bmr('f', h, swF, a))] }))))}
${section('키가 바뀌면', '정상 체중 범위', chips(neighbors(HEIGHTS, h, 3).map((x) => { const rr = B.normalRange(x); return { label: `${x}cm`, value: `${rr.min}~${rr.max}`, href: bmiUrl(x), on: x === h }; })))}
${NOTE_BMI}`;
  write(url, shell({ url, title, desc, body, nav: 'bmi' }));
}

function bmiIndex() {
  const rows = HEIGHTS.filter((h) => h % 5 === 0).map((h) => { const r = B.normalRange(h); return { cells: [`<a href="${bmiUrl(h)}">${h}cm</a>`, `${r.min}~${r.max}`, String(B.standardWeight(h, 'm')), String(B.standardWeight(h, 'f'))] }; });
  const body = `
${crumb([['/', '홈'], [null, 'BMI']])}
<h1 class="title">BMI 계산표 — 키별 정상 체중과 표준체중</h1>
<p class="meta">대한비만학회 2022 기준 · 키 140~200cm · 몸무게 ${WMIN}~${WMAX}kg</p>
<form class="quick" data-quick="hw"><label>키와 몸무게로 바로 찾기</label><div class="quick-row"><div class="quick-in"><input name="h" type="text" inputmode="numeric" placeholder="170"><span>cm</span></div><div class="quick-in"><input name="w" type="text" inputmode="numeric" placeholder="65"><span>kg</span></div><button class="btn" type="submit">BMI 보기</button></div></form>
${lead('BMI(체질량지수)는 몸무게(kg)를 키(m)의 제곱으로 나눈 값입니다. 한국 기준으로 18.5 미만은 저체중, 18.5~22.9 정상, 23~24.9 비만 전단계, 25 이상 비만입니다. 키를 누르면 몸무게별 BMI 표와 나이별 기초대사량이 나옵니다.')}
${section('키별 정상 체중', 'kg · 5cm 간격 (사이 키는 검색창에)', table(['키', '정상 체중', '표준체중 남', '표준체중 여'], rows))}
${ad()}
${section('판정 기준', '대한비만학회 비만 진료지침 (아시아·한국인)', table(['BMI', '판정', '뜻'], [{ cells: ['18.5 미만', '저체중', '영양 부족·골다공증 위험'] }, { cells: ['18.5 ~ 22.9', '정상', '유지'] }, { cells: ['23 ~ 24.9', '비만 전단계', '과체중 · 관리 구간'] }, { cells: ['25 ~ 29.9', '1단계 비만', '식이·운동 개선 필요'] }, { cells: ['30 ~ 34.9', '2단계 비만', '의학적 관리 권장'] }, { cells: ['35 이상', '3단계 비만', '고도비만 · 치료 대상'] }]))}
${section('자주 묻는 것', null, `<div class="doc">
<p><b>표준체중과 정상 체중은 다른가요?</b> 표준체중은 BMI 22(남)·21(여)에 해당하는 한 점이고, 정상 체중은 BMI 18.5~22.9 범위입니다. "적정 체중"은 보통 이 범위를 말합니다.</p>
<p><b>미용 체중이라는 것도 있나요?</b> 의학 기준은 아니고, 흔히 BMI 19~20 정도를 말합니다. 정상 범위 아래쪽이라 무리하게 맞출 필요는 없습니다.</p>
<p><b>어린이·청소년도 같은 기준인가요?</b> 아닙니다. 만 18세 이하는 성별·나이별 성장도표의 백분위수(95 이상 비만)를 씁니다. 이 표는 성인 기준입니다.</p>
</div>`)}
${NOTE_BMI}`;
  write('/bmi/', shell({ url: '/bmi/', title: `BMI 계산표 — 키별 정상 체중·표준체중과 몸무게별 판정 (${YEAR})`, desc: '키 140~200cm의 정상 체중 범위와 표준체중, 몸무게별 BMI 판정을 대한비만학회 기준으로 정리했습니다. 키와 몸무게만 넣으면 바로 나옵니다.', body, nav: 'bmi' }));
}

/* ---------- 기초대사량 · 체지방 (그 자리 계산) ---------- */
function bmrPage() {
  const rows = [['m', 170, 65], ['m', 175, 75], ['m', 180, 80], ['f', 155, 50], ['f', 160, 55], ['f', 165, 60]].map(([s, h, w]) => { const b = B.bmr(s, h, w, 30); return { cells: [`${s === 'm' ? '남' : '여'} ${h}cm ${w}kg`, num(b), num(B.tdee(b, 'sedentary')), num(B.tdee(b, 'light')), num(B.tdee(b, 'moderate'))] }; });
  const body = `
${crumb([['/', '홈'], [null, '기초대사량']])}
<h1 class="title">기초대사량과 하루 필요 칼로리</h1>
<p class="meta">Mifflin-St Jeor 식 · 활동량별 · 감량·증량 섭취 칼로리 · 이 기기 안에서만 계산</p>
<form class="quick live" data-live="bmr" style="margin-top:16px">
<div class="live-head"><b>직접 계산</b><span>바꾸면 바로</span></div>
<div class="ye-grid">
<label class="ye-f"><span>성별</span><select data-k="sex"><option value="m">남</option><option value="f">여</option></select></label>
<label class="ye-f"><span>나이</span><input data-k="age" type="text" inputmode="numeric" value="30"></label>
<label class="ye-f"><span>키 (cm)</span><input data-k="h" type="text" inputmode="numeric" value="170"></label>
<label class="ye-f"><span>몸무게 (kg)</span><input data-k="w" type="text" inputmode="numeric" value="65"></label>
<label class="ye-f" style="grid-column: span 2"><span>활동량</span><select data-k="act">${B.ACTIVITY.map((a) => `<option value="${a.key}"${a.key === 'light' ? ' selected' : ''}>${a.label}</option>`).join('')}</select></label>
</div>
<div class="tiles"><div class="tile"><small>기초대사량</small><span class="num" data-out="bmr"></span></div><div class="tile"><small>하루 필요 (유지)</small><span class="num" data-out="tdee"></span></div><div class="tile"><small>감량 섭취 (−500)</small><span class="num" data-out="lose"></span></div></div>
<div class="tiles"><div class="tile"><small>증량 섭취 (+300)</small><span class="num" data-out="gain"></span></div><div class="tile"><small>단백질 권장</small><span class="num" data-out="protein"></span></div><div class="tile"><small>BMI</small><span class="num" data-out="bmi"></span></div></div>
<div class="live-foot"><span>Harris-Benedict 식으로는 기초대사량 <b class="num" data-out="hb"></b>kcal</span><span>감량 섭취는 기초대사량 아래로 내리지 않습니다</span></div>
</form>
${lead('기초대사량(BMR)은 아무것도 하지 않고 누워만 있어도 몸이 쓰는 에너지입니다. 여기에 활동량 계수를 곱한 것이 하루 필요 칼로리(TDEE)이고, 이보다 적게 먹으면 빠지고 많이 먹으면 늘어납니다. 하루 500kcal을 줄이면 한 주에 약 0.5kg이 빠집니다.')}
${section('예시', '30세 · kcal', table(['조건', '기초대사량', '거의 안 움직임', '가벼운 활동', '보통 활동'], rows))}
${ad()}
${section('활동량 계수', null, table(['활동량', '계수', '기준'], B.ACTIVITY.map((a) => ({ cells: [a.label.split(' (')[0], String(a.f), a.label.includes('(') ? a.label.split('(')[1].replace(')', '') : ''] }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>기초대사량보다 적게 먹지 마세요.</b> 장기간 BMR 아래로 먹으면 근육이 빠지고 대사가 떨어져 오히려 살이 안 빠지는 몸이 됩니다. 감량은 TDEE에서 300~500kcal을 빼는 선이 안전합니다.</p>
<p><b>식은 두 가지가 있습니다.</b> Mifflin-St Jeor(1990)는 현대인에게 가장 잘 맞는다고 평가돼 기본으로 쓰고, Harris-Benedict(1919·1984 개정)는 비교용으로 함께 보여줍니다. 둘의 차이는 보통 5% 안입니다.</p>
<p><b>근육이 많으면 실제 대사량은 더 높습니다.</b> 식은 평균적인 체성분을 가정하므로 체지방률을 알면 <a href="/bodyfat/">Katch-McArdle 방식</a>이 더 정확합니다.</p>
</div>`)}
${section('이어서 계산하기', null, list([{ href: '/bmi/', title: 'BMI · 정상 체중', sub: '키·몸무게별 판정' }, { href: '/food/', title: '음식 칼로리 사전', sub: '하루 섭취량을 채우는 음식들' }, { href: '/exercise/', title: '운동 소모 칼로리', sub: '몸무게·시간별' }]))}
${NOTE_BMI}`;
  write('/bmr/', shell({ url: '/bmr/', title: '기초대사량 계산기 — 하루 필요 칼로리와 감량·증량 섭취량', desc: '성별·나이·키·몸무게·활동량을 넣으면 기초대사량(Mifflin-St Jeor)과 하루 필요 칼로리, 감량·증량 섭취 칼로리, 단백질 권장량이 바로 나옵니다.', body, nav: 'bmr', scripts: ['/js/engine.js', '/js/live.js'] }));
}

function bodyfatPage() {
  const body = `
${crumb([['/', '홈'], [null, '체지방률']])}
<h1 class="title">체지방률 계산 — 줄자로 재는 미 해군 공식</h1>
<p class="meta">키·허리·목(여성은 엉덩이 추가) 둘레로 추정 · 인바디 없이 · 오차 ±3~4%p</p>
<form class="quick live" data-live="bodyfat" style="margin-top:16px">
<div class="live-head"><b>직접 계산</b><span>cm 단위</span></div>
<div class="ye-grid">
<label class="ye-f"><span>성별</span><select data-k="sex"><option value="m">남</option><option value="f">여</option></select></label>
<label class="ye-f"><span>키 (cm)</span><input data-k="h" type="text" inputmode="numeric" value="175"></label>
<label class="ye-f"><span>허리둘레 (남 배꼽 높이 · 여 가장 잘록한 곳)</span><input data-k="waist" type="text" inputmode="numeric" value="85"></label>
<label class="ye-f"><span>목둘레</span><input data-k="neck" type="text" inputmode="numeric" value="38"></label>
<label class="ye-f" data-row="hip"><span>엉덩이둘레 (가장 넓은 곳)</span><input data-k="hip" type="text" inputmode="numeric" value="95"></label>
<label class="ye-f"><span>몸무게 (kg, 선택)</span><input data-k="w" type="text" inputmode="numeric" value=""></label>
</div>
<div class="tiles"><div class="tile"><small>체지방률</small><span class="num" data-out="pct"></span></div><div class="tile"><small>판정</small><span class="num" data-out="cat"></span></div><div class="tile"><small>체지방량 / 제지방량</small><span class="num"><span data-out="fat">—</span> / <span data-out="lean">—</span></span></div></div>
</form>
${lead('줄자 하나로 체지방률을 어림하는 방법입니다. 미 해군이 신체검사에 쓰는 공식으로, 허리·목·키(여성은 엉덩이) 둘레로 계산하며 인바디와 대체로 ±3~4%p 안에서 맞습니다. 아침 공복에, 줄자를 피부에 붙이되 조이지 않게 재세요.')}
${section('판정 기준', 'ACE(미국운동협의회) 분류', table(['구분', '남성', '여성'], [{ cells: ['필수 지방', '2~5%', '10~13%'] }, { cells: ['운동선수', '6~13%', '14~20%'] }, { cells: ['건강', '14~17%', '21~24%'] }, { cells: ['평균', '18~24%', '25~31%'] }, { cells: ['비만', '25% 이상', '32% 이상'] }]))}
${ad()}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>재는 위치가 전부입니다.</b> 허리는 배꼽 높이에서 숨을 내쉰 뒤, 목은 후두(목젖) 바로 아래, 엉덩이는 가장 넓은 곳입니다. 같은 사람이 아침·저녁에 재면 2cm 이상 차이 나니 조건을 고정하세요.</p>
<p><b>BMI보다 이 숫자가 건강을 더 잘 말해 줍니다.</b> 체중이 정상이어도 체지방률이 높으면(마른 비만) 대사 질환 위험이 있고, 반대로 BMI가 높아도 체지방률이 낮으면 근육형입니다.</p>
<p><b>인바디와 다르면?</b> 인바디는 수분 상태에 따라 흔들리고 이 공식은 둘레 측정 오차에 흔들립니다. 절대값보다 같은 방법으로 잰 변화 추이를 보세요.</p>
</div>`)}
${section('이어서 계산하기', null, list([{ href: '/bmr/', title: '기초대사량·하루 칼로리', sub: '감량 섭취량' }, { href: '/bmi/', title: 'BMI · 정상 체중', sub: '키·몸무게별' }, { href: '/exercise/', title: '운동 소모 칼로리', sub: '몸무게·시간별' }]))}
<p class="note">Hodgdon & Beckett(1984) 미 해군 공식입니다. 임신 중이거나 근육량이 매우 많은 경우 오차가 커집니다. <a href="/method/">계산 기준 보기</a></p>`;
  write('/bodyfat/', shell({ url: '/bodyfat/', title: '체지방률 계산기 — 줄자로 재는 허리·목둘레 공식 (인바디 없이)', desc: '키·허리둘레·목둘레(여성은 엉덩이둘레)로 체지방률을 계산합니다. 미 해군 공식, 남녀 판정 기준, 체지방량과 제지방량.', body, nav: 'bmr', scripts: ['/js/engine.js', '/js/live.js'] }));
}

/* ---------- 음식 칼로리 ---------- */
const BURN_EX = ['walking', 'brisk-walking', 'running-8', 'cycling', 'swimming', 'stairs'];
function foodPage(f) {
  const url = foodUrl(f.slug);
  const same = FOODS.filter((x) => x.cat === f.cat && x.slug !== f.slug).slice(0, 8);
  const tiny = f.kcal < 30;
  const title = tiny ? `${f.name} 칼로리 — ${num(f.kcal)}kcal (${f.serving}) · 칼로리가 거의 없는 음식` : `${f.name} 칼로리 — ${num(f.kcal)}kcal (${f.serving}) · 밥 ${K.bowls(f.kcal)}공기 · 태우려면 걷기 ${K.minutesFor(f.kcal, EX.walking.met, 60)}분`;
  const desc = tiny ? `${f.name}(${f.serving}): 약 ${num(f.kcal)}kcal로 칼로리가 거의 없습니다. 같은 종류 음식과 비교.` : `${f.name}(${f.serving}): 약 ${num(f.kcal)}kcal, 밥 ${K.bowls(f.kcal)}공기와 같습니다.${f.per100 ? ` 100g당 ${num(f.per100)}kcal.` : ''} 60kg 기준 걷기 ${K.minutesFor(f.kcal, EX.walking.met, 60)}분, 달리기 ${K.minutesFor(f.kcal, EX['running-8'].met, 60)}분이면 태웁니다. 같은 종류 음식과 비교.`;
  const burnRows = BURN_EX.map((s) => ({ cells: [EX[s].name].concat([50, 60, 70, 80].map((kg) => `${K.minutesFor(f.kcal, EX[s].met, kg)}분`)) }));
  const body = `
${crumb([['/food/', '음식 칼로리'], [null, f.name]])}
<h1 class="title">${f.name} 칼로리</h1>
<p class="meta">${f.serving} 기준 · ${f.cat} · 식약처 식품영양성분 DB 대략값</p>
${lead(tiny ? `${f.name} ${f.serving} 기준 약 <b>${num(f.kcal)}kcal</b>로 칼로리가 거의 없어 밥 공기·운동 환산이 의미 없습니다. 설탕·시럽·크림이 들어가면 얘기가 달라지니 같은 종류의 다른 음식과 비교해 보세요.` : `${f.name} ${f.serving} 기준 약 <b>${num(f.kcal)}kcal</b>입니다. 밥 한 공기(300kcal)의 ${K.bowls(f.kcal)}배이고, 성인 하루 필요 칼로리(약 2,000kcal)의 ${pct(f.kcal / 2000, 0)}입니다. 60kg인 사람이 걷기로 태우려면 ${K.minutesFor(f.kcal, EX.walking.met, 60)}분, 달리기로는 ${K.minutesFor(f.kcal, EX['running-8'].met, 60)}분이 걸립니다.`)}
${hero({ label: `${f.name} (${f.serving})`, value: num(f.kcal), unit: 'kcal', sub: tiny ? '칼로리가 거의 없는 음식' : `밥 ${K.bowls(f.kcal)}공기 · 하루 2,000kcal의 ${pct(f.kcal / 2000, 0)}${f.per100 ? ` · 100g당 ${num(f.per100)}kcal` : ''}`, bars: [Math.min(1, f.kcal / 2000)], legendL: '0', legendR: '하루 2,000kcal' })}
<div class="btn-row"><button type="button" class="btn btn-share" data-add="${f.slug}" data-name="${f.name}" data-kcal="${f.kcal}">오늘 먹은 것에 담기</button><a class="btn" href="/today/">오늘 담은 것 보기 →</a></div>
${tiny ? '' : section('태우려면', '몸무게별 · 분', table(['운동', '50kg', '60kg', '70kg', '80kg'], burnRows))}
${ad()}
${same.length ? section(`다른 ${f.cat}`, 'kcal', chips(same.map((x) => ({ label: x.name.length > 9 ? x.name.slice(0, 9) + '…' : x.name, value: num(x.kcal), href: foodUrl(x.slug) })))) : ''}
${section('이어서 계산하기', null, list([{ href: '/bmr/', title: '내 하루 필요 칼로리', sub: '이 음식이 하루의 몇 %인지' }, { href: '/exercise/', title: '운동 소모 칼로리표', sub: '몸무게·시간별' }, { href: '/bmi/', title: 'BMI · 정상 체중', sub: '키·몸무게별' }]))}
<p class="note">${FOODS_ASOF} 기준 대략값입니다. 식당·브랜드·조리법·양에 따라 ±20% 이상 차이 날 수 있으니 정확한 값은 제품 영양성분표를 보세요. <a href="/method/">계산 기준 보기</a></p>`;
  write(url, shell({ url, title, desc, body, nav: 'food', scripts: ['/js/today.js'] }));
}

function foodIndex() {
  const body = `
${crumb([['/', '홈'], [null, '음식 칼로리']])}
<h1 class="title">음식 칼로리 사전</h1>
<p class="meta">${FOODS.length}가지 · 1인분 기준 · 밥 공기 환산과 태우는 데 걸리는 시간</p>
<form class="quick" data-quick="smart"><label>음식 이름으로 찾기</label><div class="quick-row"><div class="quick-in"><input type="text" placeholder="치킨, 라면, 아메리카노…" autocomplete="off"></div><button class="btn" type="submit">찾기</button></div><div class="quick-hint" data-hint>예: 치킨 칼로리</div></form>
${lead('자주 먹는 음식의 칼로리를 1인분 기준으로 모았습니다. 숫자보다 "밥 몇 공기"와 "걸어서 몇 분"으로 보면 감이 옵니다. 치킨 한 마리는 밥 6공기가 넘고, 아메리카노는 거의 0입니다.')}
${FOOD_CATS.map((c) => { const items = FOODS.filter((f) => f.cat === c); return items.length ? section(c, null, table(['음식', '1인분', 'kcal', '밥 공기'], items.map((f) => ({ cells: [`<a href="${foodUrl(f.slug)}">${f.name}</a>`, f.serving, num(f.kcal), String(K.bowls(f.kcal))] })))) : ''; }).join('\n')}
${ad()}
<p class="note">${FOODS_ASOF} 기준 대략값(식품의약품안전처 식품영양성분 DB·외식 영양성분 자료). 브랜드·조리법에 따라 다릅니다.</p>`;
  write('/food/', shell({ url: '/food/', title: `음식 칼로리표 — ${FOODS.length}가지 1인분 칼로리와 밥 공기 환산 (${YEAR})`, desc: '치킨·라면·삼겹살·커피·술·과일까지 자주 먹는 음식의 1인분 칼로리를 밥 공기와 걷기 시간으로 환산해 정리했습니다.', body, nav: 'food' }));
}

/* ---------- 운동 소모 칼로리 ---------- */
const EX_KG = [50, 60, 70, 80, 90, 100];
function exercisePage(e) {
  const url = exUrl(e.slug);
  const rows = EX_KG.map((kg) => ({ cells: [`${kg}kg`].concat([10, 30, 60, 90].map((m) => num(K.burn(e.met, kg, m)))) }));
  const foods = ['rice', 'ramen', 'fried-chicken', 'americano', 'latte', 'beer'].map((s) => FOODS.find((f) => f.slug === s));
  const title = `${e.name} 칼로리 소모 — 30분 ${num(K.burn(e.met, 60, 30))}kcal (60kg), 몸무게·시간별 표`;
  const desc = `${e.name}: MET ${e.met}, 60kg 기준 30분에 ${num(K.burn(e.met, 60, 30))}kcal, 1시간에 ${num(K.burn(e.met, 60, 60))}kcal을 씁니다. 몸무게 50~100kg × 10·30·60·90분 표와 치킨·라면·밥을 태우는 데 걸리는 시간.`;
  const body = `
${crumb([['/exercise/', '운동 칼로리'], [null, e.short]])}
<h1 class="title">${e.name} — 소모 칼로리</h1>
<p class="meta">MET ${e.met} · ${e.cat} · 소모 kcal = MET × 3.5 × 몸무게 ÷ 200 × 분</p>
${lead(`${e.name}의 운동 강도 지수(MET)는 ${e.met}입니다. 60kg인 사람이 30분 하면 약 ${num(K.burn(e.met, 60, 30))}kcal, 1시간이면 ${num(K.burn(e.met, 60, 60))}kcal을 씁니다. 몸무게가 무거울수록 같은 시간에 더 많이 태웁니다.`)}
${hero({ label: `30분 소모 (60kg)`, value: num(K.burn(e.met, 60, 30)), unit: 'kcal', sub: `1시간 ${num(K.burn(e.met, 60, 60))}kcal · 70kg이면 30분 ${num(K.burn(e.met, 70, 30))}kcal` })}
${section('몸무게 × 시간', 'kcal', table(['몸무게', '10분', '30분', '1시간', '90분'], rows))}
${section('이걸로 태우려면', '60kg 기준 · 분', table(['음식', 'kcal', '걸리는 시간'], foods.map((f) => ({ cells: [`<a href="${foodUrl(f.slug)}">${f.name}</a>`, num(f.kcal), `${K.minutesFor(f.kcal, e.met, 60)}분`] }))))}
${ad()}
${section('다른 운동', '60kg · 30분 kcal', chips(EXERCISES.filter((x) => x.slug !== e.slug).slice(0, 10).map((x) => ({ label: x.short, value: num(K.burn(x.met, 60, 30)), href: exUrl(x.slug) }))))}
<p class="note">MET는 Compendium of Physical Activities의 대략값이고, 실제 소모량은 강도·체력·자세에 따라 ±30% 차이 납니다. 스마트워치 수치와 다를 수 있습니다. <a href="/method/">계산 기준 보기</a></p>`;
  write(url, shell({ url, title, desc, body, nav: 'exercise' }));
}

function exerciseIndex() {
  const rows = EXERCISES.slice().sort((a, b) => b.met - a.met).map((e) => ({ cells: [`<a href="${exUrl(e.slug)}">${e.name}</a>`, String(e.met), num(K.burn(e.met, 60, 30)), num(K.burn(e.met, 60, 60))] }));
  const body = `
${crumb([['/', '홈'], [null, '운동 칼로리']])}
<h1 class="title">운동별 소모 칼로리표</h1>
<p class="meta">${EXERCISES.length}가지 · 60kg 기준 · 운동을 누르면 몸무게·시간별 표</p>
${lead('같은 30분이라도 걷기는 약 95kcal, 달리기는 260kcal, 줄넘기는 350kcal 가까이 씁니다. 운동 강도 지수(MET)에 몸무게와 시간을 곱해 계산하며, 몸무게가 무거울수록 더 많이 태웁니다.')}
${section('강도 순', 'kcal · 60kg', table(['운동', 'MET', '30분', '1시간'], rows))}
${ad()}
${section('자주 묻는 것', null, `<div class="doc">
<p><b>MET가 뭔가요?</b> 가만히 앉아 있을 때 쓰는 에너지를 1로 두고 그 몇 배인지 나타낸 값입니다. 걷기 3, 달리기 8~10, 줄넘기 11 정도입니다.</p>
<p><b>살을 빼려면 운동이 먼저인가요?</b> 치킨 한 마리(1,900kcal)를 태우려면 60kg인 사람이 3시간을 넘게 뛰어야 합니다. 감량은 식사 조절이 7, 운동이 3이고, 운동은 근육을 지켜 요요를 막는 역할이 큽니다.</p>
<p><b>스마트워치 숫자와 다른데요?</b> 기기는 심박수로 추정하고 여기는 평균 MET로 계산해 ±30% 차이는 정상입니다. 어느 쪽이든 추세를 보는 용도로 쓰세요.</p>
</div>`)}`;
  write('/exercise/', shell({ url: '/exercise/', title: `운동별 소모 칼로리표 — 걷기·달리기·자전거·수영·헬스 30분·1시간 (${YEAR})`, desc: `걷기·달리기·자전거·수영·등산·줄넘기·헬스 등 ${EXERCISES.length}가지 운동의 소모 칼로리를 MET 기준으로 몸무게·시간별로 정리했습니다.`, body, nav: 'exercise' }));
}

/* ---------- 물 · 단백질 ---------- */
function waterPage(kg) {
  const url = `/water/${kg}/`, wt = B.water(kg), pr = B.protein(kg);
  const body = `
${crumb([['/water/', '물 섭취량'], [null, `${kg}kg`]])}
<h1 class="title">${kg}kg — 하루 물 섭취량과 단백질</h1>
<p class="meta">몸무게 × 33ml (30~35ml) · 단백질 0.8~1.4g/kg</p>
${lead(`몸무게 ${kg}kg이면 하루 물 권장량은 약 ${num(wt.ml)}ml, 200ml 컵으로 ${wt.cups}잔입니다. 단백질은 일반 성인 기준 하루 ${pr.base}g, 운동을 하면 ${pr.active}g 안팎이 좋습니다. 커피·차도 수분에 포함되지만, 카페인 음료보다는 물로 채우는 편이 좋습니다.`)}
${hero({ label: '하루 물', value: num(wt.ml), unit: 'ml', sub: `200ml 컵 ${wt.cups}잔 · 500ml 생수 ${k1(wt.ml / 500)}병` })}
${tiles([{ label: '단백질 (일반)', value: `${pr.base}g` }, { label: '단백질 (운동)', value: `${pr.active}g` }, { label: '닭가슴살로', value: `${Math.round(pr.active / 23 * 100)}g` }])}
${section('몸무게가 바뀌면', 'ml', chips(neighbors(WATER_KG, kg, 3).map((x) => ({ label: `${x}kg`, value: num(B.water(x).ml), href: `/water/${x}/`, on: x === kg }))))}
${ad()}
<p class="note">물 30~35ml/kg은 임상에서 널리 쓰는 어림 기준으로, 유럽식품안전청(EFSA)·미국 의학한림원의 하루 총 수분 권장량(여 2.0~2.7L·남 2.5~3.7L)과 비슷한 수준입니다. 신장·심장 질환이 있으면 의사 지시를 따르세요. 단백질 권장 0.8g/kg은 한국인 영양소 섭취기준(2020)입니다.</p>`;
  write(url, shell({ url, title: `${kg}kg 하루 물 섭취량 ${num(wt.ml)}ml (${wt.cups}잔) · 단백질 ${pr.base}~${pr.active}g`, desc: `몸무게 ${kg}kg의 하루 물 권장량은 약 ${num(wt.ml)}ml, 단백질은 ${pr.base}~${pr.active}g입니다. 컵·생수병 환산과 닭가슴살 환산.`, body, nav: 'bmr' }));
}
function waterIndex() {
  const body = `
${crumb([['/', '홈'], [null, '물 섭취량']])}
<h1 class="title">몸무게별 하루 물 섭취량과 단백질</h1>
<p class="meta">몸무게 × 33ml · 단백질 0.8~1.6g/kg</p>
${section('몸무게별', null, table(['몸무게', '물 (ml)', '컵', '단백질'], WATER_KG.map((kg) => { const w = B.water(kg), p = B.protein(kg); return { cells: [`<a href="/water/${kg}/">${kg}kg</a>`, num(w.ml), `${w.cups}잔`, `${p.base}~${p.active}g`] }; })))}`;
  write('/water/', shell({ og: 'water', url: '/water/', title: '몸무게별 하루 물 섭취량·단백질 권장량표', desc: '몸무게 40~120kg별 하루 물 권장량(ml·컵)과 단백질 권장량을 정리했습니다.', body, nav: 'bmr' }));
}

/* ---------- 출산예정일 ---------- */
const MONTHS = []; for (let m = 1; m <= 12; m++) for (let d = 1; d <= D.daysInMonth(2024, m); d++) MONTHS.push([m, d]);
const dueUrl = (m, d) => `/due-date/${pad(m)}-${pad(d)}/`;
const ovUrl = (m, d) => `/ovulation/${pad(m)}-${pad(d)}/`;
function lmpYears(m, d, mode = 'due') {
  /* 이 날짜의 발생 후보(2월 29일은 윤년만). due: 아직 예정일이 지나지 않은 가장 최근 발생, 없으면 다가오는 발생 · cycle: 가장 최근 발생(오늘 포함) */
  const y0 = TODAY.getUTCFullYear();
  const cands = [];
  for (let y = y0 - 4; y <= y0 + 4; y++) { if (m === 2 && d === 29 && D.daysInMonth(y, 2) < 29) continue; cands.push(D.utc(y, m, d)); }
  let recent;
  if (mode === 'due') recent = cands.filter((x) => x <= TODAY && D.addDays(x, 280) >= TODAY).pop() || cands.find((x) => x > TODAY) || cands[cands.length - 1];
  else recent = cands.filter((x) => x <= TODAY).pop() || cands[0];
  const next = cands.find((x) => x > recent) || recent;
  return { recent, next };
}
function duePage(m, d) {
  const url = dueUrl(m, d), { recent, next } = lmpYears(m, d);
  const p = D.pregnancy(recent), pn = D.pregnancy(next);
  const w = D.weeksOn(recent, TODAY);
  const rows = D.MILESTONES.map((ms) => ({ cells: [`${ms.week}주`, `${D.fmtShort(D.addDays(recent, ms.week * 7))} (${D.wd(D.addDays(recent, ms.week * 7)).slice(0, 1)})`, ms.label] }));
  fs.mkdirSync(path.join(OUT, url), { recursive: true }); fs.writeFileSync(path.join(OUT, url, 'pregnancy.ics'), I.pregnancyIcs(recent, { now: TODAY }));
  const title = `마지막 생리 ${m}월 ${d}일 출산예정일 — ${D.fmt(p.due)} (${D.wd(p.due)}) · 주수별 일정`;
  const desc = `마지막 생리 시작일이 ${recent.getUTCFullYear()}년 ${m}월 ${d}일이면 출산예정일은 ${D.fmt(p.due)}입니다. 임신 확인, 기형아 검사, 정밀 초음파, 임신성 당뇨 검사, 만삭까지 주수별 날짜와 오늘 몇 주인지.`;
  const body = `
${crumb([['/due-date/', '출산예정일'], [null, `${m}월 ${d}일`]])}
<h1 class="title">마지막 생리 ${m}월 ${d}일 — 출산예정일</h1>
<p class="meta">네겔레 법칙 · 마지막 생리 시작일 + 280일(40주) · 생리주기 28일 가정</p>
${lead(`마지막 생리가 ${recent.getUTCFullYear()}년 ${m}월 ${d}일에 시작했다면 출산예정일은 <b>${D.fmt(p.due)} ${D.wd(p.due)}</b>입니다. 배란·수정은 ${D.fmtShort(p.conception)} 무렵이고, ${D.fmtShort(p.fullTerm)}부터 만삭입니다. ${w.days >= 0 && w.days <= 300 ? `오늘(${D.fmtShort(TODAY)})은 임신 ${w.weeks}주 ${w.rem}일, ${w.trimester}분기입니다.` : ''} ${next > recent ? `${next.getUTCFullYear()}년 ${m}월 ${d}일이 마지막 생리라면 ${D.fmt(pn.due)}입니다.` : ''}`)}
${hero({ label: `출산예정일 (${recent.getUTCFullYear()}년 ${m}월 ${d}일 시작)`, value: `${p.due.getUTCMonth() + 1}월 ${p.due.getUTCDate()}일`, unit: '', sub: `${p.due.getUTCFullYear()}년 · ${D.wd(p.due)} · 만삭 ${D.fmtShort(p.fullTerm)}부터 · 수정 무렵 ${D.fmtShort(p.conception)}` })}
<form class="quick live" data-live="due" data-lmp="${D.iso(recent)}" data-ics="${url}pregnancy.ics" style="margin-top:14px"><div class="live-head"><b>오늘 몇 주?</b><span>날짜를 바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>마지막 생리 시작일</span><input data-k="lmp" type="date" value="${D.iso(recent)}"></label></div><div class="tiles"><div class="tile"><small>출산예정일</small><span class="num" data-out="due"></span></div><div class="tile"><small>오늘 주수</small><span class="num" data-out="week"></span></div><div class="tile"><small>남은 날</small><span class="num" data-out="left"></span></div></div><div class="live-foot"><a data-out="ics" href="${url}pregnancy.ics">검사 일정 캘린더 파일(.ics) →</a><a href="/pregnancy/card/?lmp=${D.iso(recent)}">디데이 카드 →</a></div></form>
${section('주수별 일정', `${recent.getUTCFullYear()}년 ${m}월 ${d}일 시작 기준 · ＋는 구글 캘린더에 하나씩`, table(['주수', '날짜', '이 무렵', '캘린더'], rows.map((r, i) => ({ cells: r.cells.concat([`<a href="${I.gcalUrl(`🤰 ${D.MILESTONES[i].week}주 ${D.MILESTONES[i].label.split(' — ')[0].split(' · ')[0]}`, D.addDays(recent, D.MILESTONES[i].week * 7), D.MILESTONES[i].label, `${SITE}${url}`)}" target="_blank" rel="noopener" title="구글 캘린더에 추가">＋</a>`]) }))))}
<div class="cal-box">
  <div class="cal-head"><b>검사 일정을 캘린더에</b><span>${D.MILESTONES.length}개 일정 · 하루 전 알림</span></div>
  <div class="btn-row"><a class="btn" href="${url}pregnancy.ics">캘린더 파일 받기 (.ics)</a></div>
  <p class="cal-how"><b>아이폰</b> 파일을 열면 캘린더에 "모두 추가" · <b>안드로이드</b> 내려받은 파일을 구글 캘린더 앱으로 열기 · <b>PC</b> calendar.google.com ▸ 설정 ▸ 가져오기. 생리 시작일이 다르면 위 계산기에서 바꾼 뒤 받으세요.</p>
</div>
${ad()}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>예정일은 예정일입니다.</b> 실제로 예정일 당일에 태어나는 아기는 5% 정도이고, 대부분 예정일 앞뒤 2주(38~42주) 안에 태어납니다. 초기 초음파(8~12주)에서 아기 크기로 예정일을 다시 잡는 경우도 흔합니다.</p>
<p><b>생리주기가 28일이 아니면.</b> 주기가 길면 배란이 늦어 예정일도 뒤로 밉니다. 주기 35일이면 약 7일 뒤로, 21일이면 7일 앞으로 조정합니다. 정확한 값은 초음파 기준입니다.</p>
<p><b>임신 주수 세는 법.</b> 수정일이 아니라 마지막 생리 시작일을 0주 0일로 셉니다. 그래서 "임신 4주"에 실제 아기는 2주 된 셈입니다.</p>
</div>`)}
${section('날짜가 바뀌면', '출산예정일', chips([-2, -1, 0, 1, 2].map((k) => { const dt = D.addDays(D.utc(2024, m, d), k); const mm = dt.getUTCMonth() + 1, dd = dt.getUTCDate(); const pp = D.pregnancy(lmpYears(mm, dd).recent); return { label: `${mm}/${dd}`, value: `${pp.due.getUTCMonth() + 1}/${pp.due.getUTCDate()}`, href: dueUrl(mm, dd), on: k === 0 }; })))}
${section('이어서', null, list([{ href: `/pregnancy/card/?lmp=${D.iso(recent)}`, title: '임신 디데이 카드 만들기', sub: `D-${Math.max(0, D.diffDays(TODAY, p.due))} · 카톡·인스타에 올릴 이미지` }, { href: `/pregnancy/week/${Math.min(42, Math.max(1, w.weeks || 1))}/`, title: `임신 ${Math.min(42, Math.max(1, w.weeks || 1))}주 안내`, sub: '아기 크기 · 엄마 몸 · 검사' }, { href: ovUrl(m, d), title: `${m}월 ${d}일 시작 배란일·가임기`, sub: '임신 준비 중이라면' }, { href: '/baby/', title: '아기 개월수·예방접종 일정', sub: '태어난 뒤' }, { href: `${SISTERS.saju}/`, title: '출산 택일 (사주첩)', sub: '자매 사이트' }]))}
<p class="note">네겔레 법칙(마지막 생리 시작일 + 280일)에 따른 계산이며 생리주기 28일·배란 14일째를 가정합니다. 진단이 아니므로 병원 초음파 예정일을 기준으로 하세요.</p>`;
  write(url, shell({ url, title, desc, body, nav: 'preg', scripts: ['/js/engine.js', '/js/live.js'] }));
}
function dueIndex() {
  const grid12 = [];
  for (let m = 1; m <= 12; m++) grid12.push(`<div class="cell" style="flex-direction:column;align-items:stretch"><small>${m}월</small><div class="chips" style="margin-top:6px;overflow:visible;flex-wrap:wrap">${Array.from({ length: D.daysInMonth(2024, m) }, (_, i) => i + 1).map((d) => `<a class="chip" style="min-width:0;padding:4px 7px" href="${dueUrl(m, d)}">${d}</a>`).join('')}</div></div>`);
  const body = `
${crumb([['/', '홈'], [null, '출산예정일']])}
<h1 class="title">출산예정일 계산 — 마지막 생리일로</h1>
<p class="meta">마지막 생리 시작일 + 280일 · 주수별 검사 일정 · 오늘 몇 주</p>
<form class="quick live" data-live="due" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>날짜를 넣으면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>마지막 생리 시작일</span><input data-k="lmp" type="date" value="${D.iso(D.addDays(TODAY, -56))}"></label></div><div class="tiles"><div class="tile"><small>출산예정일</small><span class="num" data-out="due"></span></div><div class="tile"><small>오늘 주수</small><span class="num" data-out="week"></span></div><div class="tile"><small>남은 날</small><span class="num" data-out="left"></span></div></div><div class="live-foot"><a data-out="link" href="/due-date/">이 날짜의 주수별 일정 →</a></div></form>
${lead('출산예정일은 마지막 생리 시작일에 280일(40주)을 더해 구합니다. 아래에서 날짜를 누르면 그 날짜 기준 주수별 검사 일정과 오늘 몇 주인지가 나옵니다.')}
${section('마지막 생리 시작일 고르기', null, `<div class="grid grid-2">${grid12.join('')}</div>`)}
${ad()}`;
  write('/due-date/', shell({ url: '/due-date/', title: '출산예정일 계산기 — 마지막 생리일로 예정일·임신 주수·검사 일정', desc: '마지막 생리 시작일을 넣으면 출산예정일과 오늘 임신 주수, 기형아 검사·정밀 초음파·임신성 당뇨 검사 등 주수별 일정이 나옵니다.', body, nav: 'preg', scripts: ['/js/engine.js', '/js/live.js'] }));
}

/* ---------- 배란일 ---------- */
const CYCLES = [24, 26, 28, 30, 32, 35];
function ovPage(m, d) {
  const url = ovUrl(m, d), { recent } = lmpYears(m, d, 'cycle');
  const c28 = D.cycle(recent, 28);
  const rows = CYCLES.map((len) => { const c = D.cycle(recent, len); return { cls: len === 28 ? 'on' : '', cells: [`${len}일`, D.fmtShort(c.ovulation), `${D.fmtShort(c.fertileStart)} ~ ${D.fmtShort(c.fertileEnd)}`, D.fmtShort(c.next)] }; });
  fs.mkdirSync(path.join(OUT, url), { recursive: true }); fs.writeFileSync(path.join(OUT, url, 'cycle.ics'), I.cycleIcs(recent, 28, { now: TODAY }));
  const title = `생리 시작 ${m}월 ${d}일 배란일·가임기 — 배란 ${D.fmtShort(c28.ovulation)}, 가임기 ${D.fmtShort(c28.fertileStart)}~${D.fmtShort(c28.fertileEnd)} (주기 28일)`;
  const desc = `${recent.getUTCFullYear()}년 ${m}월 ${d}일에 생리가 시작했다면 주기 28일 기준 배란일은 ${D.fmtShort(c28.ovulation)}, 가임기는 ${D.fmtShort(c28.fertileStart)}~${D.fmtShort(c28.fertileEnd)}, 다음 생리는 ${D.fmtShort(c28.next)}입니다. 주기 24~35일별 표.`;
  const body = `
${crumb([['/ovulation/', '배란일'], [null, `${m}월 ${d}일`]])}
<h1 class="title">생리 시작 ${m}월 ${d}일 — 배란일과 가임기</h1>
<p class="meta">다음 생리 예정일 − 14일 = 배란일 · 가임기 = 배란 5일 전 ~ 1일 뒤</p>
${lead(`${recent.getUTCFullYear()}년 ${m}월 ${d}일에 생리가 시작했고 주기가 28일이면 배란일은 <b>${D.fmt(c28.ovulation)}</b>, 임신 가능성이 높은 가임기는 ${D.fmtShort(c28.fertileStart)}부터 ${D.fmtShort(c28.fertileEnd)}까지, 다음 생리는 ${D.fmtShort(c28.next)} 무렵입니다. 주기가 다르면 아래 표에서 내 주기를 찾으세요.`)}
${hero({ label: '배란일 (주기 28일)', value: `${c28.ovulation.getUTCMonth() + 1}월 ${c28.ovulation.getUTCDate()}일`, unit: '', sub: `가임기 ${D.fmtShort(c28.fertileStart)} ~ ${D.fmtShort(c28.fertileEnd)} · 다음 생리 ${D.fmtShort(c28.next)}` })}
<form class="quick live" data-live="cycle" data-lmp="${D.iso(recent)}" data-ics="${url}cycle.ics" style="margin-top:14px"><div class="live-head"><b>내 주기로</b><span>바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>생리 시작일</span><input data-k="lmp" type="date" value="${D.iso(recent)}"></label><label class="ye-f"><span>생리주기 (일)</span><input data-k="len" type="text" inputmode="numeric" value="28"></label></div><div class="tiles"><div class="tile"><small>배란일</small><span class="num" data-out="ov"></span></div><div class="tile"><small>가임기</small><span class="num" data-out="fertile"></span></div><div class="tile"><small>다음 생리</small><span class="num" data-out="next"></span></div></div><div class="live-foot"><a data-out="ics" href="${url}cycle.ics">생리·배란·가임기 캘린더 파일(.ics) →</a></div></form>
${section('주기별', `${m}월 ${d}일 시작`, table(['주기', '배란일', '가임기', '다음 생리'], rows))}
<div class="cal-box">
  <div class="cal-head"><b>앞으로 6번의 주기를 캘린더에</b><span>생리 예정일 · 배란 예정일 · 가임기 (주기 28일)</span></div>
  <div class="btn-row"><a class="btn" href="${url}cycle.ics">캘린더 파일 받기 (.ics)</a></div>
  <p class="cal-how"><b>아이폰</b> 파일을 열면 캘린더에 "모두 추가" · <b>안드로이드</b> 내려받은 파일을 구글 캘린더 앱으로 열기. 주기가 28일이 아니면 위 계산기에서 바꾼 뒤 "캘린더 파일" 링크를 누르세요.</p>
</div>
${ad()}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>배란은 다음 생리의 14일 전.</b> 주기가 길든 짧든 배란 뒤 생리까지는 대체로 14일이라, 주기가 불규칙하면 배란일도 함께 움직입니다. 최근 3~6개월 주기를 평균해 넣으세요.</p>
<p><b>가임기는 배란 5일 전부터.</b> 정자는 몸 안에서 최대 5일, 난자는 배란 뒤 하루 정도 살아 있어 배란 5일 전~1일 뒤가 임신 가능성이 가장 높습니다. 배란테스트기는 배란 1~2일 전에 양성이 나옵니다.</p>
<p><b>피임 목적으로는 쓰지 마세요.</b> 배란은 스트레스·수면·체중 변화로 쉽게 밀립니다. 이 계산은 임신 준비용 참고이지 피임 방법이 아닙니다.</p>
</div>`)}
${section('날짜가 바뀌면', '배란일 (28일)', chips([-2, -1, 0, 1, 2].map((k) => { const dt = D.addDays(D.utc(2024, m, d), k); const mm = dt.getUTCMonth() + 1, dd = dt.getUTCDate(); const cc = D.cycle(lmpYears(mm, dd, 'cycle').recent, 28); return { label: `${mm}/${dd}`, value: `${cc.ovulation.getUTCMonth() + 1}/${cc.ovulation.getUTCDate()}`, href: ovUrl(mm, dd), on: k === 0 }; })))}
${section('이어서', null, list([{ href: dueUrl(m, d), title: `${m}월 ${d}일 시작 출산예정일`, sub: '임신했다면' }, { href: '/bmi/', title: 'BMI · 정상 체중', sub: '임신 준비 체중 관리' }]))}
<p class="note">평균 주기와 황체기 14일을 가정한 추정입니다. 다낭성난소증후군 등으로 주기가 불규칙하면 맞지 않을 수 있습니다.</p>`;
  write(url, shell({ url, title, desc, body, nav: 'preg', scripts: ['/js/engine.js', '/js/live.js'] }));
}
function ovIndex() {
  const grid12 = [];
  for (let m = 1; m <= 12; m++) grid12.push(`<div class="cell" style="flex-direction:column;align-items:stretch"><small>${m}월</small><div class="chips" style="margin-top:6px;overflow:visible;flex-wrap:wrap">${Array.from({ length: D.daysInMonth(2024, m) }, (_, i) => i + 1).map((d) => `<a class="chip" style="min-width:0;padding:4px 7px" href="${ovUrl(m, d)}">${d}</a>`).join('')}</div></div>`);
  const body = `
${crumb([['/', '홈'], [null, '배란일']])}
<h1 class="title">배란일·가임기 계산</h1>
<p class="meta">생리 시작일과 주기로 · 다음 생리 − 14일</p>
<form class="quick live" data-live="cycle" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>최근 생리 시작일</span><input data-k="lmp" type="date" value="${D.iso(D.addDays(TODAY, -10))}"></label><label class="ye-f"><span>생리주기 (일)</span><input data-k="len" type="text" inputmode="numeric" value="28"></label></div><div class="tiles"><div class="tile"><small>배란일</small><span class="num" data-out="ov"></span></div><div class="tile"><small>가임기</small><span class="num" data-out="fertile"></span></div><div class="tile"><small>다음 생리</small><span class="num" data-out="next"></span></div></div><div class="live-foot"><a data-out="ics" href="/ovulation/">생리·배란·가임기 캘린더 파일(.ics) →</a></div></form>
${lead('배란일은 다음 생리 예정일의 14일 전이고, 가임기는 배란 5일 전부터 하루 뒤까지입니다. 날짜를 누르면 주기 24~35일별 표가 나옵니다.')}
${section('생리 시작일 고르기', null, `<div class="grid grid-2">${grid12.join('')}</div>`)}
${ad()}`;
  write('/ovulation/', shell({ url: '/ovulation/', title: '배란일 계산기 — 생리 시작일과 주기로 가임기·다음 생리일', desc: '최근 생리 시작일과 주기를 넣으면 배란일, 임신 가능성이 높은 가임기, 다음 생리 예정일이 나옵니다. 주기 24~35일별 표.', body, nav: 'preg', scripts: ['/js/engine.js', '/js/live.js'] }));
}

/* ---------- 아기 개월수 · 예방접종 ---------- */
const babyUrl = (dt) => `/baby/${D.iso(dt)}/`;
function babyPage(birth) {
  const url = babyUrl(birth), age = D.ageOn(birth, TODAY);
  const vac = D.vaccineDates(birth);
  const rows = []; for (const v of vac) for (const ds of v.doses) rows.push({ dt: ds.date, cells: [v.name, ds.label, `${D.fmt(ds.date)}`, `<a href="${I.gcalUrl(`💉 ${v.name} ${ds.label}`, ds.date, '국가예방접종 표준 일정 시작 시기 · 실제 접종은 소아과와 상의', `${SITE}${url}`)}" target="_blank" rel="noopener" title="구글 캘린더에 추가">＋</a>`], past: ds.date <= TODAY, name: v.name, label: ds.label });
  rows.sort((a, b) => a.dt - b.dt);
  const nextDose = rows.find((r) => r.dt >= TODAY);
  const checks = D.checkupDates(birth);
  const events = I.babyEvents(birth);
  fs.mkdirSync(path.join(OUT, url), { recursive: true }); fs.writeFileSync(path.join(OUT, url, 'vaccines.ics'), I.babyIcs(birth, { now: TODAY }));
  const marks = [['100일', D.addDays(birth, 99)], ['200일', D.addDays(birth, 199)], ['첫돌', D.addMonths(birth, 12)], ['두돌', D.addMonths(birth, 24)], ['세돌', D.addMonths(birth, 36)]];
  const title = `${D.fmt(birth)}생 아기 — ${D.fmtShort(TODAY)} 기준 ${age.months}개월 ${age.days}일, 예방접종 일정과 100일·돌`;
  const desc = `${D.fmt(birth)}에 태어난 아기는 ${D.fmtShort(TODAY)} 기준 ${age.months}개월 ${age.days}일(생후 ${num(age.totalDays)}일)입니다. 국가예방접종 표준 일정 날짜, 100일·200일·첫돌·두돌, 초등학교 입학 연도까지.`;
  const body = `
${crumb([['/baby/', '아기 개월수'], [null, D.fmt(birth)]])}
<h1 class="title">${D.fmt(birth)}생 아기</h1>
<p class="meta">${D.wd(birth)} 출생 · 초등학교 입학 ${D.schoolYear(birth)}년 3월 · 접종 일정은 질병관리청 표준 일정</p>
<form class="quick live" data-live="baby" style="margin-top:14px"><div class="live-head"><b>오늘 기준</b><span>생일을 바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>생년월일</span><input data-k="birth" type="date" value="${D.iso(birth)}"></label></div><div class="tiles"><div class="tile"><small>개월수</small><span class="num" data-out="age"></span></div><div class="tile"><small>생후</small><span class="num" data-out="days"></span></div><div class="tile"><small>만 나이</small><span class="num" data-out="year"></span></div></div><p class="sub" style="margin-top:8px" data-out="growth"></p></form>
${lead(`${D.fmt(birth)}에 태어난 아기는 이 페이지를 만든 ${D.fmtShort(TODAY)} 기준 <b>${age.months}개월 ${age.days}일</b>, 생후 ${num(age.totalDays)}일째입니다(위 상자는 열 때마다 오늘로 다시 계산). 100일은 ${D.fmt(marks[0][1])}, 첫돌은 ${D.fmt(marks[2][1])}이고 초등학교는 ${D.schoolYear(birth)}년 3월에 입학합니다.`)}
${section('기념일', null, tiles(marks.slice(0, 3).map(([l, dt]) => ({ label: l, value: `${dt.getUTCFullYear()}.${dt.getUTCMonth() + 1}.${dt.getUTCDate()}` }))) + tiles(marks.slice(3).concat([['초등 입학', D.utc(D.schoolYear(birth), 3, 2)]]).map(([l, dt]) => ({ label: l, value: `${dt.getUTCFullYear()}.${dt.getUTCMonth() + 1}.${dt.getUTCDate()}` }))))}
${section('예방접종 일정', '국가예방접종(무료) 표준 일정 · 날짜는 접종 시작 시기 · 지난 접종은 흐리게 · ＋는 구글 캘린더에 하나씩 추가', `<div class="tbl"><table><thead><tr><th>백신</th><th>시기</th><th>날짜</th><th>캘린더</th></tr></thead><tbody>${rows.map((r) => `<tr${r.past ? ' style="color:var(--ghost)"' : ''}>${r.cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)}
<div class="cal-box">
  <div class="cal-head"><b>캘린더에 한 번에 넣기</b><span>접종일 ${events.filter((e) => e.kind === 'vaccine').length}회 · 건강검진 ${checks.length}회 · 이유식 4단계 · 100일·돌</span></div>
  ${nextDose ? `<p class="cal-next">다음 접종 <b>${nextDose.name.split(' (')[0]} ${nextDose.label}</b> · ${D.fmt(nextDose.dt)} (${D.diffDays(TODAY, nextDose.dt) === 0 ? '오늘' : `D-${D.diffDays(TODAY, nextDose.dt)}`})</p>` : '<p class="cal-next">표준 일정의 영유아 접종은 모두 지났습니다. 만 4~6세·11~12세 접종은 표에서 확인하세요.</p>'}
  <div class="btn-row"><a class="btn" href="${url}vaccines.ics">캘린더 파일 받기 (.ics)</a>${nextDose ? `<a class="btn btn-share" href="${I.gcalUrl(`💉 ${nextDose.name} ${nextDose.label}`, nextDose.dt, '국가예방접종 표준 일정 시작 시기 · 실제 접종은 소아과와 상의', `${SITE}${url}`)}" target="_blank" rel="noopener">다음 접종만 구글 캘린더에</a>` : ''}</div>
  <p class="cal-how"><b>아이폰</b> 파일을 열면 캘린더에 "모두 추가" · <b>안드로이드</b> 내려받은 파일을 구글 캘린더 앱으로 열기 · <b>PC</b> calendar.google.com ▸ 설정 ▸ 가져오기. 하루 전 오전 9시에 알림이 울립니다.</p>
</div>
${section('영유아 건강검진', '검진 기간 시작일 · 기간 안에 지정 병원에서', table(['검진', '기간 시작', '구강검진'], checks.map((c) => ({ cells: [c.label, D.fmt(c.date), c.dental || '—'] }))))}
${section('이유식 단계', '시작 시기는 아기의 준비 신호가 우선 (4~6개월)', table(['단계', '시작 무렵', '이렇게'], I.FOOD_STAGES.map((f) => ({ cells: [f.label, D.fmt(D.addMonths(birth, f.m)), f.desc.split('.')[0]], cls: D.addMonths(birth, f.m) <= TODAY && D.addMonths(birth, f.m + (f.m === 6 ? 1 : f.m === 7 ? 2 : f.m === 9 ? 3 : 4)) > TODAY ? 'on' : '' }))) + `<p class="sub" style="margin-top:8px"><a href="/guide/baby-food/">이유식 시작 시기·재료 순서 자세히 →</a></p>`)}
${ad()}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>개월수는 달력으로 셉니다.</b> 태어난 날짜와 같은 날짜가 될 때마다 1개월이고, 그 사이 남은 날을 "일"로 붙입니다. 육아수첩·병원의 기준과 같습니다.</p>
<p><b>접종은 시작 시기부터 몇 주 여유가 있습니다.</b> 표의 날짜는 "이때부터 맞을 수 있다"는 뜻이고, 감기 등으로 미뤄도 다음 접종 간격만 지키면 됩니다. 예방접종도우미(질병관리청) 앱에서 실제 기록을 관리하세요.</p>
<p><b>초등학교 입학</b>은 만 6세가 되는 해의 다음 해 3월, 즉 태어난 해 + 7년입니다. 1~2월생도 같은 해에 입학합니다(2009년 이후).</p>
</div>`)}
${section('이어서', null, list([{ href: `/baby/card/?birth=${D.iso(birth)}`, title: '100일·돌 카드 만들기', sub: `오늘 D+${age.totalDays + 1} · 카톡·인스타용 이미지` }, { href: `/baby/percentile/boy/${Math.min(36, age.months)}/`, title: `${age.months}개월 성장 백분위`, sub: '몸무게·키·머리둘레가 또래 어디쯤' }, { href: `/baby/month/${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 21, 24, 30, 36].reduce((a, x) => age.months >= x ? x : a, 0)}/`, title: '이 시기 발달·돌봄', sub: '할 수 있는 것 · 수유 · 수면' }, { href: `/baby/formula/${Math.min(12, age.months)}/`, title: age.months === 0 ? '신생아 분유량' : age.months <= 12 ? `${age.months}개월 분유량` : '돌 이후 우유량', sub: '1회량 · 하루 횟수' }, { href: '/bmi/', title: '엄마·아빠 BMI', sub: '키·몸무게별 정상 체중' }, { href: `${SISTERS.saju}/`, title: '아기 사주 (사주첩)', sub: '태어난 시각까지 넣으면' }]))}
<p class="note">질병관리청 「표준 예방접종 일정표」를 바탕으로 한 안내이며, 아기의 건강 상태에 따라 소아과에서 일정을 조정합니다.</p>`;
  write(url, shell({ url, title, desc, body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
}
function babyIndex(dates) {
  const byMonth = {};
  for (const dt of dates) { const k = `${dt.getUTCFullYear()}년 ${dt.getUTCMonth() + 1}월`; (byMonth[k] = byMonth[k] || []).push(dt); }
  const body = `
${crumb([['/', '홈'], [null, '아기 개월수']])}
<h1 class="title">아기 개월수·예방접종 일정</h1>
<p class="meta">생년월일로 · 오늘 몇 개월 · 100일·돌 · 국가예방접종 날짜</p>
<form class="quick live" data-live="baby" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>생일을 넣으면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>생년월일</span><input data-k="birth" type="date" value="${D.iso(D.addDays(TODAY, -100))}"></label></div><div class="tiles"><div class="tile"><small>개월수</small><span class="num" data-out="age"></span></div><div class="tile"><small>생후</small><span class="num" data-out="days"></span></div><div class="tile"><small>만 나이</small><span class="num" data-out="year"></span></div></div><p class="sub" style="margin-top:8px" data-out="growth"></p><div class="live-foot"><a data-out="link" href="/baby/">접종 일정 표 →</a><a data-out="ics" href="/baby/">캘린더 파일(.ics) 받기 →</a></div></form>
${lead('아기의 생년월일을 넣으면 오늘 몇 개월 며칠인지, 100일과 돌이 언제인지, 국가예방접종을 언제 맞아야 하는지 날짜로 나옵니다. 접종·건강검진·100일·돌을 캘린더 파일 하나로 받아 아이폰·구글 캘린더에 넣을 수 있고, 아래에서 생일을 누르면 그 아기의 전체 일정표가 열립니다.')}
${Object.entries(byMonth).map(([k, list]) => section(k, null, `<div class="chips" style="flex-wrap:wrap;overflow:visible">${list.map((dt) => `<a class="chip" style="min-width:0;padding:4px 8px" href="${babyUrl(dt)}">${dt.getUTCDate()}일</a>`).join('')}</div>`)).join('\n')}
${ad()}
${section('함께 보면 좋은 것', null, list([{ href: '/baby/formula/', title: '분유 수유량 계산기', sub: '개월·몸무게로 1회량과 하루 총량' }, { href: '/baby/percentile/', title: '아기 성장 백분위', sub: '몸무게·키가 또래 어디쯤' }, { href: '/baby/month/', title: '개월별 발달', sub: '0~36개월' }]))}`;
  write('/baby/', shell({ url: '/baby/', title: '아기 개월수 계산기 — 생년월일로 오늘 몇 개월·예방접종 일정·100일 돌', desc: '아기 생년월일을 넣으면 오늘 개월수와 생후 일수, 100일·첫돌 날짜, 국가예방접종 표준 일정 날짜가 나옵니다.', body, nav: 'baby', scripts: ['/js/engine.js', '/js/live.js'] }));
}

/* ---------- 홈 ---------- */
function home() {
  const b = B.bmiOf(170, 65), r = B.normalRange(170);
  const body = `
<div class="home-hero">
  <div class="overline">몸 계산 사전</div>
  <h1>키 170에 몸무게 65면<br>어디쯤일까</h1>
  <p>BMI·기초대사량·칼로리·출산예정일·아기 개월수를 숫자별로 미리 계산해 표로 묶어 두었습니다. 숫자만 넣으면 바로 나옵니다.</p>
</div>
<form class="quick quick-smart" data-quick="smart"><label for="q-home">숫자로 바로 찾기 — 키·몸무게·음식·날짜 무엇이든</label><div class="quick-row"><div class="quick-in"><input id="q-home" type="text" placeholder="키 170 몸무게 65 / 치킨 칼로리 / 출산예정일 3월 5일" autocomplete="off"></div><button class="btn" type="submit">찾기</button></div><div class="quick-hint" data-hint aria-live="polite">예시를 누르거나 직접 적어 보세요</div><div class="quick-ex"><button type="button">키 170 몸무게 65</button><button type="button">키 160 몸무게 55</button><button type="button">치킨 칼로리</button><button type="button">라면 칼로리</button><button type="button">달리기 칼로리</button><button type="button">출산예정일 3월 5일</button><button type="button">배란일 9월 1일</button><button type="button">아기 2025-06-15</button><button type="button">디데이 카드</button><button type="button">강아지 5살</button><button type="button">아기 몸무게 백분위</button><button type="button">초3 평균 키</button><button type="button">10살 키 140</button><button type="button">2개월 분유량</button><button type="button">임신 20주 몸무게</button><button type="button">혈압 130 85</button><button type="button">공복혈당 110</button><button type="button">오늘 먹은 것</button><button type="button">체중 기록</button><button type="button">혈압 기록</button><button type="button">만보 칼로리</button><button type="button">임신 20주</button><button type="button">소주 1병</button><button type="button">5kg 빼기</button></div><div class="quick-links"><a href="/bmi/">BMI표</a><a href="/food/">칼로리 사전</a><a href="/exercise/">운동표</a><a href="/due-date/">출산예정일</a></div></form>
${grid()}
${section('몸', null, `<div class="dict">
<a href="/bmi/"><b>BMI · 정상 체중</b><span>170cm 65kg → BMI <span class="num">${b.bmi}</span> ${b.label} · 정상 범위 ${r.min}~${r.max}kg</span></a>
<a href="/bmr/"><b>기초대사량 · 하루 칼로리</b><span>남 30세 170/65 → <span class="num">${num(B.bmr('m', 170, 65, 30))}</span>kcal · 하루 ${num(B.tdee(B.bmr('m', 170, 65, 30), 'light'))}</span></a>
<a href="/bodyfat/"><b>체지방률</b><span>줄자로 허리·목둘레 재면 인바디 없이 <span class="num">±3~4%p</span></span></a>
<a href="/water/"><b>물 · 단백질</b><span>65kg → 하루 물 <span class="num">${num(B.water(65).ml)}</span>ml · 단백질 ${B.protein(65).base}~${B.protein(65).active}g</span></a>
</div>`)}
${section('먹고 태우기', null, `<div class="dict">
<a href="/food/"><b>음식 칼로리 사전</b><span>치킨 한 마리 <span class="num">${num(FOODS.find((f) => f.slug === 'fried-chicken').kcal)}</span>kcal = 밥 ${K.bowls(1900)}공기 · ${FOODS.length}가지</span></a>
<a href="/exercise/"><b>운동 소모 칼로리</b><span>달리기 30분 <span class="num">${num(K.burn(EX['running-8'].met, 60, 30))}</span>kcal · 걷기 ${num(K.burn(EX.walking.met, 60, 30))}kcal (60kg)</span></a>
</div>`)}
${section('임신과 아기', null, `<div class="dict">
<a href="/due-date/"><b>출산예정일</b><span>마지막 생리일 + 280일 · 주수별 검사 일정 · 오늘 몇 주</span></a>
<a href="/pregnancy/card/"><b>임신 디데이 카드</b><span>D-140 · 20주 3일 · 태명 — 카톡·인스타용 이미지로 저장·공유</span></a>
<a href="/ovulation/"><b>배란일 · 가임기</b><span>생리 시작일과 주기로 · 다음 생리 예정일</span></a>
<a href="/baby/"><b>아기 개월수 · 예방접종</b><span>생년월일로 오늘 몇 개월 · 100일·돌 · 접종 날짜 · <span class="num">캘린더 파일</span>로 아이폰·구글에 넣기</span></a>
<a href="/pregnancy/week/"><b>임신 주차별 안내</b><span>1~42주 · 아기 크기 · 엄마 몸 · 검사 일정</span></a>
<a href="/pregnancy/weight/"><b>임신 중 체중 증가</b><span>임신 전 BMI 정상 → 출산까지 <span class="num">11.5~16</span>kg · 20주엔 ${PW.gainRange('normal', 20).join('~')}kg</span></a>
<a href="/baby/month/"><b>아기 개월별 발달</b><span>0~36개월 · 평균 키·몸무게 · 수유·수면·접종</span></a>
<a href="/child-height/"><b>아이 키 예측</b><span>아빠 175 엄마 162 → 아들 <span class="num">${X.childHeight(175, 162).boy}</span>cm · 딸 ${X.childHeight(175, 162).girl}cm</span></a>
<a href="/baby/percentile/"><b>아기 성장 백분위</b><span>몸무게·키·머리둘레가 또래 100명 중 <span class="num">몇 번째</span>인지 · WHO·질병관리청</span></a>
<a href="/kids/"><b>아이 키 백분위 (3~18세)</b><span>만 10세 남자 140cm → 또래 <span class="num">${KD.kidsRank(KD.kidsCheck('height', 'm', 126, 140).pct)}</span> · 나이별·학년별 평균 키</span></a>
<a href="/baby/formula/"><b>분유 수유량</b><span>2개월 5.6kg → 1회 <span class="num">${FM.formulaPlan(76, 5.6).per}</span>ml × ${FM.formulaPlan(76, 5.6).feeds}회 · 하루 ${num(FM.formulaPlan(76, 5.6).daily)}ml</span></a>
<a href="/baby/card/"><b>아기 100일·돌 카드</b><span>D+100 · 첫돌까지 D-30 — 카톡·인스타용 이미지</span></a>
</div>`)}
${section('건강검진 결과', null, `<div class="dict">
<a href="/checkup/"><b>검진 결과 해석</b><span>혈압·혈당·콜레스테롤·간수치를 넣으면 <span class="num">한 번에</span> 판정</span></a>
<a href="/bp/120-80/"><b>혈압</b><span>정상 <span class="num">120/80</span> 미만 · 고혈압 140/90 이상</span></a>
<a href="/bp/log/"><b>혈압 기록</b><span>집에서 잰 혈압 7일 평균이 <span class="num">135/85</span>를 넘는지 · 기기에만 저장</span></a>
<a href="/glucose/100/"><b>공복혈당</b><span>정상 <span class="num">100</span> 미만 · 당뇨 126 이상</span></a>
<a href="/ldl/130/"><b>콜레스테롤</b><span>LDL 적정 <span class="num">100</span> 미만 · 중성지방 150 미만</span></a>
<a href="/liver/40/"><b>간수치</b><span>AST·ALT <span class="num">40</span> 이하 · 지방간이 가장 흔한 원인</span></a>
<a href="/uric/7/"><b>요산</b><span>남 <span class="num">7.0</span> · 여 6.0 초과면 고요산혈증</span></a>
</div>`)}
${section('반려동물', null, `<div class="dict">
<a href="/pet/dog-age/"><b>강아지 나이</b><span>5살 → 사람 <span class="num">${P.dogAge(5, 'small')}</span>세 (소형견) · 대형견 ${P.dogAge(5, 'large')}세</span></a>
<a href="/pet/dog-food/"><b>사료량</b><span>5kg 중성화 → 하루 <span class="num">${P.petFood('dog', 5, 'neutered').grams}</span>g · 고양이 4kg ${P.petFood('cat', 4, 'neutered').grams}g</span></a>
<a href="/pet/dog-vaccine/"><b>예방접종 캘린더</b><span>강아지·고양이 생일로 접종 날짜 · <span class="num">.ics</span> 파일</span></a>
</div>`)}
${section('생활', null, `<div class="dict">
<a href="/steps/10000/"><b>만보 걸으면</b><span>60kg → <span class="num">${num(X.steps(10000, 60, 170).kcal)}</span>kcal · ${X.steps(10000, 60, 170).km}km · ${X.steps(10000, 60, 170).minutes}분</span></a>
<a href="/sleep/"><b>몇 시에 자야 할까</b><span>7시 기상 → <span class="num">${X.bedtimes(7)[1].time}</span> 취침 (90분 주기 5번)</span></a>
<a href="/diet/"><b>다이어트 기간</b><span>5kg → 하루 500kcal 줄이면 <span class="num">${X.dietPlan(5, 0).weeks}</span>주</span></a>
<a href="/alcohol/"><b>혈중알코올농도</b><span>소주 1병 70kg 남 <span class="num">${X.bac(X.alcoholGrams(360, 0.165), 70, 'm').peak}</span>% · 마지막 잔 뒤 ${X.bac(X.alcoholGrams(360, 0.165), 70, 'm').driveHours}시간이면 0.03% 아래</span></a>
<a href="/kcal-need/"><b>나이별 권장 칼로리</b><span>남 19~29세 <span class="num">2,600</span> · 여 2,000kcal</span></a>
<a href="/caffeine/"><b>카페인</b><span>아메리카노 2잔 <span class="num">300</span>mg · 성인 400 · 임신 300mg</span></a>
<a href="/today/"><b>오늘 먹은 것 담기</b><span>음식을 담으면 하루 칼로리와 <span class="num">남은 양</span>이 바로</span></a>
<a href="/weight/"><b>체중 기록</b><span>매일 재서 그래프로 · 목표까지 <span class="num">며칠</span> 남았는지</span></a>
<a href="/quit-smoking/"><b>금연 계산기</b><span>30일이면 <span class="num">${num(X.quitStats(30).money)}</span>원 · 600개비 · 몸의 변화</span></a>
<a href="/guide/"><b>서재</b><span>${GUIDES.length}편 · BMI 한국 기준 · 대사량과 다이어트 · 수면 주기 · 음주</span></a>
</div>`)}
${section('많이 보는 표', null, list([170, 175, 160, 165, 180].map((h) => { const rr = B.normalRange(h); return { href: bmiUrl(h), title: `키 ${h}cm 정상 체중`, sub: `표준체중 남 ${B.standardWeight(h, 'm')} · 여 ${B.standardWeight(h, 'f')}kg`, value: `${rr.min}~${rr.max}kg` }; })))}
${ad()}
${section('기준', null, `<div class="callout"><b>대한비만학회 비만 진료지침 2022</b>(BMI 구간), Mifflin-St Jeor 식(기초대사량), 미 해군 공식(체지방률), Compendium of Physical Activities(운동 MET), 식약처 식품영양성분 DB(칼로리), 질병관리청 표준 예방접종 일정. 모두 참고용이며 진단·치료를 대신하지 않습니다.</div>`)}`;
  write('/', shell({ url: '/', title: `바디집 — BMI·기초대사량·칼로리·출산예정일·아기 개월수 계산 사전 (${YEAR})`, desc: '키·몸무게별 BMI와 정상 체중, 기초대사량과 하루 칼로리, 음식·운동 칼로리, 출산예정일·배란일, 아기 개월수와 예방접종 일정을 숫자별로 미리 계산한 몸 계산 사전.', body }));
}

/* ---------- 오늘 담기 · 체중 기록 ---------- */
function toolPages() {
  const todayBody = `
${crumb([['/', '홈'], [null, '오늘 담기']])}
<h1 class="title">오늘 먹은 것</h1>
<p class="meta">음식을 담으면 하루 칼로리가 쌓입니다 · 이 기기에만 저장 · 자정에 새로 시작</p>
<form class="quick live" data-live="today" style="margin-top:14px">
<div class="live-head"><b>내 기준</b><span>한 번 넣으면 다음에도 기억합니다</span></div>
<div class="ye-grid">
<label class="ye-f"><span>성별</span><select data-k="sex"><option value="m">남</option><option value="f">여</option></select></label>
<label class="ye-f"><span>나이</span><input data-k="age" type="text" inputmode="numeric" value="30"></label>
<label class="ye-f"><span>키 (cm)</span><input data-k="h" type="text" inputmode="numeric" value="170"></label>
<label class="ye-f"><span>몸무게 (kg)</span><input data-k="w" type="text" inputmode="numeric" value="65"></label>
<label class="ye-f" style="grid-column: span 2"><span>활동량</span><select data-k="act">${B.ACTIVITY.map((a) => `<option value="${a.key}"${a.key === 'light' ? ' selected' : ''}>${a.label}</option>`).join('')}</select></label>
</div>
<div class="tiles"><div class="tile"><small>오늘 먹은 칼로리</small><span class="num" data-out="total"></span></div><div class="tile"><small>하루 필요 (TDEE)</small><span class="num" data-out="tdee"></span></div><div class="tile"><small>남은 양</small><span class="num" data-out="left"></span></div></div>
<div class="today-bar"><i class="today-fill" data-out="bar"></i></div>
<div class="live-foot"><span>밥 <b class="num" data-out="bowls"></b> · 다 태우려면 걷기 <b class="num" data-out="walk"></b></span><button type="button" class="lnk" data-act="clear">전부 비우기</button></div>
<div class="ye-grid" style="margin-top:12px"><label class="ye-f" style="grid-column: 1 / -1"><span>음식 찾아 담기</span><input data-k="q" type="text" placeholder="치킨, 라면, 아메리카노…" autocomplete="off"></label></div>
<div class="chips" style="flex-wrap:wrap;overflow:visible;margin-top:6px" data-out="sug"></div>
<div class="tbl" style="margin-top:12px"><table><thead><tr><th>담은 것</th><th>칼로리</th><th></th></tr></thead><tbody data-out="rows"></tbody></table></div>
<p class="cal-how">담은 목록과 내 기준은 이 브라우저 안에만 저장되고 서버로 보내지 않습니다. 다른 기기에서는 보이지 않습니다.</p>
</form>
${lead('음식 이름을 쳐서 담으면 오늘 먹은 칼로리가 쌓이고, 내 하루 필요 칼로리와 견주어 얼마나 남았는지 보여 줍니다. 음식 페이지마다 있는 "오늘 먹은 것에 담기" 버튼으로도 담을 수 있습니다.')}
${section('많이 담는 음식', null, list(['rice', 'ramen', 'fried-chicken', 'americano', 'samgyeopsal', 'kimbap'].filter((x) => FOODS.some((f) => f.slug === x)).map((x) => { const f = FOODS.find((y) => y.slug === x); return { href: `/food/${f.slug}/`, title: f.name, sub: f.serving, value: `${num(f.kcal)}kcal` }; })))}
${ad()}
${section('이어서', null, list([{ href: '/weight/', title: '체중 기록', sub: '매일 재서 그래프로' }, { href: '/bmr/', title: '기초대사량 계산', sub: '내 하루 필요 칼로리' }, { href: '/food/', title: '음식 칼로리 사전', sub: `${FOODS.length}가지` }]))}
<p class="note">칼로리는 1인분 대략값이며 조리법·양에 따라 다릅니다. 기록은 참고용입니다.</p>
${grid()}`;
  write('/today/', shell({ url: '/today/', og: 'food', title: '오늘 먹은 칼로리 담기 — 하루 필요 칼로리와 비교 (기기에만 저장)', desc: '음식을 담으면 오늘 먹은 칼로리가 쌓이고 내 하루 필요 칼로리(TDEE)와 견줘 남은 양을 보여 줍니다. 회원 가입 없이 이 기기에만 저장됩니다.', body: todayBody, nav: 'today', scripts: ['/js/engine.js', '/js/today.js'] }));

  const weightBody = `
${crumb([['/', '홈'], [null, '체중 기록']])}
<h1 class="title">체중 기록</h1>
<p class="meta">매일 같은 시간에 재서 넣으면 그래프와 추세, 목표 도달일이 나옵니다 · 이 기기에만 저장</p>
<form class="quick live" data-live="weight" style="margin-top:14px">
<div class="live-head"><b>오늘 몸무게</b><span>같은 날짜를 다시 넣으면 덮어씁니다</span></div>
<div class="ye-grid">
<label class="ye-f"><span>날짜</span><input data-k="date" type="date"></label>
<label class="ye-f"><span>몸무게 (kg)</span><input data-k="w" type="text" inputmode="decimal" placeholder="65.4"></label>
<label class="ye-f"><span>키 (cm)</span><input data-k="h" type="text" inputmode="numeric" value="170"></label>
<label class="ye-f"><span>목표 (kg)</span><input data-k="goal" type="text" inputmode="decimal" placeholder="60"></label>
</div>
<div class="btn-row"><button type="button" class="btn" data-act="add">기록 추가</button><button type="button" class="btn btn-share" data-act="clear">전부 지우기</button></div>
<div class="tiles"><div class="tile"><small>지금</small><span class="num" data-out="now"></span></div><div class="tile"><small>BMI</small><span class="num" data-out="bmi"></span></div><div class="tile"><small>처음과 비교</small><span class="num" data-out="diff"></span></div></div>
<div class="chart" data-out="chart"></div>
<div class="live-foot"><span>목표 도달 예상 <b class="num" data-out="eta"></b></span><a href="/diet/">감량 기간 계산 →</a></div>
<div class="tbl" style="margin-top:12px"><table><thead><tr><th>날짜</th><th>몸무게</th><th>변화</th><th></th></tr></thead><tbody data-out="rows"></tbody></table></div>
<p class="cal-how">기록은 이 브라우저 안에만 저장되고 서버로 보내지 않습니다. 브라우저 데이터를 지우면 함께 사라집니다.</p>
</form>
${lead('몸무게는 하루에도 1kg 넘게 오르내립니다. 아침 화장실을 다녀온 뒤 같은 옷차림으로 재고, 하루하루가 아니라 주 단위 흐름을 보세요. 기록이 쌓이면 목표까지 얼마나 걸릴지 추세로 계산해 드립니다.')}
${section('재는 법', null, `<div class="doc">
<p><b>아침 공복이 가장 안정적입니다.</b> 자고 일어나 소변을 본 뒤, 식사 전에 재세요. 저녁에 재면 낮에 먹고 마신 무게가 1~2kg 더해집니다.</p>
<p><b>여성은 생리 주기에 따라 1~2kg 늘었다 줄어듭니다.</b> 생리 전 부종은 체지방이 아니라 수분입니다.</p>
<p><b>주 0.5~1kg이 안전한 속도입니다.</b> 그보다 빠르면 근육이 함께 빠집니다.</p>
</div>`)}
${ad()}
${section('이어서', null, list([{ href: '/today/', title: '오늘 먹은 칼로리 담기', sub: '섭취를 세면 더 빨리 보입니다' }, { href: '/diet/', title: '다이어트 기간 계산', sub: '목표까지 몇 주' }, { href: '/bmi/', title: 'BMI · 정상 체중', sub: '내 키의 정상 범위' }, { href: '/bp/log/', title: '혈압 기록', sub: '집에서 잰 혈압 7일 평균' }]))}
<p class="note">체중 변화는 수분·식사·배변에 크게 좌우됩니다. 급격한 체중 변화가 이유 없이 이어지면 진료를 받으세요.</p>`;
  write('/weight/', shell({ url: '/weight/', og: 'diet', title: '체중 기록 그래프 — 매일 재서 목표까지 며칠 남았는지 (기기에만 저장)', desc: '몸무게를 날짜별로 기록하면 그래프와 추세, 목표 도달 예상일이 나옵니다. 회원 가입 없이 이 기기에만 저장되고 서버로 전송하지 않습니다.', body: weightBody, nav: 'bmr', scripts: ['/js/engine.js', '/js/weight.js'] }));
}

/* ---------- 임베드 위젯 ---------- */
function embedPages() {
  const brandRow = (title) => `<div class="em-head"><a class="em-brand" href="${SITE}/?utm_source=embed" target="_top" rel="noopener">${LOGO}<b>바디집</b></a><span>${title}</span></div>`;
  const bmi = `<form class="em" data-embed="bmi">
${brandRow('BMI · 정상 체중')}
<div class="em-row"><label><span>키 (cm)</span><input type="text" inputmode="numeric" data-k="h" value="170"></label><label><span>몸무게 (kg)</span><input type="text" inputmode="numeric" data-k="w" value="65"></label></div>
<div class="tiles"><div class="tile"><small>BMI</small><span class="num" data-out="bmi"></span></div><div class="tile"><small>판정</small><span class="num" data-out="cat"></span></div><div class="tile"><small>정상 체중</small><span class="num" data-out="range"></span></div></div>
<div class="em-foot"><span>대한비만학회 2022 기준 · <b class="num" data-out="to"></b></span><a data-out="link" href="${SITE}/bmi/" target="_top" rel="noopener">자세히 보기 →</a></div>
</form>`;
  const due = `<form class="em" data-embed="due">
${brandRow('출산예정일')}
<div class="em-row"><label><span>마지막 생리 시작일</span><input type="date" data-k="lmp" value="${D.iso(D.addDays(TODAY, -140))}"></label></div>
<div class="tiles"><div class="tile"><small>출산예정일</small><span class="num" data-out="due"></span></div><div class="tile"><small>오늘 주수</small><span class="num" data-out="week"></span></div><div class="tile"><small>남은 날</small><span class="num" data-out="left"></span></div></div>
<div class="em-foot"><span>네겔레 법칙 · 마지막 생리일 + 280일</span><a data-out="link" href="${SITE}/due-date/" target="_top" rel="noopener">검사 일정 보기 →</a></div>
</form>`;
  write('/embed/bmi/', shell({ url: '/embed/bmi/', title: 'BMI 계산기 위젯 — 바디집', desc: '블로그에 붙이는 BMI·정상 체중 계산기 위젯.', body: bmi, bare: true, noindex: true, scripts: ['/js/engine.js', '/js/embed.js'] }));
  write('/embed/due/', shell({ url: '/embed/due/', title: '출산예정일 계산기 위젯 — 바디집', desc: '블로그에 붙이는 출산예정일·임신 주수 계산기 위젯.', body: due, bare: true, noindex: true, scripts: ['/js/engine.js', '/js/embed.js'] }));
  const snip = (kind, h, label) => `&lt;iframe src="${SITE}/embed/${kind}/" width="100%" height="${h}" style="border:0;max-width:640px" loading="lazy" title="바디집 ${label} 계산기"&gt;&lt;/iframe&gt;`;
  const body = `
${crumb([['/', '홈'], [null, '위젯']])}
<h1 class="title">블로그에 붙이는 계산기 위젯</h1>
<p class="meta">코드 한 줄을 글에 붙여 넣으면 방문자가 그 자리에서 BMI와 출산예정일을 계산합니다 · 무료 · 회원가입 없음</p>
${section('BMI · 정상 체중 위젯', '키와 몸무게를 넣으면 BMI 판정과 정상 체중 범위', `<iframe class="em-preview" src="/embed/bmi/" width="100%" height="270" style="border:0" title="BMI 계산기 미리보기"></iframe>
<textarea class="copybox" id="em-code-bmi" rows="3" readonly onclick="this.select()">${snip('bmi', 270, 'BMI')}</textarea><div class="btn-row"><button class="btn btn-share" type="button" data-copy="#em-code-bmi">코드 복사</button></div>`)}
${section('출산예정일 위젯', '마지막 생리 시작일을 넣으면 예정일과 오늘 주수', `<iframe class="em-preview" src="/embed/due/" width="100%" height="270" style="border:0" title="출산예정일 계산기 미리보기"></iframe>
<textarea class="copybox" id="em-code-due" rows="3" readonly onclick="this.select()">${snip('due', 270, '출산예정일')}</textarea><div class="btn-row"><button class="btn btn-share" type="button" data-copy="#em-code-due">코드 복사</button></div>`)}
${ad()}
${section('붙이는 방법', null, `<div class="doc">
<p><b>티스토리·워드프레스·자체 사이트</b> — 글 편집기를 HTML 모드로 바꾸고 원하는 자리에 위 코드를 붙여 넣으면 끝입니다. 폭은 글 영역에 맞춰 늘어나고, 높이가 잘리면 <code>height</code> 값을 키우세요.</p>
<p><b>네이버 블로그·카페, 브런치</b> — iframe을 허용하지 않아 붙일 수 없습니다. 대신 결과 페이지 링크(예: <a href="/bmi/170/65/">bodyzip.com/bmi/170/65/</a>)를 넣어 주세요.</p>
<p><b>조건</b> — 위젯 안의 '바디집' 표시와 링크는 지우지 말아 주세요. 위젯 안에는 광고가 나오지 않고, 입력값은 방문자의 브라우저 안에서만 처리됩니다. 기준이 바뀌면 위젯도 함께 갱신됩니다.</p>
</div>`)}
${section('이어서', null, list([{ href: '/bmi/', title: 'BMI 계산표', sub: '키·몸무게별 전체 표' }, { href: '/due-date/', title: '출산예정일 계산기', sub: '주수별 검사 일정·캘린더' }, { href: '/method/', title: '계산 기준', sub: '공식과 출처' }]))}
<p class="note">위젯은 방문자의 브라우저 안에서만 계산하며 입력값을 서버로 보내지 않습니다. 결과는 참고용이며 진단을 대신하지 않습니다.</p>`;
  write('/embed/', shell({ url: '/embed/', title: '블로그에 붙이는 BMI·출산예정일 계산기 위젯 — 바디집', desc: '코드 한 줄로 블로그·홈페이지에 BMI 계산기와 출산예정일 계산기를 붙이세요. 무료, 회원가입 없음, 기준 자동 갱신.', body }));
}

/* ---------- 문서 ---------- */
function docs() {
  const doc = (url, title, desc, inner) => write(url, shell({ url, title, desc, body: `${crumb([['/', '홈'], [null, title.split(' — ')[0]]])}<h1 class="title">${title.split(' — ')[0]}</h1><div class="doc">${inner}</div>`, noindex: url === '/terms/' || url === '/privacy/' }));
  doc('/method/', '계산 기준과 출처 — 바디집', '바디집의 BMI·기초대사량·체지방률·칼로리·출산예정일·예방접종 계산 방식과 출처.', `
<h2>BMI와 정상 체중</h2><p>BMI = 몸무게(kg) ÷ 키(m)². 판정은 대한비만학회 「비만 진료지침 2022」의 한국인 기준(18.5 미만 저체중, 18.5~22.9 정상, 23~24.9 비만 전단계, 25~29.9 1단계, 30~34.9 2단계, 35 이상 3단계 비만)을 씁니다. 정상 체중 범위는 BMI 18.5~22.9, 표준체중은 키(m)² × 22(남)·21(여), 브로카 변법은 (키 − 100) × 0.9입니다. 감량 기간은 체지방 1kg ≈ 7,700kcal로 계산합니다.</p>
<h2>기초대사량과 하루 필요 칼로리</h2><p>Mifflin-St Jeor(1990): 남 10 × 몸무게 + 6.25 × 키 − 5 × 나이 + 5, 여 −161. 비교용 Harris-Benedict는 1984년 개정식. 하루 필요 칼로리는 기초대사량 × 활동 계수(1.2 · 1.375 · 1.55 · 1.725 · 1.9). 단백질 권장량은 한국인 영양소 섭취기준(2020) 0.8g/kg과 운동 시 1.4g/kg 안팎.</p>
<h2>체지방률</h2><p>미 해군 공식(Hodgdon & Beckett 1984), cm 단위. 남 495 ÷ (1.0324 − 0.19077·log(허리 − 목) + 0.15456·log(키)) − 450, 여 495 ÷ (1.29579 − 0.35004·log(허리 + 엉덩이 − 목) + 0.22100·log(키)) − 450. 판정은 ACE 분류.</p>
<h2>칼로리</h2><p>음식 칼로리는 식품의약품안전처 식품영양성분 DB와 외식 영양성분 자료를 1인분 기준으로 반올림한 대략값입니다. 운동 소모 칼로리 = MET × 3.5 × 몸무게(kg) ÷ 200 × 분, MET는 Compendium of Physical Activities(2011)의 보통 강도 값. 물 섭취량은 몸무게 × 33ml(임상 어림 기준 30~35ml/kg).</p>
<h2>출산예정일·배란일</h2><p>출산예정일 = 마지막 생리 시작일 + 280일(네겔레 법칙, 주기 28일 가정). 임신 주수는 마지막 생리 시작일을 0주 0일로 셉니다. 배란일 = 다음 생리 예정일 − 14일, 가임기 = 배란 5일 전 ~ 1일 뒤. 모두 평균값이며 초음파·검사 결과가 우선합니다.</p>
<h2>아기 개월수·예방접종</h2><p>개월수는 달력 기준(같은 날짜가 될 때 1개월). 예방접종 일정은 질병관리청 「표준 예방접종 일정표」의 국가예방접종 항목을 생년월일에 더해 계산했으며, 실제 접종은 소아과의 판단에 따릅니다. 초등학교 입학 연도 = 출생연도 + 7.</p>
<h2>걸음 수·수면·다이어트 기간</h2><p>보폭 = 키(cm) × 0.415, 시속 4km(MET 3.0) 가정. 수면 주기는 90분, 잠드는 시간 15분. 다이어트 기간 = 감량 kg × 7,700 ÷ 하루 결손 kcal. 나이별 권장 칼로리는 「2020 한국인 영양소 섭취기준」 에너지 필요추정량.</p>
<h2>아이 예상 키</h2><p>Tanner 중간 부모 키: 아들 (아버지 + 어머니 + 13) ÷ 2, 딸 (아버지 + 어머니 − 13) ÷ 2, 95% 범위 ±8.5cm.</p>
<h2>혈중알코올농도</h2><p>위드마크(Widmark) 공식: 알코올(g) = 양(ml) × 도수 × 0.7894. 농도(%) = 알코올(g) × 0.9(흡수율) ÷ (몸무게 × r × 10), r = 남 0.68 · 여 0.55. 마지막 잔을 마신 뒤 흡수 1.5시간이 지나면 0.015%p/시간으로 분해. 단속 기준은 도로교통법(0.03% 정지, 0.08% 취소).</p>
<h2>건강검진 수치</h2><p>혈압은 대한고혈압학회 「2022 고혈압 진료지침」(정상 120/80 미만, 주의 수축기 120~129이면서 이완기 80 미만, 고혈압 전단계 130~139 또는 80~89, 1기 140~159 또는 90~99, 2기 160 이상 또는 100 이상, 180/120 이상 고혈압 위기), 혈당은 대한당뇨병학회 「2023 당뇨병 진료지침」(공복 100 미만 정상·100~125 공복혈당장애·126 이상 당뇨, 당화혈색소 5.7·6.5%), 지질은 한국지질동맥경화학회 「2022 이상지질혈증 진료지침」(총콜레스테롤 200·240, LDL 100·130·160·190, HDL 40·60, 중성지방 150·200·500), 간수치는 국가건강검진 일반 참고치(AST·ALT 40 IU/L 이하, 감마지티피 남 11~63·여 8~35), 요산은 남 3.4~7.0·여 2.4~6.0 mg/dL를 기준으로 판정합니다. LDL 추정은 Friedewald 식(총콜레스테롤 − HDL − 중성지방/5, 중성지방 400 미만에서만 유효)입니다. 검진 수치는 한 번의 결과로 진단하지 않으며 재검과 진료가 우선합니다.</p>
<h2>캘린더 내보내기</h2><p>.ics 파일은 iCalendar(RFC 5545) 형식으로 접종·건강검진·기념일을 하루 종일 일정으로 담고, 하루 전 오전 9시 알림(VALARM)을 넣습니다. 영유아 건강검진은 2021년 개편 8차(14~35일, 4~6, 9~12, 18~24, 30~36, 42~48, 54~60, 66~71개월)와 구강검진 4회 기준입니다. 파일은 기기 안에서만 열리며 바디집 서버에 저장되지 않습니다.</p>
<h2>아기 성장 백분위</h2><p>WHO Child Growth Standards(2006)의 LMS 값으로 z점수 = ((측정값/M)^L − 1) ÷ (L × S)를 구하고 표준정규분포로 백분위를 냅니다. 질병관리청 2017 소아청소년 성장도표는 0~35개월에 이 표준을 그대로 채택했습니다. WHO 일 단위 표에서 개월 × 30.4375일 행을 뽑아 월 값으로 쓰며(공식 월 표와 최대 0.06cm·0.02kg 차이), 이웃한 달 사이는 선형 보간.</p>
<h2>반려동물</h2><p>나이 환산은 AVMA 지침(중형견 기준 1살 15세, 2살 24세, 이후 해마다 5세)을 크기별 4·5·6세로 나눈 통용 공식(고양이는 4세). 사료량은 RER = 70 × 몸무게^0.75(kcal)에 WSAVA 상태 계수를 곱한 하루 열량을 사료 100g당 열량(기본 370kcal)으로 나눕니다. 접종 일정은 국내 동물병원 일반 일정.</p>
<h2>카페인·금연</h2><p>카페인 함량은 식약처 DB·매장 공개값의 대표치, 권고량은 식약처(성인 400mg·임산부 300mg·청소년 2.5mg/kg), 반감기 5시간. 금연 계산의 되찾은 시간은 개비당 20분(UCL 2024), 회복 단계는 미국 CDC·보건복지부 금연길라잡이.</p>
<h2>아이 키 백분위 (만 3~18세)</h2><p>질병관리청·대한소아청소년과학회 「2017 소아청소년 성장도표」의 연령별 신장·체중·체질량지수 LMS 값(36~227개월, 월 단위)으로 z점수를 구해 백분위를 냅니다. 이웃한 달 사이는 선형 보간합니다. 나이별 페이지는 만 N세 0개월, 키별 페이지는 그 나이의 한가운데인 만 N세 6개월 기준이고, 학년별 페이지는 9월 1일 기준 7월생 나이(초1 = 만 7세 2개월, 한 학년에 12개월씩)로 읽었습니다. 판정은 키 3백분위 미만이면 성장 평가 권장, BMI는 5백분위 미만 저체중·85백분위 이상 과체중·95백분위 이상 또는 25 이상 비만입니다. 만 18세 키 어림은 지금 z점수를 216개월에 그대로 대입한 값이라 사춘기 시기에 따라 실제와 차이가 납니다. LMS 표는 공식 엑셀을 옮긴 공개 자료에서 가져왔고, 표 안의 LMS와 백분위 값이 반올림 범위로 맞는지, 국민건강보험공단 공공데이터(영유아 성장도표 LMS 기준)와 겹치는 개월의 값이 같은지 확인했습니다.</p>
<h2>분유 수유량</h2><p>미국소아과학회(AAP) HealthyChildren 「Amount and Schedule of Baby Formula Feedings」(2022)의 규칙대로 하루 총량을 몸무게 1파운드(453g)당 2.5온스(75ml), 즉 1kg당 약 165ml로 잡고 하루 평균 960ml(32온스)를 넘지 않게 자릅니다. 생후 1주 안은 1회 30~60ml를 2~3시간마다(하루 8~12회, 미국 CDC) 먹이는 것으로 안내하고 몸무게 계산은 하지 않습니다. 이후 하루 횟수는 0개월 8회 · 1개월 7회 · 2~3개월 6회 · 4~5개월 5회를 기준으로 두고(AAP·CDC의 3~4시간 간격과 6개월 무렵 4~5회를 이은 값), 1회량은 하루 총량을 횟수로 나눠 10ml 단위로 반올림합니다. 6~11개월은 이유식과 함께 1회 180~240ml(AAP 6개월 무렵)를 이유식 단계에 맞춘 횟수로, 돌 이후는 생우유 하루 400~500ml로 안내합니다. 개월별 보통 몸무게는 WHO 성장 표준 50백분위의 남녀 평균이고, 개월 페이지는 그 달의 한가운데(N개월 15일 무렵) 기준입니다.</p>
<h2>임신 중 체중 증가</h2><p>미국 국립의학원(IOM) 「Weight Gain During Pregnancy: Reexamining the Guidelines」(2009)의 임신 전 BMI별 권장 총 증가량(저체중 12.5~18kg · 정상 11.5~16kg · 과체중 7~11.5kg · 비만 5~9kg, 쌍둥이 잠정 권고 정상 17~25 · 과체중 14~23 · 비만 11~19kg)을 씁니다. 임신 전 BMI 구간은 세계보건기구 기준(18.5 · 25 · 30)입니다. 주차별 범위는 1분기(13주까지) 0.5~2kg을 주수에 비례해 나누고, 14주부터 40주까지는 총 증가 범위의 하한·상한으로 곧게 이었습니다. 총 증가량에 맞춰 이은 값이라 한 주 증가는 IOM의 2·3분기 주당 권고(저체중 0.44~0.58 · 정상 0.35~0.50 · 과체중 0.23~0.33 · 비만 0.17~0.27kg)와 조금 다를 수 있습니다. 정상 BMI의 하한은 한 주 약 0.41kg으로 권고(0.35kg)보다 높고, 나머지는 한 주 0.03kg 안으로 같습니다. 분기별 추가 칼로리(2분기 하루 약 340kcal · 3분기 약 450kcal)는 미국 CDC 안내입니다.</p>
<h2>혈압 기록</h2><p>집에서 잰 혈압은 이 브라우저(localStorage)에만 저장하고 서버로 보내지 않습니다. 최근 7일 안의 측정값을 모두 산술평균해 대한고혈압학회의 가정혈압 고혈압 기준(135/85mmHg, 수축기나 이완기 중 하나라도 이상)과 비교하고, 시각으로 아침(4~12시)·저녁(18~4시)을 나눠 따로 평균을 냅니다. 잰 날이 5일이 안 되면 더 모으라고 안내합니다. 한 번 잰 값은 180/120 이상이면 매우 높음(혈압 수치표의 위기 기준과 같음), 135/85 이상 높음, 90/60 미만 낮음으로 표시합니다.</p>
<h2>임신 주차·아기 개월별 발달</h2><p>주차별 아기 크기·길이·몸무게와 개월별 평균 키·몸무게(질병관리청 2017 성장도표 50백분위 부근)는 일반적인 참고값이며 개인차가 큽니다. 검사 시기는 국내 산부인과의 일반적 일정, 발달 이정표는 소아과 일반 안내를 따랐습니다.</p>
<h2>주의</h2><p>바디집의 모든 결과는 공개된 공식과 기준에 따른 참고용 정보이며 의학적 진단·치료를 대신하지 않습니다. 건강 문제는 의사와 상의하세요.</p>`);
  doc('/about/', '소개 — 바디집', '바디집은 몸에 관한 숫자를 미리 계산해 표로 묶어 둔 계산 사전입니다.', `
<p>바디집은 몸에 관한 숫자를 한곳에 모아 둔 집입니다. "키 170에 65면 정상인가?", "치킨 한 마리는 밥 몇 공기?", "출산예정일이 언제?" 같은 질문에 숫자만 넣으면 바로 답이 나오도록 미리 계산해 둔 사전입니다. 회원 가입도, 입력값 저장도 없습니다.</p>
<p>모든 계산은 공개된 의학 기준과 공식(대한비만학회, Mifflin-St Jeor, 미 해군 체지방 공식, Compendium of Physical Activities, 식약처 영양성분 DB, 질병관리청 예방접종 일정)으로만 하며 <a href="/method/">계산 기준</a>에 출처를 적어 두었습니다. 기준이 바뀌면 갱신합니다.</p>
<p>바디집은 <a href="${SISTERS.donpyo}/">돈표</a>(돈 계산 사전)와 <a href="${SISTERS.saju}/">사주첩</a>을 만든 팀이 운영합니다.</p>
<h2>문의</h2><p>오류 제보와 기준 갱신 요청은 인스타그램 <a href="https://www.instagram.com/sajucheop/" target="_blank" rel="noopener">@sajucheop</a> 메시지로 보내 주세요.</p>`);
  doc('/terms/', '이용약관 — 바디집', '바디집 이용약관.', `
<p>바디집(이하 "사이트")는 몸에 관한 계산 결과를 제공하는 무료 정보 서비스입니다. 사이트를 이용하면 아래 내용에 동의한 것으로 봅니다.</p>
<p>사이트의 모든 계산 결과는 공개된 공식과 기준에 따른 참고용 정보이며 의학적 진단, 치료, 처방을 대신하지 않습니다. 건강·임신·육아에 관한 결정은 반드시 의료인과 상의하세요. 이용자는 계산 결과를 근거로 한 결정에 대해 스스로 책임지며, 사이트는 결과의 정확성·완전성을 보증하지 않고 이용으로 인한 손해에 책임지지 않습니다.</p>
<p>사이트의 글과 표는 저작권법의 보호를 받습니다. 출처(바디집, bodyzip.com)를 밝힌 인용과 링크는 자유롭게 할 수 있으나 전체 복제·재배포는 금합니다.</p>`);
  doc('/privacy/', '개인정보처리방침 — 바디집', '바디집 개인정보처리방침.', `
<h2>1. 수집하는 정보</h2><p>바디집은 회원 가입이나 개인정보 입력을 요구하지 않습니다. 계산기에 넣는 키·몸무게·날짜는 이용자의 브라우저 안에서만 처리되며 서버로 전송·저장되지 않습니다.</p>
<h2>2. 쿠키와 분석</h2><p>Google Analytics로 방문 통계(페이지 조회, 기기 종류, 유입 경로)를 수집하고 Google AdSense 광고가 게재될 수 있습니다. 이들 서비스는 쿠키를 사용할 수 있으며, 브라우저 설정에서 쿠키를 거부할 수 있습니다. 광고 개인 최적화는 <a href="https://adssettings.google.com/" target="_blank" rel="noopener">Google 광고 설정</a>에서 관리할 수 있습니다.</p>
<h2>3. 제3자 제공</h2><p>수집한 정보를 제3자에게 판매·제공하지 않습니다.</p>
<h2>4. 문의</h2><p>개인정보 관련 문의는 인스타그램 <a href="https://www.instagram.com/sajucheop/" target="_blank" rel="noopener">@sajucheop</a> 메시지로 보내 주세요. 시행일 ${BUILD_ISO}.</p>`);
  fs.writeFileSync(path.join(OUT, '404.html'), shell({ url: '/404.html', title: '페이지를 찾을 수 없어요 — 바디집', desc: '없는 페이지', noindex: true, body: `<h1 class="title" style="margin-top:40px">페이지를 찾을 수 없어요</h1><p class="lead">주소가 바뀌었거나 없는 페이지입니다. <a href="/">홈에서 키·몸무게를 넣어 보세요</a>.</p>` }));
}

/* ---------- 빌드 ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(SRC, OUT, { recursive: true });
home();
bmiIndex(); for (const h of HEIGHTS) { heightPage(h); for (const w of WEIGHTS) bmiPage(h, w); }
bmrPage(); bodyfatPage();
foodIndex(); FOODS.forEach(foodPage);
exerciseIndex(); EXERCISES.forEach(exercisePage);
waterIndex(); WATER_KG.forEach(waterPage);
dueIndex(); MONTHS.forEach(([m, d]) => duePage(m, d));
ovIndex(); MONTHS.forEach(([m, d]) => ovPage(m, d));
const babyDates = []; for (let k = 3 * 365; k >= 0; k--) babyDates.push(D.addDays(TODAY, -k));
babyIndex(babyDates); babyDates.forEach(babyPage);
const CTX = { write, shell, crumb, tiles, list, section, table, lead, ad, hero, TODAY, SISTERS, OUT, babyMin: D.addDays(TODAY, -3 * 365) };
buildExtra(CTX); buildPet(CTX); buildMore(CTX); buildCheckup(CTX); buildKids(CTX); buildFormula(CTX); buildPregWeight(CTX); buildBpLog(CTX);
fs.writeFileSync(path.join(OUT, 'js', 'engine.js'), makeBundle());
embedPages();
toolPages();
docs();
const indexable = urls.filter((u) => !['/terms/', '/privacy/'].includes(u));
/* 사이트맵 분할 — 구역별 파일 + 인덱스 (색인 속도·구역별 색인 현황 확인용) */
const SM_GROUPS = [['bmi', /^\/bmi\//], ['food', /^\/(food|caffeine)\//], ['exercise', /^\/(exercise|steps)\//], ['pregnancy', /^\/(due-date|ovulation|pregnancy)\//], ['baby', /^\/baby\//], ['pet', /^\/pet\//], ['life', /^\/(bmr|bodyfat|water|sleep|diet|alcohol|quit-smoking|kcal-need|child-height|today|weight)\//], ['checkup', /^\/(checkup|bp|glucose|cholesterol|ldl|hdl|triglyceride|liver|uric)\//], ['kids', /^\/kids\//], ['guide', /.*/]];
const smFiles = [];
for (const [key, re] of SM_GROUPS) {
  const list = indexable.filter((u) => re.test(u) && !smFiles.some((f) => f.set.has(u)));
  if (!list.length) continue;
  const file = `sitemap-${key}.xml`;
  fs.writeFileSync(path.join(OUT, file), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${BUILD_ISO}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  smFiles.push({ file, set: new Set(list), n: list.length });
}
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${smFiles.map((f) => `<sitemap><loc>${SITE}/${f.file}</loc><lastmod>${BUILD_ISO}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`);
console.log('사이트맵:', smFiles.map((f) => `${f.file} ${f.n}`).join(' · '));
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
if (DOMAIN_READY) fs.writeFileSync(path.join(OUT, 'CNAME'), 'bodyzip.com\n');
console.log(`바디집 빌드 완료: 페이지 ${urls.length}장, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
