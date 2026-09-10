/* 건강검진 수치 해석 — 혈압·공복혈당·콜레스테롤·LDL·HDL·중성지방·간수치·요산 + 종합 해석기 */
import * as C from '../engine/checkup.mjs';
import { num } from '../engine/fmt.mjs';

const range = (a, b, s) => { const o = []; for (let v = a; v <= b + 1e-9; v += s) o.push(Math.round(v * 10) / 10); return o; };
export const SYS = range(90, 180, 5);
export const DIA = range(50, 120, 5);
export const GLU = range(70, 200, 2);
export const TC = range(120, 320, 5);
export const LDL = range(50, 250, 5);
export const HDL = range(20, 100, 2);
export const TG = range(40, 600, 10);
export const ALT = range(5, 400, 5);
export const URIC = range(2, 12, 0.2);

const NOTE_MED = '검진 수치는 한 번의 결과만으로 진단하지 않습니다. 재검·문진·다른 검사를 함께 보고 의사가 판단합니다. 이 페이지는 공개된 학회 기준을 정리한 참고 자료이며 진료를 대신하지 않습니다. 증상이 있거나 결과가 걱정되면 의료기관에서 상담하세요.';

export function buildCheckup(ctx) {
  const { write, shell, crumb, tiles, list, section, table, lead, ad, hero } = ctx;
  const chips = (items) => `<div class="chips" style="flex-wrap:wrap;overflow:visible">${items.map((c) => c.on ? `<span class="chip on" style="min-width:0;padding:4px 9px">${c.label}</span>` : `<a class="chip" style="min-width:0;padding:4px 9px" href="${c.href}">${c.label}</a>`).join('')}</div>`;
  const near = (arr, v, k = 4) => { const i = arr.indexOf(v); return arr.slice(Math.max(0, i - k), i + k + 1); };
  const NOTE = (s) => `<p class="note">${s} ${NOTE_MED} <a href="/method/">계산 기준 보기</a></p>`;

  /* ---------- 종합 해석기 ---------- */
  const form = `<form class="quick live" data-live="checkup" style="margin-top:14px">
<div class="live-head"><b>검진 결과지 그대로 넣기</b><span>아는 것만 넣어도 됩니다</span></div>
<div class="ye-grid">
<label class="ye-f"><span>성별</span><select data-k="sex"><option value="m">남</option><option value="f">여</option></select></label>
<label class="ye-f"><span>수축기 혈압</span><input data-k="sys" type="text" inputmode="numeric" placeholder="120"></label>
<label class="ye-f"><span>이완기 혈압</span><input data-k="dia" type="text" inputmode="numeric" placeholder="80"></label>
<label class="ye-f"><span>공복혈당</span><input data-k="glucose" type="text" inputmode="numeric" placeholder="95"></label>
<label class="ye-f"><span>당화혈색소 (%)</span><input data-k="hba1c" type="text" inputmode="decimal" placeholder="5.5"></label>
<label class="ye-f"><span>총콜레스테롤</span><input data-k="total" type="text" inputmode="numeric" placeholder="190"></label>
<label class="ye-f"><span>HDL</span><input data-k="hdl" type="text" inputmode="numeric" placeholder="55"></label>
<label class="ye-f"><span>LDL</span><input data-k="ldl" type="text" inputmode="numeric" placeholder="110"></label>
<label class="ye-f"><span>중성지방</span><input data-k="tg" type="text" inputmode="numeric" placeholder="130"></label>
<label class="ye-f"><span>AST</span><input data-k="ast" type="text" inputmode="numeric" placeholder="25"></label>
<label class="ye-f"><span>ALT</span><input data-k="alt" type="text" inputmode="numeric" placeholder="22"></label>
<label class="ye-f"><span>감마지티피</span><input data-k="ggt" type="text" inputmode="numeric" placeholder="30"></label>
<label class="ye-f"><span>요산</span><input data-k="uric" type="text" inputmode="decimal" placeholder="5.5"></label>
</div>
<p class="sub" style="margin-top:10px" data-out="summary"></p>
<div class="tbl"><table><thead><tr><th>항목</th><th>내 수치</th><th>판정</th></tr></thead><tbody data-out="rows"></tbody></table></div>
<p class="cal-how">입력값은 이 기기 안에서만 계산되며 어디에도 저장·전송되지 않습니다.</p>
</form>`;
  write('/checkup/', shell({ url: '/checkup/', og: 'checkup', title: '건강검진 결과 해석 — 혈압·혈당·콜레스테롤·간수치 한 번에 보기', desc: '건강검진 결과지의 혈압, 공복혈당, 당화혈색소, 총콜레스테롤·HDL·LDL·중성지방, AST·ALT·감마지티피, 요산 수치를 넣으면 학회 기준으로 정상·경계·이상을 판정해 드립니다.', nav: 'checkup', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/', '홈'], [null, '건강검진 해석']])}
<h1 class="title">건강검진 결과 해석</h1>
<p class="meta">혈압 · 혈당 · 콜레스테롤 · 간수치 · 요산 · 대한고혈압학회·대한당뇨병학회·한국지질동맥경화학회 기준</p>
${form}
${lead('검진 결과지에는 숫자와 참고치만 적혀 있어 "그래서 어떤 상태인가"를 알기 어렵습니다. 수치를 넣으면 학회 기준으로 어느 구간인지, 무엇을 하면 되는지 한 줄씩 적어 드립니다. 항목별로 자세히 보려면 아래에서 수치를 누르세요.')}
${section('항목별로 자세히', null, list([
  { href: '/bp/120-80/', title: '혈압', sub: '정상 120/80 미만 · 고혈압 140/90 이상' },
  { href: '/glucose/100/', title: '공복혈당', sub: '정상 100 미만 · 당뇨 126 이상' },
  { href: '/checkup/', title: '당화혈색소 (HbA1c)', sub: '정상 5.7% 미만 · 당뇨 6.5% 이상 — 위 해석기에서' },
  { href: '/cholesterol/200/', title: '총콜레스테롤', sub: '적정 200 미만' },
  { href: '/ldl/130/', title: 'LDL 콜레스테롤', sub: '적정 100 미만' },
  { href: '/hdl/50/', title: 'HDL 콜레스테롤', sub: '40 미만이면 위험' },
  { href: '/triglyceride/150/', title: '중성지방', sub: '적정 150 미만' },
  { href: '/liver/40/', title: '간수치 AST·ALT', sub: '정상 40 이하' },
  { href: '/uric/7/', title: '요산', sub: '남 7.0 · 여 6.0 초과면 고요산혈증' },
]))}
${ad()}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>한 번의 수치로 진단하지 않습니다.</b> 혈압은 다른 날 두 번 이상, 혈당은 두 번 이상 기준을 넘어야 진단합니다. 검사 전날 음주·과식·수면 부족은 간수치와 중성지방을 크게 올립니다.</p>
<p><b>공복 8시간을 지켰는지 확인하세요.</b> 공복혈당과 중성지방은 공복이 깨지면 의미가 없습니다. 물은 마셔도 됩니다.</p>
<p><b>경계 구간이 가장 중요합니다.</b> 정상과 질병 사이의 구간(고혈압 전단계, 공복혈당장애, 경계 콜레스테롤)은 생활습관으로 되돌릴 수 있는 마지막 시기입니다.</p>
</div>`)}
${section('이어서', null, list([{ href: '/bmi/', title: 'BMI · 정상 체중', sub: '검진의 시작' }, { href: '/bmr/', title: '기초대사량 · 하루 칼로리', sub: '식사량 기준' }, { href: '/quit-smoking/', title: '금연 계산기', sub: '수치를 되돌리는 가장 빠른 길' }]))}
${NOTE('')}` }));

  /* ---------- 혈압 ---------- */
  const bpUrl = (s, d) => `/bp/${s}-${d}/`;
  const bpOk = (s, d) => d < s - 20;                 /* 만들어 둔 조합인지 */
  for (const s of SYS) for (const d of DIA) {
    if (d >= s - 20) continue;                       /* 맥압 20 미만·역전 조합은 만들지 않는다 */
    const r = C.bloodPressure(s, d);
    const title = `혈압 ${s}/${d} — ${r.label}${r.key === 'crisis' ? ' (즉시 진료)' : r.high ? ' (진료 필요 구간)' : ''}, 어떻게 봐야 할까`;
    const desc = `수축기 ${s}mmHg, 이완기 ${d}mmHg는 대한고혈압학회 기준으로 ${r.label}입니다. ${r.note} 맥압 ${r.pulse}mmHg.`;
    write(bpUrl(s, d), shell({ url: bpUrl(s, d), og: 'checkup', title, desc, nav: 'checkup', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/checkup/', '건강검진 해석'], ['/bp/', '혈압'], [null, `${s}/${d}`]])}
<h1 class="title">혈압 ${s}/${d}</h1>
<p class="meta">대한고혈압학회 2022 기준 · 안정 상태에서 5분 쉰 뒤 잰 값</p>
${hero({ label: '판정', value: r.label, unit: '', sub: `수축기 ${s} · 이완기 ${d} · 맥압 ${r.pulse}mmHg${r.isolated ? ' · 수축기 단독 고혈압' : ''}` })}
${lead(`수축기 ${s}mmHg, 이완기 ${d}mmHg는 <b>${r.label}</b>입니다. ${r.note}${r.isolated ? ' 이완기는 정상인데 수축기만 높은 수축기 단독 고혈압으로, 나이가 들며 혈관이 굳으면 흔히 나타납니다.' : ''}`)}
<form class="quick live" data-live="bp" style="margin-top:14px"><div class="live-head"><b>다시 재 보기</b><span>두 번 이상 재고 평균을 봅니다</span></div><div class="ye-grid"><label class="ye-f"><span>수축기</span><input data-k="sys" type="text" inputmode="numeric" value="${s}"></label><label class="ye-f"><span>이완기</span><input data-k="dia" type="text" inputmode="numeric" value="${d}"></label></div><div class="tiles"><div class="tile"><small>판정</small><span class="num" data-out="label"></span></div><div class="tile"><small>맥압</small><span class="num" data-out="pulse"></span></div><div class="tile"><small>이럴 땐</small><span class="num" data-out="note"></span></div></div><div class="live-foot"><a data-out="link" href="/bp/120-80/">이 수치 페이지 →</a></div></form>
${section('혈압 구간표', '대한고혈압학회 2022', table(['구간', '수축기', '', '이완기'], [
  { cells: ['정상혈압', '120 미만', '그리고', '80 미만'], cls: r.key === 'normal' ? 'on' : '' },
  { cells: ['주의혈압', '120~129', '그리고', '80 미만'], cls: r.key === 'attention' ? 'on' : '' },
  { cells: ['고혈압 전단계', '130~139', '또는', '80~89'], cls: r.key === 'pre' ? 'on' : '' },
  { cells: ['고혈압 1기', '140~159', '또는', '90~99'], cls: r.key === 'stage1' ? 'on' : '' },
  { cells: ['고혈압 2기', '160~179', '또는', '100~119'], cls: r.key === 'stage2' ? 'on' : '' },
  { cells: ['고혈압 위기', '180 이상', '또는', '120 이상'], cls: r.key === 'crisis' ? 'on' : '' },
]))}
${ad()}
${section('수축기가 다르면', `이완기 ${d} 고정`, chips(near(SYS, s).filter((x) => bpOk(x, d)).map((x) => ({ label: `${x}/${d}`, href: bpUrl(x, d), on: x === s }))))}
${section('이완기가 다르면', `수축기 ${s} 고정`, chips(near(DIA, d).filter((x) => bpOk(s, x)).map((x) => ({ label: `${s}/${x}`, href: bpUrl(s, x), on: x === d }))))}
${section('알아두면 좋은 것', null, r.key === 'crisis' || r.key === 'stage2' ? `<div class="doc">
<p><b>먼저 다시 재세요.</b> 5분 앉아 쉰 뒤 팔을 심장 높이에 두고 1~2분 간격으로 두 번 잽니다. 잘못 잰 값일 수 있습니다.</p>
<p><b>다시 재도 같으면 진료를 미루지 마세요.</b> ${r.key === 'crisis' ? '증상이 없어도 오늘 안에 진료가 필요한 수치입니다.' : '가까운 날에 내과 진료를 받으세요.'}</p>
<p><b>이런 증상이 함께 있으면 재지 말고 119</b> — 가슴 통증, 호흡곤란, 심한 두통, 시야가 흐려짐, 말이 어눌해짐, 한쪽 팔다리 마비.</p>
<p><b>자가측정은 진료를 받은 뒤에.</b> 이 구간에서는 일주일 자가측정으로 지켜보기보다 먼저 원인을 확인하는 것이 안전합니다.</p>
</div>` : `<div class="doc">
<p><b>재는 법이 결과를 바꿉니다.</b> 5분 앉아 쉰 뒤, 팔을 심장 높이에 두고, 커피·담배·운동 30분 뒤에 잽니다. 1~2분 간격으로 두 번 재서 평균을 씁니다.</p>
<p><b>병원에서만 높다면</b> 백의 고혈압일 수 있습니다. <a href="/bp/log/">집에서 아침·저녁으로 일주일 재 보세요</a>. 가정혈압은 135/85 이상이면 고혈압으로 봅니다.</p>
<p><b>소금과 체중이 가장 크게 움직입니다.</b> 하루 소금 5g 줄이면 수축기가 약 5mmHg, 체중 1kg 줄이면 약 1mmHg 내려갑니다.</p>
</div>`)}
${section('이어서', null, list([{ href: '/bp/log/', title: '혈압 기록', sub: '집에서 아침·저녁으로 재서 7일 평균' }, { href: '/checkup/', title: '검진 결과 전체 해석', sub: '혈당·콜레스테롤까지 한 번에' }, { href: '/bmi/', title: 'BMI · 정상 체중', sub: '체중이 혈압을 좌우합니다' }, { href: '/steps/', title: '걸음 수 칼로리', sub: '유산소가 가장 잘 듣습니다' }]))}
${NOTE('가정혈압은 135/85, 진료실 혈압은 140/90이 고혈압 기준입니다.')}` }));
  }
  write('/bp/', shell({ url: '/bp/', og: 'checkup', title: '혈압 정상 수치표 — 수축기·이완기별 판정 (고혈압 전단계·1기·2기)', desc: '수축기 90~180, 이완기 50~120 조합별 혈압 판정표. 대한고혈압학회 2022 기준으로 정상·주의·고혈압 전단계·1기·2기를 알려 드립니다.', nav: 'checkup', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/checkup/', '건강검진 해석'], [null, '혈압']])}
<h1 class="title">혈압 정상 수치</h1>
<p class="meta">정상 120/80 미만 · 고혈압 전단계 130/80 · 고혈압 140/90 이상</p>
<form class="quick live" data-live="bp" style="margin-top:14px"><div class="live-head"><b>내 혈압</b><span>바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>수축기</span><input data-k="sys" type="text" inputmode="numeric" value="120"></label><label class="ye-f"><span>이완기</span><input data-k="dia" type="text" inputmode="numeric" value="80"></label></div><div class="tiles"><div class="tile"><small>판정</small><span class="num" data-out="label"></span></div><div class="tile"><small>맥압</small><span class="num" data-out="pulse"></span></div><div class="tile"><small>이럴 땐</small><span class="num" data-out="note"></span></div></div><div class="live-foot"><a data-out="link" href="/bp/120-80/">이 수치 자세히 →</a></div></form>
${lead('혈압은 수축기(위)와 이완기(아래) 둘 다 봅니다. 둘 중 하나라도 높은 구간에 들면 그 구간으로 판정합니다. 아래 표에서 내 수치를 누르면 자세한 설명이 나옵니다.')}
${section('많이 찾는 수치', null, chips([[110, 70], [120, 80], [130, 80], [130, 85], [140, 90], [145, 95], [150, 90], [160, 100], [180, 120]].filter(([a, b]) => bpOk(a, b)).map(([a, b]) => ({ label: `${a}/${b}`, href: bpUrl(a, b) }))))}
${section('수축기별 (이완기 80 기준)', null, chips(SYS.filter((x) => bpOk(x, 80)).map((x) => ({ label: `${x}`, href: bpUrl(x, 80) }))))}
${ad()}
${section('이어서', null, list([{ href: '/bp/log/', title: '혈압 기록', sub: '집에서 잰 혈압 7일 평균 · 기기에만 저장' }, { href: '/checkup/', title: '검진 결과 전체 해석', sub: '' }, { href: '/glucose/100/', title: '공복혈당', sub: '' }]))}
${NOTE('가정혈압은 135/85, 진료실 혈압은 140/90이 고혈압 기준입니다.')}` }));

  /* ---------- 값 하나짜리 항목들 ---------- */
  const single = [
    { key: 'glucose', dir: '/glucose/', name: '공복혈당', unit: 'mg/dL', arr: GLU, fn: C.glucose, live: 'glucose',
      meta: '대한당뇨병학회 2023 · 8시간 공복 후 정맥혈',
      action: '낮추는 방법',
      table: [['저혈당 의심', '70 미만', ['low']], ['정상', '70~99', ['normal']], ['공복혈당장애 (당뇨 전단계)', '100~125', ['pre']], ['당뇨병 의심', '126 이상 (두 번 확인)', ['dm']]],
      tips: `<p><b>당화혈색소를 함께 보세요.</b> 공복혈당은 그날 상태에 따라 흔들리지만 당화혈색소(HbA1c)는 2~3개월 평균이라 더 안정적입니다. 5.7% 미만이 정상입니다.</p>
<p><b>전단계는 되돌릴 수 있습니다.</b> 체중을 5~7% 줄이고 주 150분 걸으면 당뇨로 넘어갈 확률이 절반 이하로 떨어진다는 것이 대규모 연구의 결론입니다.</p>
<p><b>검사 전날 저녁이 중요합니다.</b> 늦은 야식과 음주는 다음 날 공복혈당을 10~20mg/dL 정도 올릴 수 있습니다.</p>`,
      links: [{ href: '/checkup/', title: '검진 결과 전체 해석', sub: '' }, { href: '/food/', title: '음식 칼로리 사전', sub: '탄수화물 줄이기' }, { href: '/steps/', title: '걸음 수 칼로리', sub: '식후 15분 걷기' }] },
    { key: 'cholesterol', dir: '/cholesterol/', name: '총콜레스테롤', unit: 'mg/dL', arr: TC, fn: C.totalChol, live: 'chol',
      meta: '한국지질동맥경화학회 2022 · 9~12시간 공복',
      action: '낮추는 방법',
      table: [['적정', '200 미만', ['ok']], ['경계', '200~239', ['border']], ['높음', '240 이상', ['high']]],
      tips: `<p><b>총콜레스테롤만으로 판단하지 않습니다.</b> LDL이 높은지, HDL이 낮은지, 중성지방이 높은지에 따라 대처가 다릅니다. 셋을 같이 보세요.</p>
<p><b>음식보다 체중과 운동이 큽니다.</b> 콜레스테롤의 70~80%는 몸에서 만들어집니다. 포화지방(삼겹살·버터·튀김)을 줄이는 것이 달걀을 피하는 것보다 효과적입니다.</p>`,
      links: [{ href: '/ldl/130/', title: 'LDL 콜레스테롤', sub: '진짜 봐야 할 수치' }, { href: '/triglyceride/150/', title: '중성지방', sub: '' }, { href: '/checkup/', title: '검진 결과 전체 해석', sub: '' }] },
    { key: 'ldl', dir: '/ldl/', name: 'LDL 콜레스테롤', unit: 'mg/dL', arr: LDL, fn: C.ldl, live: 'ldl',
      meta: '한국지질동맥경화학회 2022 · 나쁜 콜레스테롤',
      action: '낮추는 방법',
      table: [['적정', '100 미만', ['ok']], ['정상', '100~129', ['near']], ['경계', '130~159', ['border']], ['높음', '160~189', ['high']], ['매우 높음', '190 이상', ['veryhigh']]],
      tips: `<p><b>목표치는 사람마다 다릅니다.</b> 한국지질동맥경화학회 2022 기준으로 심근경색·협심증·뇌경색 병력이 있으면 55 미만, 당뇨병이 있으면 70 미만, 위험 요인이 여럿이면 100 미만을 목표로 잡습니다. 건강한 사람은 130 미만이면 대체로 괜찮습니다. 내 목표치는 의사가 위험도를 계산해 정합니다.</p>
<p><b>포화지방과 트랜스지방을 줄이면 내려갑니다.</b> 튀김·가공육·버터·과자를 줄이고 통곡물·견과류·등푸른생선을 늘리세요.</p>`,
      links: [{ href: '/cholesterol/200/', title: '총콜레스테롤', sub: '' }, { href: '/hdl/50/', title: 'HDL', sub: '좋은 콜레스테롤' }, { href: '/checkup/', title: '검진 결과 전체 해석', sub: '' }] },
    { key: 'hdl', dir: '/hdl/', name: 'HDL 콜레스테롤', unit: 'mg/dL', arr: HDL, fn: C.hdl, live: 'hdl',
      meta: '한국지질동맥경화학회 2022 · 좋은 콜레스테롤',
      action: '올리는 방법',
      table: [['낮음 (위험)', '40 미만', ['low']], ['보통', '40~59', ['ok']], ['높음 (좋음)', '60 이상', ['good']]],
      tips: `<p><b>HDL은 낮은 것이 문제입니다.</b> 혈관에 쌓인 콜레스테롤을 간으로 실어 나르는 역할을 하며, 40 미만이면 다른 수치가 정상이어도 위험이 올라갑니다. 다만 60을 크게 넘는다고 그만큼 더 좋다는 근거는 없습니다.</p>
<p><b>가장 잘 듣는 것은 유산소 운동과 금연입니다.</b> 주 3회 30분 이상 빠르게 걷기, 금연 후 몇 주 안에 오르기 시작합니다. 과도한 정제 탄수화물은 HDL을 낮춥니다.</p>`,
      links: [{ href: '/ldl/130/', title: 'LDL', sub: '' }, { href: '/exercise/', title: '운동 소모 칼로리', sub: '유산소가 가장 잘 듣습니다' }, { href: '/quit-smoking/', title: '금연 계산기', sub: '' }] },
    { key: 'tg', dir: '/triglyceride/', name: '중성지방', unit: 'mg/dL', arr: TG, fn: C.triglyceride, live: 'tg',
      meta: '한국지질동맥경화학회 2022 · 9~12시간 공복 필수',
      action: '낮추는 방법',
      table: [['적정', '150 미만', ['ok']], ['경계', '150~199', ['border']], ['높음', '200~499', ['high']], ['매우 높음', '500 이상 (췌장염 위험)', ['veryhigh']]],
      tips: `<p><b>가장 빨리 움직이는 수치입니다.</b> 술과 단순당(음료·과자·흰밥)을 끊으면 2~4주 만에 눈에 띄게 떨어집니다. 반대로 검사 전날 술을 마시면 크게 올라갑니다.</p>
<p><b>500 이상은 급성 췌장염 위험</b>이 있어 바로 진료가 필요합니다.</p>`,
      links: [{ href: '/alcohol/', title: '혈중알코올농도', sub: '술이 가장 큰 원인' }, { href: '/cholesterol/200/', title: '총콜레스테롤', sub: '' }, { href: '/checkup/', title: '검진 결과 전체 해석', sub: '' }] },
    { key: 'uric', dir: '/uric/', name: '요산', unit: 'mg/dL', arr: URIC, fn: (v) => C.uric(v, 'm'), live: 'uric',
      meta: '남 3.4~7.0 · 여 2.4~6.0 mg/dL (아래 계산기에서 성별 선택)',
      action: '낮추는 방법', bySex: true,
      table: [['기준 아래', '남 3.4 · 여 2.4 미만', ['low']], ['정상', '남 3.4~7.0 · 여 2.4~6.0', ['ok']], ['고요산혈증', '남 7.0 · 여 6.0 초과', ['high']], ['고요산혈증 (높음)', '9.0 초과', ['veryhigh']]],
      tips: `<p><b>수치가 높다고 모두 통풍은 아닙니다.</b> 고요산혈증인 사람의 상당수는 평생 통풍 발작이 없습니다. 다만 높을수록 확률이 올라갑니다.</p>
<p><b>맥주·내장·등푸른생선·과당 음료</b>가 요산을 올립니다. 물을 하루 2L 이상 마시면 배출에 도움이 됩니다.</p>
<p><b>급격한 체중 감량도 요산을 올립니다.</b> 단식보다 천천히 빼는 편이 안전합니다.</p>`,
      links: [{ href: '/water/', title: '하루 물 섭취량', sub: '배출에 도움' }, { href: '/food/beer/', title: '맥주 칼로리', sub: '요산의 주범' }, { href: '/checkup/', title: '검진 결과 전체 해석', sub: '' }] },
  ];
  for (const it of single) {
    for (const v of it.arr) {
      const r = it.fn(v), url = `${it.dir}${v}/`;
      const rf = it.bySex ? C.uric(v, 'f') : null;
      const title = it.bySex
        ? `요산 ${v} — 남성 ${r.label} · 여성 ${rf.label} (정상 남 7.0 · 여 6.0 이하)`
        : `${it.name} ${v} — ${r.label}, 무엇을 하면 될까 (정상 수치와 비교)`;
      const desc = it.bySex
        ? `요산 ${v}mg/dL는 남성 기준 ${r.label}, 여성 기준 ${rf.label}입니다. ${r.key === 'ok' && rf.key === 'ok' ? '두 기준 모두 정상 범위입니다.' : r.note} 구간표와 요산을 낮추는 방법.`
        : `${it.name} ${v}${it.unit}는 ${r.label} 구간입니다. ${r.note} 정상 기준과 구간표${r.key === 'ok' || r.key === 'near' || r.key === 'good' ? '.' : `, ${it.action}.`}`;
      write(url, shell({ url, og: 'checkup', title, desc, nav: 'checkup', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/checkup/', '건강검진 해석'], [it.dir, it.name], [null, String(v)]])}
<h1 class="title">${it.name} ${v}</h1>
<p class="meta">${it.meta}</p>
${it.bySex
  ? tiles([{ label: '남성 기준', value: r.label }, { label: '여성 기준', value: rf.label }, { label: '정상 범위', value: '남 3.4~7.0 · 여 2.4~6.0' }])
  : hero({ label: '판정', value: r.label, unit: '', sub: `${it.name} ${v}${it.unit}` })}
${lead(it.bySex
  ? `요산 <b>${v}mg/dL</b>는 남성 기준 <b>${r.label}</b>, 여성 기준 <b>${rf.label}</b>입니다. 요산은 남녀 정상 상한이 달라 같은 수치라도 판정이 다를 수 있습니다. ${r.key === 'ok' && rf.key === 'ok' ? '두 기준 모두 정상 범위입니다.' : (rf.key !== 'ok' ? rf.note : r.note)}`
  : `${it.name} <b>${v}${it.unit}</b>는 ${r.label} 구간입니다. ${r.note}`)}
<form class="quick live" data-live="${it.live}" style="margin-top:14px"><div class="live-head"><b>내 수치</b><span>바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>${it.name} (${it.unit})</span><input data-k="v" type="text" inputmode="decimal" value="${v}"></label>${it.key === 'uric' ? '<label class="ye-f"><span>성별</span><select data-k="sex"><option value="m">남</option><option value="f">여</option></select></label>' : ''}</div><div class="tiles"><div class="tile"><small>판정</small><span class="num" data-out="label"></span></div><div class="tile"><small>이럴 땐</small><span class="num" data-out="note"></span></div></div><div class="live-foot"><a data-out="link" href="${it.dir}">이 수치 페이지 →</a></div></form>
${section('구간표', null, table(['구간', it.unit], it.table.map(([a, b, ks]) => ({ cells: [a, b], cls: (ks || []).includes(r.key) ? 'on' : '' }))))}
${ad()}
${section('가까운 수치', null, chips(near(it.arr, v).map((x) => ({ label: `${x}`, href: `${it.dir}${x}/`, on: x === v }))))}
${section('알아두면 좋은 것', null, `<div class="doc">${it.tips}</div>`)}
${section('이어서', null, list(it.links))}
${NOTE('')}` }));
    }
    const r0 = it.fn(it.arr[Math.floor(it.arr.length / 2)]);
    write(it.dir, shell({ url: it.dir, og: 'checkup', title: `${it.name} 정상 수치와 구간표 — 내 숫자는 어디쯤일까`, desc: `${it.name}의 정상 범위와 경계·이상 구간을 학회 기준으로 정리했습니다. ${it.arr[0]}부터 ${it.arr[it.arr.length - 1]}${it.unit}까지 수치별 해석.`, nav: 'checkup', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/checkup/', '건강검진 해석'], [null, it.name]])}
<h1 class="title">${it.name} 정상 수치</h1>
<p class="meta">${it.meta}</p>
<form class="quick live" data-live="${it.live}" style="margin-top:14px"><div class="live-head"><b>내 수치</b><span>바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>${it.name} (${it.unit})</span><input data-k="v" type="text" inputmode="decimal" value="${it.arr[Math.floor(it.arr.length / 2)]}"></label>${it.key === 'uric' ? '<label class="ye-f"><span>성별</span><select data-k="sex"><option value="m">남</option><option value="f">여</option></select></label>' : ''}</div><div class="tiles"><div class="tile"><small>판정</small><span class="num" data-out="label"></span></div><div class="tile"><small>이럴 땐</small><span class="num" data-out="note"></span></div></div><div class="live-foot"><a data-out="link" href="${it.dir}">이 수치 자세히 →</a></div></form>
${section('구간표', null, table(['구간', it.unit], it.table.map(([a, b]) => ({ cells: [a, b] }))))}
${section('수치별', null, chips(it.arr.map((x) => ({ label: `${x}`, href: `${it.dir}${x}/` }))))}
${ad()}
${section('이어서', null, list(it.links))}
${NOTE('')}` }));
  }

  /* ---------- 간수치 ---------- */
  const liverUrl = (a) => `/liver/${a}/`;
  for (const a of ALT) {
    const r = C.liver(0, a), url = liverUrl(a);
    const title = `간수치 ALT ${a} — ${r.label}, 정상 범위와 원인 (AST·ALT·감마지티피)`;
    const desc = `ALT ${a} IU/L는 ${r.label} 구간입니다. ${r.note} 정상은 40 이하이며 지방간·음주·약물이 흔한 원인입니다.`;
    write(url, shell({ url, og: 'checkup', title, desc, nav: 'checkup', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/checkup/', '건강검진 해석'], ['/liver/', '간수치'], [null, `ALT ${a}`]])}
<h1 class="title">간수치 ALT ${a}</h1>
<p class="meta">AST·ALT 정상 40 IU/L 이하 · 감마지티피 남 11~63 · 여 8~35</p>
${hero({ label: '판정', value: r.label, unit: '', sub: `ALT ${a} IU/L · 정상 상한 40` })}
${lead(`ALT ${a} IU/L는 <b>${r.label}</b> 구간입니다. ${r.note} AST 수치를 함께 넣으면 두 값의 비로 원인을 좁힐 수 있습니다.`)}
<form class="quick live" data-live="liver" style="margin-top:14px"><div class="live-head"><b>AST와 함께 보기</b><span>비율로 원인을 가늠합니다</span></div><div class="ye-grid"><label class="ye-f"><span>AST (SGOT)</span><input data-k="ast" type="text" inputmode="numeric" value="${a}"></label><label class="ye-f"><span>ALT (SGPT)</span><input data-k="alt" type="text" inputmode="numeric" value="${a}"></label></div><div class="tiles"><div class="tile"><small>판정</small><span class="num" data-out="label"></span></div><div class="tile"><small>AST/ALT 비</small><span class="num" data-out="ratio"></span></div><div class="tile"><small>이럴 땐</small><span class="num" data-out="note"></span></div></div><div class="live-foot"><a data-out="link" href="/liver/40/">이 수치 페이지 →</a></div></form>
${section('구간표', 'AST·ALT 중 높은 값 기준', table(['구간', 'IU/L'], [
  { cells: ['정상', '40 이하'], cls: r.key === 'ok' ? 'on' : '' },
  { cells: ['경도 상승', '41~80'], cls: r.key === 'mild' ? 'on' : '' },
  { cells: ['중등도 상승', '81~200'], cls: r.key === 'moderate' ? 'on' : '' },
  { cells: ['고도 상승', '200 초과 (바로 진료)'], cls: r.key === 'severe' ? 'on' : '' },
]))}
${ad()}
${section('가까운 수치', null, chips(near(ALT, a).map((x) => ({ label: `${x}`, href: liverUrl(x), on: x === a }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>가장 흔한 원인은 지방간입니다.</b> 우리나라 성인의 간수치 상승 가운데 상당수가 비알코올성 지방간이고, 체중을 7~10% 줄이면 수치가 정상으로 돌아오는 경우가 많습니다.</p>
<p><b>AST가 ALT보다 2배 이상 높으면</b> 알코올성 간질환을 먼저 의심합니다. 반대로 ALT가 더 높으면 지방간·바이러스 간염 쪽입니다.</p>
<p><b>검사 전 격한 운동은 AST를 올립니다.</b> AST는 근육에도 있어 헬스나 마라톤 직후 검사하면 높게 나옵니다. 며칠 쉬고 재검하면 정상인 경우가 흔합니다.</p>
<p><b>건강기능식품과 한약도 원인이 됩니다.</b> 최근 먹기 시작한 것이 있으면 의사에게 알리세요.</p>
</div>`)}
${section('이어서', null, list([{ href: '/checkup/', title: '검진 결과 전체 해석', sub: '' }, { href: '/alcohol/', title: '혈중알코올농도', sub: '음주량 계산' }, { href: '/diet/', title: '다이어트 기간', sub: '체중 7% 줄이기' }]))}
${NOTE('간수치 참고치는 검사 기관에 따라 남 ≤41, 여 ≤33 등으로 조금씩 다릅니다.')}` }));
  }
  write('/liver/', shell({ url: '/liver/', og: 'checkup', title: '간수치 정상 범위 — AST·ALT 수치별 해석과 감마지티피 참고치', desc: 'AST·ALT 정상 40 IU/L 이하, 감마지티피 남 11~63·여 8~35. 수치별로 어느 구간인지, 지방간·음주·약물 가운데 무엇을 의심하는지 정리했습니다.', nav: 'checkup', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/checkup/', '건강검진 해석'], [null, '간수치']])}
<h1 class="title">간수치 정상 범위</h1>
<p class="meta">AST·ALT 40 IU/L 이하 · 감마지티피 남 11~63 · 여 8~35</p>
<form class="quick live" data-live="liver" style="margin-top:14px"><div class="live-head"><b>내 간수치</b><span>바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>AST (SGOT)</span><input data-k="ast" type="text" inputmode="numeric" value="25"></label><label class="ye-f"><span>ALT (SGPT)</span><input data-k="alt" type="text" inputmode="numeric" value="22"></label></div><div class="tiles"><div class="tile"><small>판정</small><span class="num" data-out="label"></span></div><div class="tile"><small>AST/ALT 비</small><span class="num" data-out="ratio"></span></div><div class="tile"><small>이럴 땐</small><span class="num" data-out="note"></span></div></div><div class="live-foot"><a data-out="link" href="/liver/40/">이 수치 자세히 →</a></div></form>
${lead('AST와 ALT는 간세포 안에 있는 효소로, 간세포가 손상되면 혈액으로 새어 나와 수치가 올라갑니다. 40 이하가 정상이고, 41~80은 지방간·음주·약물이 가장 흔한 원인입니다.')}
${section('수치별', 'ALT 기준', chips(ALT.map((x) => ({ label: `${x}`, href: liverUrl(x) }))))}
${ad()}
${section('이어서', null, list([{ href: '/checkup/', title: '검진 결과 전체 해석', sub: '' }, { href: '/alcohol/', title: '혈중알코올농도', sub: '' }]))}
${NOTE('감마지티피는 위 종합 해석기에서 함께 판정할 수 있습니다.')}` }));
}
