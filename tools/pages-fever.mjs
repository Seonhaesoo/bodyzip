/* /fever-medicine/ 어린이 해열제 몸무게별 용량 — 아세트아미노펜·이부프로펜·덱시부프로펜 시럽
 * 용량은 engine/fever.mjs(식약처 의약품안전나라 허가 용법·용량) 한 곳에서. 교차 복용·응급 신호는 식약처 안내만 옮긴다.
 * 출처를 확인하지 못한 내용(다른 농도 제품, 좌약, 해열 기준 온도의 세부 차이 등)은 넣지 않는다. */
import * as FV from '../engine/fever.mjs';
import { num } from '../engine/fmt.mjs';

const MOD = '2026-11-16';
const NED = (seq) => `https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${seq}`;
/* 확인한 허가 정보 — 품목기준코드 */
export const FEVER_SOURCES = [
  { seq: '202200525', name: '어린이타이레놀현탁액', ing: '아세트아미노펜 3.2g/100mL' },
  { seq: '201206715', name: '챔프시럽', ing: '아세트아미노펜 3.2g/100mL' },
  { seq: '198601920', name: '어린이부루펜시럽', ing: '이부프로펜 2g/100mL' },
  { seq: '201604402', name: '챔프이부펜시럽', ing: '이부프로펜 2g/100mL' },
  { seq: '200608160', name: '맥시부펜시럽', ing: '덱시부프로펜 1.2g/100mL' },
];
export const FEVER_KG = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 25, 28, 30, 35, 40];

export function buildFever(ctx) {
  const { write, shell, crumb, list, section, table, lead, ad } = ctx;
  const SITE = 'https://bodyzip.com';
  const A = FV.FEVER_DRUGS.apap, I = FV.FEVER_DRUGS.ibu, X = FV.FEVER_DRUGS.dexi;
  const rng = (a) => a[0] === a[1] ? `${a[0]}` : `${a[0]}~${a[1]}`;
  const ex = FV.feverDose('apap', 10, 12), exD = FV.feverDose('dexi', 10, 12), exI = FV.feverDose('ibu', 10, 12);

  const ageOpts = FV.FEVER_AGES.map((a) => `<option value="${a.mo}"${a.key === 'y1' ? ' selected' : ''}>${a.label}</option>`).join('');
  const widget = `<form class="quick live" data-live="fever" style="margin-top:14px">
<div class="live-head"><b>몸무게와 나이만 넣으면</b><span>성분별 1회 용량 · 간격 · 하루 최대</span></div>
<div class="ye-grid">
<label class="ye-f"><span>아이 몸무게 (kg)</span><input data-k="kg" type="text" inputmode="decimal" placeholder="10" value="10"></label>
<label class="ye-f"><span>나이</span><select data-k="age">${ageOpts}</select></label>
</div>
<div class="tbl fever-tbl"><table><thead><tr><th>성분 · 농도</th><th>1회</th><th>간격</th><th>하루 최대</th></tr></thead><tbody data-out="rows"></tbody></table></div>
<p class="sub" data-out="msg" aria-live="polite"></p>
<p class="cal-how">입력값은 이 기기 안에서만 계산되며 어디에도 저장·전송되지 않습니다. mL는 라벨 상한을 넘지 않게 위쪽을 내림했습니다.</p>
</form>`;

  /* 몸무게별 표 — 엔진 값 그대로 (나이는 표 범위 안이라고 보고, 이부프로펜은 나이 표라 따로) */
  const kgRows = FEVER_KG.map((kg) => {
    const a = FV.feverDose('apap', kg, 24), d = FV.feverDose('dexi', kg, 24);
    return { cells: [`${kg}kg`, a.ok ? `${rng(a.ml)}mL<small>${rng(a.mg)}mg</small>` : '—', a.ok ? `${num(a.dayMg)}mg<small>${a.dayMl}mL</small>` : '—', d.ok ? `${rng(d.ml)}mL<small>${rng(d.mg)}mg</small>` : '—', d.ok ? `${num(d.dayMg)}mg<small>${d.dayMl}mL</small>` : '—'] };
  });
  const ibuRows = I.bands.map((b) => ({ cells: [b.label, `${b.lo}~${b.hi}mg<small>${b.lo / I.mgPerMl}~${b.hi / I.mgPerMl}mL</small>`, `${num(b.day)}mg<small>${b.day / I.mgPerMl}mL</small>`] }));
  const apapLabel = FV.APAP_LABEL.map((r) => ({ cells: [r.age, r.kg[1] > 900 ? `${r.kg[0]}kg 이상` : `${r.kg[0]}~${r.kg[1]}kg`, `${r.mg}mg`, `${r.ml}mL`] }));
  const dexiLabel = FV.DEXI_LABEL.map((r) => ({ cells: [r.age, r.kg[1] > 900 ? `${r.kg[0]}kg 이상` : `${r.kg[0]}~${r.kg[1]}kg`, `${r.ml}mL<small>${r.mg}mg</small>`, r.day] }));

  const overview = [
    { cells: ['아세트아미노펜', A.strength, `${A.perKg[0]}~${A.perKg[1]}mg/kg`, `${A.interval}`, `${A.maxDoses}번 · ${A.maxPerKgDay}mg/kg`, '생후 4개월', A.buy] },
    { cells: ['이부프로펜', I.strength, '나이별 표 (식약처 안내 5~10mg/kg)', I.interval, `${I.maxDoses}번 · 나이별 최대`, '생후 6개월 (설명서 표는 만 1세부터)', I.buy] },
    { cells: ['덱시부프로펜', X.strength, `${X.perKg[0]}~${X.perKg[1]}mg/kg`, `${X.interval} <small>설명서 4~6시간</small>`, `${X.maxDoses}번 · ${X.maxPerKgDay}mg/kg`, '생후 6개월', X.buy] },
  ];

  const EMERGENCY = `<div class="doc"><ul>
<li><b>생후 3개월 미만인데 38℃ 이상</b> — 해열제보다 진료가 먼저입니다. 바로 병원으로.</li>
<li><b>39℃ 이상으로 열이 나고 아이가 많이 힘들어할 때</b></li>
<li><b>40.5℃ 이상</b>으로 열이 날 때</li>
<li><b>열성 경련</b>을 하는 아이</li>
<li>심장병·영양부족·수술 뒤처럼 <b>열이 그 자체로 해가 되는</b> 아이</li>
<li>약을 먹은 뒤 <b>숨이 차거나, 온몸이 붉어지거나, 얼굴·입술이 붓거나, 두드러기</b>가 날 때 — 약을 끊고 바로 진료(설명서의 쇽·과민반응 증상)</li>
<li><b>정해진 양보다 많이 먹였을 때</b> — 아세트아미노펜은 아무 증상이 없어도 바로 병원에 가야 합니다(설명서: 10~12시간 안에 간 보호 치료).</li>
<li>해열제를 <b>3일 넘게</b> 먹여야 할 만큼 열이 이어지거나, 나빠지거나, 새 증상이 생길 때 — 설명서는 의사·약사 지시 없이 발열에 3일 이상 먹이지 말라고 적고 있습니다.</li>
</ul><p>위급해 보이면 망설이지 말고 119에 전화하세요.</p></div>`;

  const CROSS = `<div class="doc">
<p><b>한 번에 한 가지</b>만 먹입니다. 두 성분을 같이 먹이지 않습니다.</p>
<p>먹이고 <b>2~3시간이 지나도 고열이 계속</b>되면 다른 계열의 해열제를 쓸 수 있는데, 식약처는 이때 <b>의사의 처방에 따라 복용 간격을 지켜</b> 쓰라고 안내합니다. 계열은 둘입니다: <b>① 아세트아미노펜</b>, <b>② 이부프로펜·덱시부프로펜</b>.</p>
<p><b>이부프로펜과 덱시부프로펜은 같은 계열이라 번갈아 먹이지 않습니다.</b> 이부프로펜을 먹였다면 다음 번갈아 먹일 약은 아세트아미노펜뿐입니다.</p>
<p>번갈아 먹이더라도 <b>각 약의 간격과 하루 최대 횟수는 따로 지켜야</b> 합니다. 예를 들어 아세트아미노펜은 다음 아세트아미노펜까지 4시간 이상, 하루 5번까지입니다. 시간과 양을 종이나 휴대폰에 적어 두면 겹치지 않습니다.</p>
<p>병원에서 받은 감기약·종합감기약에 <b>해열 성분이 이미 들어 있을 수</b> 있습니다. 처방약과 함께 먹일 때는 의사·약사에게 해열제 성분이 있는지 꼭 확인하세요.</p>
</div>`;

  const qa = [
    ['몇 도부터 해열제를 먹이나요?', '식약처는 아이의 평소 체온보다 1℃ 이상 높거나 38℃ 이상이면 열이 있다고 보고 해열제를 고려하라고 안내합니다. 몇 도가 되면 꼭 먹여야 한다는 정해진 온도는 없고, 열 때문에 아이가 힘들어할 때 편하게 해 주려고 먹이는 약입니다.'],
    ['몸무게와 나이 중 무엇으로 정하나요?', '아세트아미노펜과 덱시부프로펜 설명서는 "몸무게를 아는 경우 몸무게에 따른 용량이 더 적절하다"고 적고 있습니다. 이부프로펜 설명서는 나이별 표만 있어서, 이 계산기는 식약처가 안내한 1회 5~10mg/kg으로 셈한 양 가운데 나이 표 범위 안에 드는 양만 보여 줍니다.'],
    ['몇 개월부터 먹일 수 있나요?', '아세트아미노펜은 생후 4개월부터(설명서 표가 4개월·7kg부터), 이부프로펜·덱시부프로펜은 생후 6개월부터입니다. 다만 이부프로펜 시럽 설명서의 나이별 용량표는 만 1세부터라 그 아래는 의사·약사가 정한 양을 따르세요. 아세트아미노펜·이부프로펜 설명서는 만 2세 미만이면 먹이기 전에 의사·약사와 상의하도록 적고 있습니다.'],
    ['먹였는데 열이 안 떨어지면 또 먹여도 되나요?', `같은 약은 정해진 간격(아세트아미노펜 ${A.interval}, 이부프로펜·덱시부프로펜 ${I.interval}) 안에 다시 먹이지 않습니다. 2~3시간이 지나도 고열이면 다른 계열 약을 쓸 수 있지만 의사의 처방에 따르라는 것이 식약처 안내입니다.`],
    ['이부프로펜과 덱시부프로펜을 번갈아 먹여도 되나요?', '안 됩니다. 같은 계열이라 식약처가 교차 복용하지 말라고 안내합니다. 번갈아 먹일 수 있는 짝은 아세트아미노펜과 이부프로펜(또는 덱시부프로펜)입니다.'],
    ['병마다 농도가 달라요.', `같은 성분이라도 농도가 다른 제품이 있을 수 있습니다. 이 페이지의 mL는 아세트아미노펜 ${A.mgPerMl}mg/mL, 이부프로펜 ${I.mgPerMl}mg/mL, 덱시부프로펜 ${X.mgPerMl}mg/mL 시럽 기준입니다. 병에 적힌 함량("100mL 중 3.2g" 같은 표기)이 다르면 mL 값을 쓰지 말고 mg으로 설명서와 맞춰 보세요.`],
    ['하루에 몇 번까지 먹일 수 있나요?', `아세트아미노펜은 하루 5번(하루 75mg/kg)까지, 이부프로펜·덱시부프로펜은 하루 4번까지입니다. 아세트아미노펜은 어떤 경우에도 하루 4,000mg을 넘기면 안 되고, 아세트아미노펜이 든 다른 약과 함께 먹이지 않습니다.`],
  ];
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) };
  const title = '어린이 해열제 몸무게별 용량 — 아세트아미노펜·이부프로펜·덱시부프로펜 시럽 mL·간격·교차복용';
  const desc = `아이 몸무게와 나이를 넣으면 아세트아미노펜(${A.mgPerMl}mg/mL)·이부프로펜(${I.mgPerMl}mg/mL)·덱시부프로펜(${X.mgPerMl}mg/mL) 시럽의 1회 mg·mL, 간격, 하루 최대량이 나옵니다. 식약처 허가 용법 기준, 10kg이면 아세트아미노펜 ${rng(ex.ml)}mL. 번갈아 먹이는 법과 병원에 가야 할 신호까지.`;
  const pageLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description: desc, url: SITE + '/fever-medicine/', inLanguage: 'ko', datePublished: MOD, dateModified: MOD, isPartOf: { '@type': 'WebSite', name: '바디집', url: SITE } };

  const body = `
${crumb([['/', '홈'], ['/baby/', '아기'], [null, '어린이 해열제 용량']])}
<h1 class="title">어린이 해열제, 몸무게로 몇 mL</h1>
<p class="meta">아세트아미노펜 · 이부프로펜 · 덱시부프로펜 시럽 · 식약처 의약품안전나라 허가 용법·용량 기준 · 제품 설명서가 우선</p>
${widget}
<div class="callout"><b>먹이기 전에</b> — 이 표는 설명서 용량을 몸무게로 옮긴 참고값입니다. <b>가지고 있는 제품 설명서의 용량이 우선</b>이고, 병에 적힌 농도가 다르면 mL가 달라집니다. 생후 4개월 미만(아세트아미노펜)·6개월 미만(이부프로펜·덱시부프로펜)이거나, 처방받은 약을 먹고 있거나, 만성질환이 있으면 먼저 의사·약사와 상담하세요. <b>생후 3개월 미만이 38℃ 이상이면 해열제보다 병원이 먼저</b>입니다.</div>
${lead(`해열제 양은 아이 <b>몸무게</b>로 정하는 것이 가장 정확합니다. 아세트아미노펜은 1회 몸무게 1kg당 ${A.perKg[0]}~${A.perKg[1]}mg을 ${A.interval}마다(하루 ${A.maxDoses}번까지), 덱시부프로펜은 1kg당 ${X.perKg[0]}~${X.perKg[1]}mg(하루 ${X.maxDoses}번까지)이고, 이부프로펜은 설명서에 나이별 양이 정해져 있습니다. 10kg 아이라면 아세트아미노펜 ${rng(ex.mg)}mg, 흔한 ${A.mgPerMl}mg/mL 시럽으로 <b>${rng(ex.ml)}mL</b>입니다.`)}
${section('성분별 한눈에', '시럽 기준 · 식약처 허가 용법과 2025년 식약처 소아 해열제 안내', `<div class="tbl"><table><thead><tr><th>성분</th><th>흔한 농도</th><th>1회</th><th>간격</th><th>하루 최대</th><th>먹일 수 있는 나이</th><th>살 수 있는 곳</th></tr></thead><tbody>${overview.map((r) => `<tr>${r.cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)}
${section('계산 예시 — 10kg, 만 1세', '몸무게 × 1kg당 양 ÷ 농도', `<div class="doc">
<p><b>아세트아미노펜</b>: 10kg × ${A.perKg[0]}~${A.perKg[1]}mg = ${rng(ex.mg)}mg → ÷ ${A.mgPerMl}mg/mL = <b>${rng(ex.ml)}mL</b>, ${A.interval}마다, 하루 최대 ${num(ex.dayMg)}mg(${ex.dayMl}mL). 설명서 표로는 8~11.9kg 칸이 3.5mL(120mg)입니다.</p>
<p><b>이부프로펜</b>: 설명서 1~2세 칸 1회 50~100mg → ÷ ${I.mgPerMl}mg/mL = <b>${rng(exI.ml)}mL</b>, 하루 최대 ${num(exI.dayMg)}mg(${exI.dayMl}mL).</p>
<p><b>덱시부프로펜</b>: 10kg × ${X.perKg[0]}~${X.perKg[1]}mg = ${rng(exD.mg)}mg → ÷ ${X.mgPerMl}mg/mL = <b>${rng(exD.ml)}mL</b>, 하루 최대 ${num(exD.dayMg)}mg(${exD.dayMl}mL).</p>
<p>mL는 위쪽을 내림해 설명서 상한을 넘지 않게 했습니다. 계량은 제품에 들어 있는 계량 도구로 하세요.</p></div>`)}
${section('몸무게별 표', `아세트아미노펜 ${A.mgPerMl}mg/mL · 덱시부프로펜 ${X.mgPerMl}mg/mL · 먹일 수 있는 나이(4개월·6개월 이상, 만 12세 이하)일 때`, table(['몸무게', '아세트아미노펜 1회', '하루 최대', '덱시부프로펜 1회', '하루 최대'], kgRows))}
${ad()}
${section('이부프로펜은 나이별', `설명서 표 · ${I.mgPerMl}mg/mL · 하루 3~4번`, table(['나이', '1회', '하루 최대'], ibuRows) + `<p class="sub" style="margin-top:8px">이부프로펜 시럽 설명서는 몸무게가 아니라 나이로 양을 정합니다. 위 계산기는 식약처 안내(1회 5~10mg/kg)로 셈한 양 가운데 이 표 범위 안의 양만 보여 주고, 둘이 겹치지 않으면(또래보다 몸무게가 많이 다를 때) 약사·의사에게 물어보라고 안내합니다. 표가 만 1세부터라 생후 6~11개월은 의사·약사가 정한 양을 따르세요.</p>`)}
${section('번갈아 먹이기 (교차 복용)', '식약처 안내', CROSS)}
${section('이럴 때는 바로 병원', '해열제보다 먼저', EMERGENCY)}
${section('설명서 표 그대로', '아세트아미노펜 32mg/mL 시럽 · 4~6시간마다 · 하루 5번(75mg/kg)까지', table(['나이', '몸무게', '1회 (mg)', '1회 (mL)'], apapLabel))}
${section('덱시부프로펜 설명서 표', '12mg/mL 시럽 · 생후 6개월 이상 · 하루 최대 4번(28mg/kg)', table(['나이', '몸무게', '1회', '하루 최대'], dexiLabel))}
${section('자주 묻는 것', null, `<div class="doc">${qa.map(([q, a]) => `<p><b>${q}</b> ${a}</p>`).join('')}</div>`)}
${section('이어서', null, list([
  { href: '/baby/temperature/', title: '아기 정상 체온 · 열 기준', sub: '겨드랑이·귀·항문 체온 · 열 몇 도부터 병원' },
  { href: '/flu/', title: '2026-2027 독감 예방접종', sub: '생후 6개월~14세 무료 · 생년월일로 시작일' },
  { href: '/baby/', title: '아기 개월수 · 예방접종', sub: '생일만 넣으면 오늘 몇 개월 · 접종 날짜' },
  { href: '/baby/percentile/', title: '아기 성장 백분위', sub: '몸무게가 또래 100명 중 몇 번째' },
  { href: '/baby/formula/', title: '분유 수유량', sub: '개월·몸무게로 1회량과 하루 총량' },
]))}
<p class="note">출처: 식품의약품안전처 의약품안전나라 허가 정보(용법·용량, 사용상의 주의사항 — ${FEVER_SOURCES.map((s) => `<a href="${NED(s.seq)}" rel="nofollow">${s.name}</a>(${s.ing})`).join(', ')}, 2026년 11월 16일 확인), 식약처 컨슈머 뉴스레터 Issue.2 「어린이 해열제 복용 방법은?」(<a href="https://www.mfds.go.kr/brd/m_61/view.do?seq=54388" rel="nofollow">2026.1.9</a>), 식품의약품안전평가원 소아 해열제 사용 안내(2025.12), 식약처 「아이들을 위한 해열소염진통제, 안전하게 사용하기」(<a href="https://www.korea.kr/multi/visualNewsView.do?newsId=148922737" rel="nofollow">2023.11.17</a>). 제품명은 허가 정보를 확인한 예시일 뿐 특정 제품을 권하지 않습니다. 이 페이지는 진료를 대신하지 않으며, 아이 상태에 따른 판단은 의사·약사가 합니다. <a href="/method/">계산 기준 보기</a></p>`;
  write('/fever-medicine/', shell({ url: '/fever-medicine/', og: 'baby', nav: 'baby', modified: MOD, title, desc, body, scripts: ['/js/engine.js', '/js/live.js'], ld: [pageLd, faqLd] }));
}
