/* /baby/diaper/ 기저귀 단계 몸무게표 (2026-11-28) — 한 장짜리. 몸무게(또는 생년월일·성별)를 넣으면 맞는 단계, 범위가 겹칠 때 고르는 법,
 * 같은 백분위로 자라면 언제쯤 다음 단계로 넘어가는지, 하루·한 달 기저귀 개수. 단계 범위의 근거와 한계는 engine/diaper.mjs 머리말.
 * 숫자별 페이지를 따로 만들지 않는다(비슷한 얇은 페이지를 늘리지 않기 — 2026-10 구글 스팸 업데이트 대응) */
import * as DP from '../engine/diaper.mjs';
import * as G from '../engine/growth.mjs';
import { num } from '../engine/fmt.mjs';

const MOD = '2026-11-28';
const TYP_MONTHS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 24, 30, 36, 48];
const mLabel = (m) => (m === 0 ? '신생아' : m % 12 === 0 && m >= 24 ? `${m / 12}살 (${m}개월)` : `${m}개월`);
const stepText = (r) => (r.alt ? `${r.main.short} <small>(${r.alt.short}도 맞음)</small>` : r.main.short);

export function buildDiaper(ctx) {
  const { write, shell, crumb, tiles, list, section, table, lead, ad, babyChain, coupangBox } = ctx;
  const ex = { m: 4, sex: 'm', kg: 7 };
  const exR = DP.diaperStep(ex.kg), exO = DP.diaperOutgrow(G, ex.sex, ex.m, ex.kg);
  const at = (sex, m) => DP.typicalStep(G, sex, m);
  const firstMonth = (sex, key) => { for (let m = 0; m <= 60; m += 0.5) if (at(sex, m).main.key >= key) return m; return null; };
  const mm = (x) => (x == null ? '—' : x < 1 ? '태어날 때' : `${Math.round(x)}개월`);

  const form = `<form class="quick" id="dp-form" style="margin-top:14px">
<div class="live-head"><b>우리 아기 기저귀 단계</b><span>몸무게만 넣어도 됩니다</span></div>
<div class="ye-grid">
<label class="ye-f"><span>몸무게 (kg)</span><input id="dp-kg" type="text" inputmode="decimal" value="${ex.kg}"></label>
<label class="ye-f"><span>성별</span><select id="dp-sex"><option value="m">남아</option><option value="f">여아</option></select></label>
<label class="ye-f"><span>생년월일 (선택 · 넣으면 개월 자동)</span><input id="dp-birth" type="date" value=""></label>
<label class="ye-f"><span>개월 (선택)</span><input id="dp-mo" type="text" inputmode="decimal" value="${ex.m}"></label>
</div>
</form>
<div class="hero"><div class="hero-label" id="dp-label">맞는 단계</div><div class="hero-num"><span class="num" id="dp-step">—</span></div><div class="hero-sub" id="dp-sub">계산 중</div></div>
<div class="tiles"><div class="tile"><small>이 단계 상한까지</small><span class="num" id="dp-left">—</span></div><div class="tile"><small>다음 단계로</small><span class="num" id="dp-next">—</span></div><div class="tile"><small>하루 · 한 달 개수</small><span class="num" id="dp-count">—</span></div></div>
<div id="dp-tips"></div>`;

  const stepRows = DP.DIAPER_STEPS.map((s) => {
    const fm = firstMonth('m', s.key), ff = firstMonth('f', s.key);
    return { cells: [`<b>${s.label}</b>`, DP.stepRange(s), s.key === 1 ? '태어날 때' : mm(fm), s.key === 1 ? '태어날 때' : mm(ff)] };
  });
  const typRows = TYP_MONTHS.map((m) => { const b = at('m', m), g = at('f', m); return { cells: [mLabel(m), `${b.kg}kg`, stepText(b), `${g.kg}kg`, stepText(g)] }; });
  const countRows = DP.DIAPER_PER_DAY.map((r) => ({ cells: [r.label, `${r.day[0]}~${r.day[1]}개`, `${num(r.day[0] * 30)}~${num(r.day[1] * 30)}개`] }));

  const title = '기저귀 단계 몸무게표 — 신생아·1~6단계, 우리 아기 몇 단계? (개월별 예상·하루 개수)';
  const desc = `아기 몸무게를 넣으면 맞는 기저귀 단계와 다음 단계로 넘어갈 때를 알려 드립니다. 1단계 5kg까지, 2단계 4~8kg, 3단계 6~11kg, 4단계 8~14kg처럼 단계가 겹치는 구간에서 고르는 법, 개월별 보통 몸무게로 본 단계, 하루·한 달 기저귀 개수.`;
  const body = `
${crumb([['/baby/', '아기'], [null, '기저귀 단계']])}
<h1 class="title">기저귀 단계 몸무게표</h1>
<p class="meta">여러 브랜드 표기를 겹쳐 본 대략 범위 · 실제는 포장에 적힌 권장 체중이 기준 · 개월별 몸무게는 WHO 성장 표준(질병관리청 성장도표 0~35개월) 50백분위</p>
${tiles(DP.DIAPER_STEPS.slice(0, 3).map((s) => ({ label: s.label, value: DP.stepRange(s) })))}
${section('단계별 몸무게', 'kg · 단계끼리 겹치는 것이 정상 · 남아·여아 칸은 보통 몸무게(50백분위) 아기가 그 단계로 넘어가는 개월', table(['단계', '몸무게', '남아', '여아'], stepRows) + '<p class="sub">같은 4단계라도 브랜드에 따라 8~13kg, 9~14kg처럼 범위가 다르고, 이름도 \'대형\'·\'L\'처럼 다르게 붙습니다. 이 표는 고를 때 어림잡는 용도이고, 사기 전에는 포장의 권장 체중을 확인하세요.</p>')}
${lead(`기저귀는 개월이 아니라 <b>몸무게</b>로 고릅니다. 단계 범위가 서로 겹쳐서 ${ex.kg}kg이면 ${exR.fits.map((s) => s.short).join('·')}가 모두 맞는데, 이럴 때는 <b>지금 단계에서 새거나 자국이 남기 시작하면</b> 올리면 됩니다. 아래 계산기에 몸무게와 개월을 넣으면 같은 백분위로 자랄 때 언제쯤 다음 단계가 필요한지도 셈합니다. 생후 ${ex.m}개월 남아 ${ex.kg}kg이면 ${exO && exO.month ? `생후 약 ${Math.round(exO.month)}개월에 ${exO.step.short} 상한(${exO.step.hi}kg)에 닿습니다` : '이번 단계를 한동안 씁니다'}.`)}
${form}
${coupangBox ? coupangBox('/baby/diaper/', 1, '단계를 확인했다면 — 포장의 권장 체중을 보고 고르기') : ''}
${section('개월별 보통 몸무게와 단계', 'WHO 50백분위 · 범위가 겹치면 위 단계를 먼저 적고 아래 단계를 괄호에', table(['개월', '남아', '단계', '여아', '단계'], typRows))}
${ad()}
${section('하루에 몇 개, 한 달에 몇 개', '흔히 안내되는 어림값 · 한 달 = 30일', table(['시기', '하루', '한 달'], countRows) + '<p class="sub">신생아는 먹을 때마다 갈아 하루 10개를 넘기 쉽고, 크면서 소변을 모아 누어 줄어듭니다. 생후 1주가 지나 소변 기저귀가 하루 6개 이상이면 잘 먹고 있다는 신호입니다.</p>')}
${section('단계를 올릴 때', null, `<div class="doc">
<p><b>이런 신호가 보이면 한 단계 올립니다.</b> 허리·허벅지 밴드 자국이 빨갛게 남을 때, 흡수가 다 차기 전에 옆이나 등으로 샐 때, 테이프를 붙이면 배꼽 아래로 겨우 닿을 때, 아기가 답답해하며 자주 보챌 때입니다.</p>
<p><b>몸무게가 두 단계에 걸치면 작은 쪽부터.</b> 너무 큰 기저귀는 다리 사이가 떠서 오히려 잘 샙니다. 마르고 다리가 가는 아기는 아래 단계를, 허벅지가 통통한 아기는 위 단계를 더 오래 쓰기도 합니다.</p>
<p><b>상한에 가까우면 큰 묶음은 피하기.</b> 상한까지 1kg쯤 남았다면 한두 주 안에 바꿀 수 있어 소포장으로 사 두는 편이 낫습니다.</p>
<p><b>밴드형에서 팬티형으로.</b> 뒤집고 기기 시작하면(보통 6~8개월 무렵) 누워서 갈기 어려워 서서 입히는 팬티형이 편해집니다. 단계 기준은 팬티형도 몸무게입니다.</p>
<p><b>발진이 잦다면</b> 단계보다 가는 횟수와 통풍을 먼저 봅니다. 젖은 채로 오래 두지 않고, 빨갛게 헐거나 진물이 나면 소아청소년과에 보이세요.</p>
</div>`)}
${section('이어서', null, list([{ href: '/baby/percentile/', title: '아기 성장 백분위', sub: '몸무게가 또래 100명 중 몇 번째' }, { href: '/baby/formula/', title: '분유 수유량', sub: '개월·몸무게로 1회량과 하루 총량' }, { href: '/baby/', title: '아기 개월수·예방접종', sub: '생년월일로 오늘 몇 개월' }, { href: '/baby/month/', title: '개월별 발달', sub: '0~36개월' }]))}
${babyChain('/baby/diaper/')}
<p class="note">단계 범위는 국내에서 파는 여러 브랜드 제품의 권장 체중 표기를 겹쳐 본 대략값입니다(같은 단계도 브랜드마다 1~2kg 다름). 개월별 몸무게와 '넘어가는 때'·다음 단계 예측은 WHO 아동 성장 표준(2006, 질병관리청 2017 성장도표가 0~35개월에 채택) LMS로 계산했고, 아기가 지금 백분위를 유지한다고 가정한 어림입니다. 하루 개수는 흔히 안내되는 범위로 아기마다 다릅니다. <a href="/method/">계산 기준 보기</a></p>`;
  write('/baby/diaper/', shell({ url: '/baby/diaper/', og: 'baby', nav: 'baby', modified: MOD, title, desc, body, scripts: ['/js/engine.js', '/js/diaper.js'] }));
}
