/* 임신 중 체중 증가 — /pregnancy/weight/ 계산기 · /pregnancy/weight/week/{4~40}/ 주차별 · /pregnancy/weight/{under|normal|over|obese}/ 임신 전 BMI별 */
import * as PW from '../engine/pregweight.mjs';

export const PW_WEEKS = []; for (let w = 4; w <= 40; w++) PW_WEEKS.push(w);
export const pwUrl = (w) => `/pregnancy/weight/week/${w}/`;
export const pcUrl = (k) => `/pregnancy/weight/${k}/`;
const rg = ([a, b]) => `${a}~${b}kg`;
const r1 = (x) => Math.round(x * 10) / 10;
const EX_BMI = { under: 17.5, normal: 21.5, over: 27, obese: 32 };          /* BMI별 페이지의 예시 몸무게 */
const LEAD = {
  under: '임신 전에 마른 편이었다면 정상보다 조금 더 늘리는 것이 권장됩니다.',
  normal: '임신 전 BMI가 정상이면 이 범위가 기준입니다.',
  over: '임신 전에 과체중이었다면 정상보다 덜 늘리는 것이 권장됩니다.',
  obese: '임신 전에 비만이었다면 가장 적게 늘립니다. 임신 중에 살을 빼라는 뜻은 아니며, 식사량은 담당 의사와 정하세요.',
};

export function buildPregWeight(ctx) {
  const { write, shell, crumb, tiles, list, section, table, lead, ad } = ctx;
  const chipsWrap = (items) => `<div class="chips" style="flex-wrap:wrap;overflow:visible">${items.map((c) => c.on ? `<span class="chip on" style="min-width:0;padding:4px 9px">${c.label}</span>` : `<a class="chip" style="min-width:0;padding:4px 9px" href="${c.href}">${c.label}</a>`).join('')}</div>`;
  const NOTE = `<p class="note">권장 범위는 미국 국립의학원(IOM) 「Weight Gain During Pregnancy: Reexamining the Guidelines」(2009)로, 미국 CDC와 미국산부인과학회가 따르는 기준입니다. 임신 전 BMI는 세계보건기구 구간(18.5·25·30)을 쓰고, 주차별 범위는 1분기 0.5~2kg에서 40주 총 증가량까지 곧게 이은 값입니다. 쌍둥이 기준은 IOM의 잠정 권고입니다. 담당 의사의 안내가 우선입니다. <a href="/method/">계산 기준 보기</a></p>`;
  const KNOTE = '<p class="sub" style="margin-top:6px">IOM 기준은 BMI 25부터 과체중으로 봅니다. 한국 성인 기준(대한비만학회)으로는 23~24.9가 비만 전 단계라, 임신 전 BMI가 이 구간이면 목표를 담당 의사와 정하세요.</p>';
  const RISK = '<div class="doc"><p>너무 적게 늘면 아기가 작게 태어나거나 일찍 태어날 위험이 커지고, 너무 많이 늘면 아기가 크게 자라 제왕절개가 늘고 출산 뒤에도 몸무게가 남기 쉽습니다(IOM 2009). 한두 번 잰 숫자보다 몇 주에 걸친 흐름을 보세요. 아침 화장실을 다녀온 뒤 같은 옷차림으로 재면 가장 정확합니다.</p></div>';
  const triDoc = (w) => { const t = PW.trimester(w); return t === 1
    ? '<p><b>1분기에는 조금만 늘어도 됩니다.</b> 13주까지 0.5~2kg이면 충분하고, 입덧으로 몸무게가 늘지 않거나 조금 빠지는 경우도 흔합니다. 1분기에는 따로 칼로리를 더 먹지 않아도 됩니다(미국 CDC).</p>'
    : t === 2 ? '<p><b>2분기부터 꾸준히 늘어납니다.</b> 임신 전 BMI가 정상이면 한 주에 0.35~0.5kg 정도가 알맞고, 하루 약 340kcal를 더 먹으면 됩니다(미국 CDC). 밥 한 공기가 약 300kcal입니다.</p>'
    : '<p><b>3분기는 하루 약 450kcal를 더 먹는 시기입니다</b>(미국 CDC). 몸이 붓기 쉬워 몸무게가 들쭉날쭉할 수 있지만, 1주에 1kg 넘게 늘거나 얼굴·손이 갑자기 부으면 임신중독증(전자간증) 신호일 수 있으니 병원에 알리세요.</p>'; };
  const form = (w = '', h = '', pre = '') => `<form class="quick live" data-live="pregweight" style="margin-top:14px"><div class="live-head"><b>내 몸무게로 계산</b><span>IOM 2009 · 임신 전 BMI 기준</span></div><div class="ye-grid"><label class="ye-f"><span>키 (cm)</span><input data-k="h" type="text" inputmode="decimal" value="${h}"></label><label class="ye-f"><span>임신 전 몸무게 (kg)</span><input data-k="pre" type="text" inputmode="decimal" value="${pre}"></label><label class="ye-f"><span>지금 몸무게 (kg)</span><input data-k="now" type="text" inputmode="decimal" value=""></label><label class="ye-f"><span>임신 주수</span><input data-k="week" type="text" inputmode="numeric" value="${w}"></label><label class="ye-f"><span>또는 마지막 생리 시작일</span><input data-k="lmp" type="date" value=""></label><label class="ye-f"><span>아기</span><select data-k="twins"><option value="0">한 명</option><option value="1">쌍둥이</option></select></label></div><div class="tiles"><div class="tile"><small>임신 전 BMI</small><span class="num" data-out="bmi">—</span></div><div class="tile"><small>출산까지 권장 증가</small><span class="num" data-out="total">—</span></div><div class="tile"><small>출산 무렵 몸무게</small><span class="num" data-out="target">—</span></div></div><div class="tiles"><div class="tile"><small>이번 주 권장 증가</small><span class="num" data-out="range">—</span></div><div class="tile"><small>지금까지 늘어난 양</small><span class="num" data-out="gain">—</span></div></div><p class="sub" style="margin-top:8px"><b data-out="verdict"></b> <span data-out="note"></span></p><div class="live-foot"><a data-out="link" href="/pregnancy/weight/">표 보기 →</a></div></form>`;
  const catRows = (w) => PW.PW_CATS.map((c) => ({ cells: [`<a href="${pcUrl(c.key)}">${c.label}</a> <small>${c.range}</small>`, rg(PW.gainRange(c, w)), rg(c.total), `${c.weekly[0]}~${c.weekly[1]}kg`], cls: c.key === 'normal' ? 'on' : '' }));

  /* ---------- 주차별 4~40주 ---------- */
  for (const w of PW_WEEKS) {
    const n = PW.gainRange('normal', w), t = PW.trimester(w), url = pwUrl(w);
    const all = PW.PW_CATS.map((c) => `${c.label} ${rg(PW.gainRange(c, w))}`).join(' · ');
    const title = `임신 ${w}주 체중 증가 — 임신 전보다 ${rg(n)} (정상 BMI 기준)`;
    const desc = `임신 ${w}주에는 임신 전보다 몇 kg 늘면 될까요? 임신 전 BMI별 권장 범위는 ${all}입니다(미국 IOM 2009). 출산까지 총 11.5~16kg(정상). 키와 몸무게로 바로 계산.`;
    const body = `
${crumb([['/due-date/', '임신'], ['/pregnancy/weight/', '체중 증가'], [null, `${w}주`]])}
<h1 class="title">임신 ${w}주 체중 증가</h1>
<p class="meta">${t}분기 · 임신 전 몸무게와 비교 · 미국 IOM 2009</p>
${tiles([{ label: '정상 BMI', value: rg(n) }, { label: t === 1 ? '1분기 합계' : '2·3분기 한 주', value: t === 1 ? '0.5~2kg' : '0.35~0.5kg' }, { label: '출산까지 총', value: '11.5~16kg' }])}
${lead(`임신 ${w}주에는 임신 전보다 <b>${rg(n)}</b> 늘어난 정도가 알맞습니다(임신 전 BMI 정상 기준). 임신 전에 마른 편이었다면 조금 더(${rg(PW.gainRange('under', w))}), 과체중이었다면 덜(${rg(PW.gainRange('over', w))}) 늘리는 것이 권장됩니다. 키와 임신 전 몸무게를 넣으면 내 기준으로 계산합니다.`)}
${form(w)}
${section('임신 전 BMI별', `${w}주까지 늘어난 몸무게`, table(['임신 전 BMI', `${w}주까지`, '출산까지 총', '2·3분기 한 주'], catRows(w)))}
${KNOTE}
${section('이 시기', `${t}분기`, `<div class="doc">${triDoc(w)}</div>`)}
${ad()}
${section('너무 적게, 너무 많이', null, RISK)}
<div class="pager">${w > 4 ? `<a href="${pwUrl(w - 1)}">← ${w - 1}주</a>` : '<span></span>'}${w < 40 ? `<a href="${pwUrl(w + 1)}">${w + 1}주 →</a>` : '<span></span>'}</div>
${section('주차별', null, chipsWrap(PW_WEEKS.map((x) => ({ label: `${x}주`, href: pwUrl(x), on: x === w }))))}
${section('이어서', null, list([{ href: `/pregnancy/week/${w}/`, title: `임신 ${w}주 안내`, sub: '아기 크기 · 엄마 몸 · 검사' }, { href: '/pregnancy/weight/', title: '임신 체중 증가 계산기', sub: '키·임신 전 몸무게로' }, { href: '/due-date/', title: '출산예정일 계산기', sub: '마지막 생리일로' }]))}
${NOTE}`;
    write(url, shell({ og: 'pregweight', url, title, desc, body, nav: 'preg', scripts: ['/js/engine.js', '/js/live.js'] }));
  }

  /* ---------- 임신 전 BMI별 ---------- */
  for (const c of PW.PW_CATS) {
    const url = pcUrl(c.key), bmiTxt = c.range.replace('BMI ', '');
    const ex = [155, 160, 165, 170].map((h) => { const pre = Math.round(EX_BMI[c.key] * Math.pow(h / 100, 2)); return { h, pre, t: [r1(pre + c.total[0]), r1(pre + c.total[1])] }; });
    const e160 = ex[1];
    const title = `임신 전 ${c.label}(${c.range}) 임신 체중 증가 — 출산까지 ${rg(c.total)}, 2·3분기 한 주 ${c.weekly[0]}~${c.weekly[1]}kg`;
    const desc = `임신 전 BMI ${bmiTxt}(${c.label})이면 출산까지 ${rg(c.total)} 늘리는 것이 권장됩니다(미국 IOM 2009). 주차별 권장 범위 표, 키별 출산 무렵 몸무게 예시, 쌍둥이 기준 ${c.twins ? rg(c.twins) : '없음'}.`;
    const body = `
${crumb([['/due-date/', '임신'], ['/pregnancy/weight/', '체중 증가'], [null, `임신 전 ${c.label}`]])}
<h1 class="title">임신 전 ${c.label} — 체중 증가</h1>
<p class="meta">${c.range} · 미국 IOM 2009</p>
${tiles([{ label: '출산까지 총', value: rg(c.total) }, { label: '2·3분기 한 주', value: `${c.weekly[0]}~${c.weekly[1]}kg` }, { label: '쌍둥이', value: c.twins ? rg(c.twins) : '권고치 없음' }])}
${lead(`${LEAD[c.key]} 출산까지 <b>${rg(c.total)}</b>, 1분기에는 0.5~2kg, 2분기부터는 한 주에 ${c.weekly[0]}~${c.weekly[1]}kg 정도가 기준입니다(미국 IOM 2009). 예를 들어 키 160cm에 임신 전 ${e160.pre}kg이면 출산 무렵 ${rg(e160.t)}입니다.`)}
${form('', e160.h, e160.pre)}
${section('주차별 권장 증가', `임신 전 ${c.label}`, table(['주수', '임신 전보다', `키 160 · 임신 전 ${e160.pre}kg이면`], [8, 12, 16, 20, 24, 28, 32, 36, 40].map((w) => { const g = PW.gainRange(c, w); return { cells: [`<a href="${pwUrl(w)}">${w}주</a>`, rg(g), `${r1(e160.pre + g[0])}~${r1(e160.pre + g[1])}kg`] }; })))}
${section('키별 출산 무렵 몸무게', `임신 전 BMI ${EX_BMI[c.key]} 예시`, table(['키', '임신 전', '출산 무렵'], ex.map((e) => ({ cells: [`${e.h}cm`, `${e.pre}kg`, rg(e.t)] }))))}
${c.key === 'normal' ? KNOTE : ''}
${ad()}
${section('너무 적게, 너무 많이', null, RISK)}
${section('다른 BMI', null, chipsWrap(PW.PW_CATS.map((x) => ({ label: `${x.label} (${x.range.replace('BMI ', '')})`, href: pcUrl(x.key), on: x.key === c.key }))))}
${section('이어서', null, list([{ href: '/pregnancy/weight/', title: '임신 체중 증가 계산기', sub: '키·임신 전 몸무게로' }, { href: `/bmi/${e160.h}/`, title: '키 160 BMI 표', sub: '임신 전 BMI 확인' }, { href: '/pregnancy/week/', title: '임신 주차별 안내', sub: '1~42주' }]))}
${NOTE}`;
    write(url, shell({ og: 'pregweight', url, title, desc, body, nav: 'preg', scripts: ['/js/engine.js', '/js/live.js'] }));
  }

  /* ---------- 계산기 (허브) ---------- */
  write('/pregnancy/weight/', shell({ og: 'pregweight', url: '/pregnancy/weight/', nav: 'preg', scripts: ['/js/engine.js', '/js/live.js'], title: '임신 중 체중 증가 계산기 — 임신 전 BMI별 권장 범위와 주차별 몸무게 (IOM 2009)', desc: '키와 임신 전 몸무게를 넣으면 출산까지 권장 체중 증가(정상 BMI 11.5~16kg), 출산 무렵 몸무게, 이번 주 권장 범위와 지금까지 늘어난 양의 판정이 나옵니다. 쌍둥이 기준 포함, 미국 IOM 2009 기준.', body: `
${crumb([['/due-date/', '임신'], [null, '체중 증가']])}
<h1 class="title">임신 중 체중 증가</h1>
<p class="meta">미국 국립의학원(IOM) 2009 · 임신 전 BMI 기준 · 한 명·쌍둥이</p>
${form(20, 160, 55)}
${lead('임신 중에 늘어야 할 몸무게는 임신 전 BMI에 따라 다릅니다. 임신 전 BMI가 정상(18.5~24.9)이면 출산까지 11.5~16kg이고, 마른 편이면 더, 과체중·비만이면 덜 늘립니다. 1분기에는 0.5~2kg, 2분기부터는 한 주에 0.35~0.5kg(정상 기준) 정도 늘어납니다.')}
${section('임신 전 BMI별 권장 증가', '미국 IOM 2009', table(['임신 전 BMI', '출산까지 총', '2·3분기 한 주', '쌍둥이'], PW.PW_CATS.map((c) => ({ cells: [`<a href="${pcUrl(c.key)}">${c.label}</a> <small>${c.range}</small>`, rg(c.total), `${c.weekly[0]}~${c.weekly[1]}kg`, c.twins ? rg(c.twins) : '권고치 없음'], cls: c.key === 'normal' ? 'on' : '' }))))}
${KNOTE}
${section('주차별로 보기', '임신 전보다 몇 kg', chipsWrap(PW_WEEKS.map((w) => ({ label: `${w}주`, href: pwUrl(w) }))))}
${ad()}
${section('분기별로', null, `<div class="doc">${triDoc(10)}${triDoc(20)}${triDoc(32)}</div>`)}
${section('너무 적게, 너무 많이', null, RISK)}
${section('이어서', null, list([{ href: '/due-date/', title: '출산예정일 계산기', sub: '마지막 생리일로' }, { href: '/pregnancy/week/', title: '임신 주차별 안내', sub: '아기 크기 · 엄마 몸 · 검사' }, { href: '/bmi/', title: 'BMI 계산', sub: '임신 전 BMI 확인' }, { href: '/caffeine/', title: '카페인 계산', sub: '임신 중 하루 300mg' }]))}
${NOTE}` }));
}
