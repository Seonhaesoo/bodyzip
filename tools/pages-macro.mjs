/* /macro/ 탄단지 계산기 (2026-11-28) — 키·몸무게·나이·활동량으로 하루 칼로리(Mifflin-St Jeor, /bmr/ 과 같은 식)를 구하고
 * 2025 한국인 영양소 섭취기준의 에너지적정비율로 탄수화물·단백질·지방 g. 한 장짜리 — 숫자별 페이지는 만들지 않는다 */
import * as M from '../engine/macro.mjs';
import * as B from '../engine/body.mjs';
import { num } from '../engine/fmt.mjs';

const MOHW_2025 = 'https://www.mohw.go.kr/board.es?mid=a10503010100&bid=0027&act=view&list_no=1488441';

export function buildMacro(ctx) {
  const { write, shell, crumb, tiles, list, section, table, lead, ad } = ctx;
  const ex = M.macroPlan(2000);
  const LEVELS = [1500, 1800, 2000, 2200, 2500, 2800];
  const lvRows = LEVELS.map((k) => { const p = M.macroPlan(k); return { cells: [`${num(k)}kcal`, `${p.pick.carb}g`, `${p.pick.protein}g`, `${p.pick.fat}g`] }; });
  const amdrRows = [['탄수화물', 'carb'], ['단백질', 'protein'], ['지방', 'fat']].map(([l, k]) => ({ cells: [l, `${M.AMDR_2025[k][0]}~${M.AMDR_2025[k][1]}%`, `${M.AMDR_2020[k][0]}~${M.AMDR_2020[k][1]}%`, `${ex.range[k][0]}~${ex.range[k][1]}g`] }));
  const sel = (id, opts, def) => `<select id="${id}">${opts.map(([v, t]) => `<option value="${v}"${v === def ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const form = `<form class="quick ye-form" id="mc-form" style="margin-top:14px">
<div class="live-head"><b>내 하루 탄단지</b><span>입력값은 이 기기 밖으로 나가지 않습니다</span></div>
<div class="ye-grid">
<label class="ye-f"><span>성별</span>${sel('mc-sex', [['f', '여'], ['m', '남']], 'f')}</label>
<label class="ye-f"><span>나이</span><input id="mc-age" type="text" inputmode="numeric" value="30"></label>
<label class="ye-f"><span>키 (cm)</span><input id="mc-h" type="text" inputmode="decimal" value="162"></label>
<label class="ye-f"><span>몸무게 (kg)</span><input id="mc-w" type="text" inputmode="decimal" value="58"></label>
<label class="ye-f"><span>활동량</span>${sel('mc-act', B.ACTIVITY.map((a) => [a.key, a.label]), 'light')}</label>
<label class="ye-f"><span>목표</span>${sel('mc-goal', [['keep', '유지'], ['lose', '감량 (하루 −500kcal)'], ['gain', '증량 (하루 +300kcal)']], 'keep')}</label>
<label class="ye-f"><span>배분</span>${sel('mc-split', M.SPLITS.map((s) => [s.key, s.label]), 'balanced')}</label>
</div>
</form>
<div class="hero"><div class="hero-label" id="mc-label">하루 섭취 칼로리</div><div class="hero-num"><span class="num" id="mc-kcal">0</span><span class="unit">kcal</span></div><div class="hero-sub" id="mc-sub">계산 중</div></div>
<div class="tiles"><div class="tile"><small>탄수화물</small><span class="num" id="mc-c">—</span></div><div class="tile"><small>단백질</small><span class="num" id="mc-p">—</span></div><div class="tile"><small>지방</small><span class="num" id="mc-f">—</span></div></div>
<div id="mc-tips"></div>`;
  const body = `
${crumb([['/bmr/', '대사량'], [null, '탄단지 계산기']])}
<h1 class="title">탄단지 계산기 — 하루 탄수화물·단백질·지방 몇 g</h1>
<p class="meta">2025 한국인 영양소 섭취기준 에너지적정비율 · 탄수화물 50~65% · 단백질 10~20% · 지방 15~30%</p>
${tiles([{ label: '탄수화물', value: '50~65%' }, { label: '단백질', value: '10~20%' }, { label: '지방', value: '15~30%' }])}
${lead(`보건복지부가 2025년 말 5년 만에 개정한 「2025 한국인 영양소 섭취기준」에서 탄수화물 비율은 55~65%에서 <b>50~65%</b>로 낮아지고, 단백질은 7~20%에서 <b>10~20%</b>로 올라갔습니다. 하루 2,000kcal를 먹는다면 탄수화물 ${ex.range.carb[0]}~${ex.range.carb[1]}g, 단백질 ${ex.range.protein[0]}~${ex.range.protein[1]}g, 지방 ${ex.range.fat[0]}~${ex.range.fat[1]}g입니다. 아래에 키·몸무게를 넣으면 내 하루 칼로리와 g이 바로 나옵니다.`)}
${form}
${section('2025년 기준과 2020년 기준', `에너지적정비율 · 하루 2,000kcal로 환산하면`, table(['영양소', '2025년', '2020년', '2,000kcal면'], amdrRows) + '<p class="sub">1g당 탄수화물·단백질 4kcal, 지방 9kcal로 환산했습니다. 비율은 성인 기준입니다.</p>')}
${ad()}
${section('하루 칼로리별 g', '고르게 배분(탄 55 · 단 20 · 지 25) 기준', table(['하루 칼로리', '탄수화물', '단백질', '지방'], lvRows))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>비율은 범위입니다.</b> 세 영양소가 각각 범위 안에 있고 합이 100%면 어느 배분이든 기준 안입니다. 밥을 즐기는 식단이면 탄수화물 쪽을, 운동을 많이 하면 단백질 쪽을 높게 잡을 수 있습니다.</p>
<p><b>단백질은 몸무게로도 봅니다.</b> 이 계산기는 칼로리의 비율로 g을 구합니다. 나이·성별 단백질 권장섭취량(g)은 「2025 한국인 영양소 섭취기준」 원문 표가 기준이며, 콩팥 질환이 있으면 단백질을 늘리기 전에 의사와 상의하세요.</p>
<p><b>감량 중에도 단백질은 줄이지 않기.</b> 칼로리를 줄이면 같은 비율이라도 g이 줄어듭니다. 감량을 고르면 하루 칼로리가 줄어든 만큼 단백질 g도 줄어드니, 비율을 '고르게'나 '탄수화물 적게'로 두는 편이 근육 손실을 막는 데 유리합니다. 하루 섭취가 기초대사량이나 여 1,200·남 1,500kcal 아래로 내려가지 않게 계산합니다.</p>
<p><b>당류는 따로 챙기기.</b> 탄수화물 안에서도 설탕·시럽 같은 첨가당은 하루 섭취 칼로리의 10% 이내로 줄이는 것이 권장됩니다.</p>
</div>`)}
${section('이어서', null, list([{ href: '/bmr/', title: '기초대사량 계산기', sub: '하루 필요 칼로리의 기준' }, { href: '/kcal-need/', title: '나이별 하루 권장 칼로리', sub: '남녀 1세부터' }, { href: '/diet/', title: '다이어트 기간', sub: '목표 체중까지 몇 주' }, { href: '/food/', title: '음식 칼로리 사전', sub: '하루 칼로리를 채우는 음식' }]))}
<p class="note">비율은 ${'<a href="' + MOHW_2025 + '" target="_blank" rel="noopener">보건복지부 「영양소 적정 섭취기준 개정」 보도자료</a>'}(2025.12.31, 2025 한국인 영양소 섭취기준)의 에너지적정비율입니다. 하루 칼로리는 Mifflin-St Jeor 기초대사량 × 활동계수(/bmr/ 과 같은 식)로 구했고, 감량은 하루 500kcal를 빼되 기초대사량·여 1,200·남 1,500kcal 아래로는 내리지 않습니다. 참고용 정보이며 질환이 있거나 임신·수유 중이면 의사·영양사와 상의하세요. <a href="/method/">계산 기준 보기</a></p>`;
  const title = '탄단지 계산기 — 하루 탄수화물·단백질·지방 몇 g? (2025 영양소 섭취기준 비율)';
  const desc = `키·몸무게·나이·활동량을 넣으면 하루 칼로리와 탄수화물·단백질·지방 g이 나옵니다. 2025 한국인 영양소 섭취기준에서 탄수화물 50~65%, 단백질 10~20%, 지방 15~30%로 바뀐 비율 기준. 하루 2,000kcal면 단백질 ${ex.range.protein[0]}~${ex.range.protein[1]}g.`;
  write('/macro/', shell({ url: '/macro/', og: 'bmr', nav: 'bmr', modified: '2026-11-28', title, desc, body, scripts: ['/js/engine.js', '/js/macro.js'] }));
}
