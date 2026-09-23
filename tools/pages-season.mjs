/* 철 따라 찾는 페이지 — /flu/ 2026-2027 독감 예방접종, /checkup/2026/ 올해 국가건강검진 대상자
 * 둘 다 "내가 대상인가, 언제부터인가"에 답하는 한 장. 계산은 src/js/season.js (생년월일만 넣으면 그 자리에서).
 * 사실 출처: 질병관리청 보도자료 2026-08-25(인플루엔자)·2026-09(코로나19 시행계획), 국민건강보험공단 검진 안내, 산업안전보건법 시행령.
 * 해마다 갱신: FLU(절기·날짜·출생 범위)와 CHK(연도·짝홀수), 신규 항목 — src/js/season.js 의 같은 값도 함께. */

/* 2026-2027절기 인플루엔자 국가예방접종 — 질병관리청 2026-08-25 */
export const FLU = {
  season: '2026-2027', start: '2026-09-21', end: '2027-04-30', vaccine: '3가',
  kids: { from: '2012-01-01', to: '2026-08-31', two: '2026-09-21', one: '2026-09-28', label: '생후 6개월~14세' },
  pregnant: '2026-09-21',
  senior: [
    { label: '75세 이상', to: '1951-12-31', date: '2026-10-12', wd: '월' },
    { label: '70~74세', from: '1952-01-01', to: '1956-12-31', date: '2026-10-15', wd: '목' },
    { label: '65~69세', from: '1957-01-01', to: '1961-12-31', date: '2026-10-19', wd: '월' },
  ],
  covid: { start: '2026-10-12', end: '2027-06-30' },
};
/* 2026년 국가건강검진 */
export const CHK = { year: 2026, parity: '짝수', digits: '0·2·4·6·8', other: '홀수', otherYear: 2027 };

const md = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${m}월 ${d}일`; };
const ymd = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${y}년 ${m}월 ${d}일`; };
const dot = (iso) => iso.replace(/-/g, '.');

export function buildSeason(ctx) {
  const { write, shell, crumb, list, section, table, lead, ad } = ctx;
  const SITE = 'https://bodyzip.com';
  const faqLd = (qa) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) });
  const pageLd = (url, title, desc) => ({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description: desc, url: SITE + url, inLanguage: 'ko', datePublished: '2026-09-23', dateModified: '2026-09-23', isPartOf: { '@type': 'WebSite', name: '바디집', url: SITE } });
  const faqHtml = (qa) => `<div class="doc">${qa.map(([q, a]) => `<p><b>${q}</b> ${a}</p>`).join('')}</div>`;

  /* ---------- 독감 ---------- */
  {
    const F = FLU, s = F.senior;
    const rows = [
      { cells: ['어린이 — 2회 접종 대상', `${F.kids.label}<br><small>${dot(F.kids.from)}~${dot(F.kids.to)} 출생</small>`, `<b>${md(F.kids.two)}(월)</b>`, '올해 처음 맞거나 지금까지 1회만 맞은 9세 미만 — 4주 간격 2회'] },
      { cells: ['어린이 — 1회 접종 대상', F.kids.label, `<b>${md(F.kids.one)}(월)</b>`, '지난 절기까지 2회 이상 맞은 어린이'] },
      { cells: ['임신부', '임신 주수와 관계없이', `<b>${md(F.pregnant)}(월)</b>`, '산모수첩·임신확인서 지참'] },
      ...s.map((g) => ({ cells: [g.label, `<small>${g.from ? dot(g.from) + '~' : ''}${dot(g.to)}${g.from ? '' : ' 이전'} 출생</small>`, `<b>${md(g.date)}(${g.wd})</b>`, '코로나19 백신과 같은 날 동시접종 권고'] })),
    ];
    const widget = `<form class="quick live" data-live="flu" style="margin-top:14px">
<div class="live-head"><b>생년월일만 넣으면</b><span>무료 대상인지, 언제부터인지</span></div>
<div class="ye-grid">
<label class="ye-f"><span>생년월일</span><input data-k="birth" type="date" min="1900-01-01" max="2026-12-31"></label>
<label class="ye-f"><span>&nbsp;</span><span style="display:flex;align-items:center;gap:8px;font-weight:400;color:var(--ink);font-size:14px"><input data-k="preg" type="checkbox" style="width:auto"> 임신 중</span></label>
</div>
<div class="tiles" style="margin-top:12px"><div class="tile"><small>무료 접종</small><span class="num" data-out="free">—</span></div><div class="tile"><small>시작일</small><span class="num" data-out="date">—</span></div><div class="tile"><small>오늘 기준</small><span class="num" data-out="now">—</span></div></div>
<p class="sub" data-out="msg" aria-live="polite" style="margin-top:10px">생년월일을 넣어 보세요.</p>
</form>`;
    const qa = [
      ['독감 예방접종은 언제 맞는 게 좋나요?', `국가예방접종은 ${md(F.start)}부터 ${ymd(F.end)}까지지만, 항체가 생기는 데 2주쯤 걸리고 유행은 보통 12월~이듬해 1월에 시작하니 <b>10~11월 안에</b> 맞는 것이 좋습니다. 65세 이상은 시작일이 10월 중순이라 시작하자마자 맞으면 됩니다.`],
      ['우리 아이가 2회 접종 대상인지 어떻게 아나요?', '생후 6개월~9세 미만 어린이 가운데 올해 처음 맞거나 지금까지 딱 1회만 맞은 아이가 2회 대상입니다. 4주 간격으로 두 번 맞습니다. 이미 두 번 이상 맞은 적이 있으면 1회면 됩니다. 접종 기록은 예방접종도우미(nip.kdca.go.kr)에서 볼 수 있습니다.'],
      ['무료 대상이 아니면 얼마인가요?', '국가예방접종 대상이 아니면 비급여라 병원마다 값이 다릅니다. 건강보험심사평가원 누리집의 비급여 진료비 정보에서 병원별 접종비를 비교할 수 있고, 회사·학교 단체 접종을 이용하면 싼 경우가 많습니다.'],
      ['코로나19 백신과 같은 날 맞아도 되나요?', `됩니다. 질병관리청은 65세 이상에게 두 백신을 한 번 방문으로 동시에 맞을 것을 권합니다. 코로나19 국가예방접종도 ${md(F.covid.start)}부터 연령별로 시작해 ${ymd(F.covid.end)}까지입니다.`],
      ['주소지가 아닌 곳에서도 맞을 수 있나요?', '전국 위탁의료기관과 보건소 어디서든 주소지와 관계없이 무료로 맞을 수 있습니다. 방문 전에 예방접종도우미에서 그 병원에 백신이 남아 있는지 확인하세요.'],
      ['올해 달라진 점은?', `어린이 무료 대상이 생후 6개월~13세에서 <b>14세(${dot(F.kids.from)}~${dot(F.kids.to)} 출생)</b>까지 넓어졌습니다. 백신은 세계보건기구 권장주가 모두 든 3가 백신입니다.`],
    ];
    const title = `2026-2027 독감 예방접종 — 무료 대상·시작일(어린이 ${md(F.kids.two)}·65세 이상 ${md(s[0].date)}부터)·코로나 동시접종`;
    const desc = `2026-2027절기 독감(인플루엔자) 국가예방접종: 어린이(생후 6개월~14세)와 임신부는 ${md(F.kids.two)}부터, 75세 이상 ${md(s[0].date)}·70~74세 ${md(s[1].date)}·65~69세 ${md(s[2].date)}부터 ${ymd(F.end)}까지 무료. 생년월일을 넣으면 내 시작일이 바로 나옵니다.`;
    const body = `
${crumb([['/', '홈'], ['/checkup/', '검진'], [null, '2026-2027 독감 예방접종']])}
<h1 class="title">2026-2027 독감 예방접종 — 나는 언제 무료로 맞을까</h1>
<p class="meta">질병관리청 국가예방접종 · ${md(F.start)} 시작 · ${ymd(F.end)}까지 · ${F.vaccine} 백신 · 전국 위탁의료기관·보건소 무료</p>
${widget}
${lead(`올겨울 독감 무료 접종은 <b>어린이와 임신부가 ${md(F.kids.two)}</b>, <b>65세 이상은 ${md(s[0].date)}</b>부터 나이 많은 순서로 시작합니다. 어린이 대상은 올해부터 14세까지 넓어졌고, 65세 이상은 코로나19 백신과 같은 날 함께 맞도록 권합니다. 무료 대상이 아니어도 10~11월에 맞아 두는 것이 겨울을 편하게 나는 길입니다.`)}
${section('대상별 시작일', `${ymd(F.end)}까지 · 시작일은 국가 지원이 열리는 날`, table(['대상', '누가', '시작일', '비고'], rows))}
${ad()}
${section('어린이는 2회일 수도 있어요', null, `<div class="doc">
<p>생후 6개월~9세 미만 아이 가운데 <b>올해 처음 맞거나 지금까지 1회만 맞은 아이</b>는 4주 간격으로 두 번 맞아야 항체가 충분히 생깁니다. 그래서 2회 대상 접종을 ${md(F.kids.two)}에 먼저 열고, 1회 대상은 한 주 뒤 ${md(F.kids.one)}부터입니다. 두 번째는 첫 접종 4주 뒤이니, 첫 접종을 늦어도 11월 초에는 마쳐야 유행 전에 끝납니다.</p>
<p>9세 이상이거나 예전에 두 번 이상 맞은 아이는 해마다 한 번이면 됩니다. 아이 접종 기록은 <a href="https://nip.kdca.go.kr/" rel="nofollow">예방접종도우미</a>에서 확인할 수 있고, 아기의 다른 예방접종 날짜는 <a href="/baby/">아기 개월수 계산기</a>에 생일만 넣으면 표로 나옵니다.</p>
</div>`)}
${section('임신부', null, `<div class="doc"><p>임신 주수와 관계없이 ${md(F.pregnant)}부터 무료입니다. 독감 백신은 불활성화 백신이라 임신 중 접종이 권장되고, 엄마가 맞으면 생후 6개월 전이라 아직 접종할 수 없는 아기도 항체를 나눠 받습니다. 병원에 갈 때 산모수첩이나 임신확인서를 가져가세요.</p></div>`)}
${section('65세 이상은 코로나19와 함께', `${dot(s[2].to)} 이전 출생`, `<div class="doc">
<p>75세 이상(${dot(s[0].to)} 이전 출생)은 ${md(s[0].date)}, 70~74세는 ${md(s[1].date)}, 65~69세는 ${md(s[2].date)}부터입니다. 처음 며칠은 붐비니 시작일 직후가 아니라도 10월 안에만 맞으면 충분합니다.</p>
<p>코로나19 국가예방접종도 같은 날 ${md(F.covid.start)}부터 65세 이상에게 연령별로 열립니다(${ymd(F.covid.end)}까지). 질병관리청은 병원을 한 번만 가도록 두 백신을 <b>같은 날 양쪽 팔에</b> 맞을 것을 권합니다. 12세 이상 면역저하자와 요양시설 입원·입소자도 코로나19 접종 대상입니다.</p>
</div>`)}
${section('무료 대상이 아니라면', null, `<div class="doc">
<p>15세부터 64세까지 임신하지 않은 사람은 국가 지원이 없어 비급여로 맞습니다. 값은 병원마다 다르니 <a href="https://www.hira.or.kr/" rel="nofollow">건강보험심사평가원</a>의 비급여 진료비 정보에서 비교하거나, 직장·학교의 단체 접종을 이용하세요. 만성질환(당뇨·심장·호흡기·신장 질환)이 있거나 65세 이상 부모님과 함께 살거나 어린 아기를 돌본다면 무료가 아니어도 꼭 맞는 것이 좋습니다.</p>
</div>`)}
${section('어디서, 어떻게', null, `<div class="doc">
<p><b>장소</b> — 전국 위탁의료기관과 보건소 약 2만 3천 곳. 주소지와 상관없습니다. <b>확인</b> — 방문 전 예방접종도우미(nip.kdca.go.kr › 지정의료기관 찾기)에서 병원별 백신 보유량을 보고 가면 헛걸음이 없습니다. <b>준비물</b> — 신분증(어린이는 보호자 신분증), 임신부는 산모수첩. <b>당일</b> — 열이 있거나 몸이 많이 아프면 미루고, 맞은 뒤 15~30분은 병원에서 기다렸다 나옵니다.</p>
<p>접종한 팔이 하루 이틀 뻐근하거나 미열이 나는 것은 흔한 반응입니다. 숨이 차거나 두드러기·부기가 심하면 바로 진료를 받으세요.</p>
</div>`)}
${section('자주 묻는 것', null, faqHtml(qa))}
${section('이어서', null, list([
  { href: '/checkup/2026/', title: `${CHK.year}년 건강검진 대상자 확인`, sub: `${CHK.parity}년생인지, 내 나이 항목은 무엇인지` },
  { href: '/baby/', title: '아기 예방접종 일정', sub: '생일만 넣으면 접종 날짜 표와 캘린더 파일' },
  { href: '/checkup/', title: '건강검진 결과 해석', sub: '혈압·혈당·콜레스테롤 판정' },
]))}
<p class="note">질병관리청 「2026-2027절기 인플루엔자 국가예방접종 시행」(2026.8.25)과 「2026-2027절기 코로나19 국가예방접종 시행계획」 보도자료, 예방접종도우미 안내를 정리했습니다. 시작일은 국가 지원이 열리는 날이며 병원 사정으로 며칠 차이가 날 수 있습니다. 접종 가능 여부는 의사가 판단합니다.</p>`;
    write('/flu/', shell({ url: '/flu/', og: 'flu', nav: 'checkup', title, desc, body, scripts: ['/js/season.js'], ld: [pageLd('/flu/', title, desc), faqLd(qa)] }));
  }

  /* ---------- 건강검진 ---------- */
  {
    const Y = CHK.year;
    const who = [
      { cells: ['직장가입자 · 사무직', '2년에 한 번', `${CHK.parity}년생`] },
      { cells: ['직장가입자 · 비사무직', '매년', '출생연도와 관계없이 올해 대상'] },
      { cells: ['지역가입자 세대주·세대원 (20세 이상)', '2년에 한 번', `${CHK.parity}년생`] },
      { cells: ['피부양자 (20세 이상)', '2년에 한 번', `${CHK.parity}년생`] },
      { cells: ['의료급여 수급자 (19~64세)', '2년에 한 번', `${CHK.parity}년생`] },
    ];
    const items = [
      { cells: ['이상지질혈증 (콜레스테롤·중성지방)', '남 24세부터 · 여 40세부터', '4년마다'] },
      { cells: ['B형간염 (표면항원·항체)', '40세', '한 번 · 이미 면역이 있으면 제외'] },
      { cells: ['C형간염 항체', '56세', '한 번'] },
      { cells: ['폐기능검사 <small>2026년 신설</small>', '56세 · 66세', '만성폐쇄성폐질환 조기 발견'] },
      { cells: ['골밀도', '54세 · 60세 · 66세 여성', '골다공증'] },
      { cells: ['인지기능장애', '66세부터', '2년마다'] },
      { cells: ['정신건강검사 (우울증)', '20~34세 2년마다 · 35세부터 나이대마다', '설문'] },
      { cells: ['생애전환기 검사', '66세', '노인 신체기능·낙상 위험 등'] },
    ];
    const cancer = [
      { cells: ['위암', '40세 이상', '2년마다', '위내시경 (또는 위장조영)'] },
      { cells: ['대장암', '50세 이상', '매년', '분변잠혈검사 → 양성이면 대장내시경'] },
      { cells: ['간암', '40세 이상 고위험군', '6개월마다', 'B·C형 간염 보유자, 간경변'] },
      { cells: ['유방암', '40세 이상 여성', '2년마다', '유방촬영'] },
      { cells: ['자궁경부암', '20세 이상 여성', '2년마다', '세포검사'] },
      { cells: ['폐암', '54~74세 고위험군', '2년마다', '30갑년 이상 흡연 · 저선량 CT'] },
    ];
    const fines = [
      { cells: ['근로자 본인', '5만원', '10만원', '15만원'] },
      { cells: ['사업주 (근로자 1명당)', '10만원', '20만원', '30만원'] },
    ];
    const widget = `<form class="quick live" data-live="checkup2026" style="margin-top:14px">
<div class="live-head"><b>태어난 해와 성별만 넣으면</b><span>올해 대상인지, 어떤 검사를 받는지</span></div>
<div class="ye-grid">
<label class="ye-f"><span>태어난 해</span><input data-k="by" type="text" inputmode="numeric" placeholder="1986" maxlength="4"></label>
<label class="ye-f"><span>성별</span><select data-k="sex"><option value="m">남</option><option value="f">여</option></select></label>
<label class="ye-f"><span>가입 구분</span><select data-k="type"><option value="office">직장가입자 · 사무직</option><option value="field">직장가입자 · 비사무직</option><option value="local">지역가입자</option><option value="dep">피부양자</option></select></label>
</div>
<div class="tiles" style="margin-top:12px"><div class="tile"><small>${Y}년 대상</small><span class="num" data-out="yes">—</span></div><div class="tile"><small>검진 나이</small><span class="num" data-out="age">—</span></div><div class="tile"><small>암검진</small><span class="num" data-out="cancer">—</span></div></div>
<p class="sub" data-out="msg" aria-live="polite" style="margin-top:10px">태어난 해를 넣어 보세요.</p>
<div class="doc" data-out="items" style="margin-top:6px;font-size:13.5px"></div>
</form>`;
    const qa = [
      [`${Y}년 건강검진 대상자는 누구인가요?`, `${CHK.parity}년에 태어난 사람(출생연도 끝자리 ${CHK.digits})입니다. 직장가입자 가운데 비사무직은 출생연도와 관계없이 해마다 받습니다. 20세 이상 지역가입자·피부양자도 같은 규칙입니다.`],
      ['검진 나이는 어떻게 세나요?', `만 나이가 아니라 <b>${Y} − 태어난 해</b>입니다. 1986년생이면 올해 40세라 B형간염 검사와 위암·유방암 검진이 처음 들어갑니다.`],
      ['언제까지 받아야 하나요?', `${Y}년 12월 31일까지입니다. 검진에서 이상이 나와 받는 확진검사는 다음 해 3월 31일까지 무료입니다. 12월에는 예약이 몰려 한 달 이상 기다리기도 하니 10~11월이 편합니다.`],
      ['안 받으면 정말 과태료를 내나요?', '직장가입자만 해당합니다. 산업안전보건법이 사업주와 근로자 모두에게 건강검진을 의무로 두어, 근로자는 5만·10만·15만원(1·2·3차), 사업주는 근로자 1명당 10만·20만·30만원을 물 수 있습니다. 지역가입자·피부양자는 과태료가 없지만 2년에 한 번뿐인 무료 검진을 놓치는 셈입니다.'],
      ['올해 못 받고 해를 넘기면 어떻게 하나요?', '다음 해에 국민건강보험공단에 "전년도 미수검자 추가 신청"을 하면 그 해 대상으로 다시 넣어 줍니다. 지역가입자·피부양자는 공단 누리집·The건강보험 앱·1577-1000으로, 직장가입자는 회사 담당자를 통해 신청합니다.'],
      ['검진 전날 무엇을 지켜야 하나요?', '전날 저녁 9시 이후 금식(물 조금은 됨), 당일 아침 약은 의사와 상의, 위내시경을 수면으로 받으면 운전을 피하고 보호자와 함께 갑니다. 혈압약은 보통 그대로 먹고 가되 검진기관에 미리 물어보세요.'],
      [`${Y}년에 새로 생긴 검사는?`, '56세와 66세에 폐기능검사(폐활량 측정)가 무료로 들어갔고, 검진 뒤 당뇨 확진검사에서 당화혈색소 검사비 본인부담이 없어졌습니다.'],
    ];
    const title = `${Y}년 국가건강검진 대상자 — ${CHK.parity}년생 확인·나이별 항목·기간·과태료`;
    const desc = `${Y}년 국가건강검진은 ${CHK.parity}년생과 비사무직 근로자가 대상입니다(12월 31일까지). 태어난 해와 성별을 넣으면 대상 여부와 내 나이의 검사 항목(이상지질혈증·B·C형간염·폐기능·골밀도·암검진)이 바로 나옵니다. 미수검 과태료와 해 넘겼을 때 방법까지.`;
    const body = `
${crumb([['/', '홈'], ['/checkup/', '검진'], [null, `${Y}년 대상자`]])}
<h1 class="title">${Y}년 국가건강검진, 나는 대상일까</h1>
<p class="meta">국민건강보험공단 일반건강검진 · ${Y}년 1월 1일~12월 31일 · ${CHK.parity}년생 + 비사무직 · 본인 부담 없음</p>
${widget}
${lead(`${Y}년은 <b>${CHK.parity}년에 태어난 사람</b>이 받는 해입니다. 직장에서 비사무직이면 해마다, 사무직·지역가입자·피부양자는 2년에 한 번이라 ${CHK.other}년생은 ${CHK.otherYear}년 차례입니다. 기본 검사에 나이마다 콜레스테롤·간염·골밀도·폐기능 같은 항목이 더해지고, 40세부터는 암검진이 붙습니다. 12월은 예약이 밀리니 10~11월에 다녀오세요.`)}
${section('누가 올해 대상인가', `${Y}년 · 출생연도 끝자리 ${CHK.digits}`, table(['구분', '주기', `${Y}년`], who))}
${section('공통 검사', '모든 대상자', `<div class="doc"><p>문진·진찰, 키·몸무게·허리둘레·체질량지수(BMI), 시력·청력, 혈압, 흉부 X선, 혈액검사(공복혈당·혈색소·AST·ALT·감마지티피·크레아티닌·신사구체여과율), 소변검사(요단백), 구강검진. 결과지의 숫자가 무슨 뜻인지는 <a href="/checkup/">검진 결과 해석</a>에서 그대로 넣어 보면 됩니다.</p></div>`)}
${section('나이에 따라 더 받는 검사', `검진 나이 = ${Y} − 태어난 해`, table(['검사', '나이', '주기·비고'], items))}
${ad()}
${section('암검진 6종', '검진 나이 기준 · 본인 부담 10% (건강보험료 하위 50%·자궁경부암·대장암은 무료)', table(['암', '대상', '주기', '검사'], cancer))}
${section(`${Y}년에 달라진 것`, null, `<div class="doc">
<p><b>폐기능검사 신설</b> — 56세와 66세에 폐활량을 재는 검사가 들어갔습니다. 만성폐쇄성폐질환(COPD)은 100명 중 12명꼴로 있지만 대부분 모르고 지내서, 담배를 피웠거나 숨이 잘 차는 사람은 꼭 받으세요. 검사 30분 전 격한 운동, 1시간 전 흡연, 4시간 전 음주를 피해야 값이 정확합니다.</p>
<p><b>당화혈색소 본인부담 면제</b> — 검진에서 혈당이 높게 나와 당뇨 확진검사를 받을 때 당화혈색소 검사비를 내지 않습니다. 검진 결과표를 가져가야 합니다.</p>
</div>`)}
${section('기간과 예약', null, `<div class="doc">
<p>${Y}년 1월 1일부터 12월 31일까지이고, 이상 소견이 나온 뒤 받는 확진검사(당뇨·고혈압·인지기능 등)는 다음 해 3월 31일까지 무료입니다. 검진기관은 국민건강보험공단 누리집 › 건강iN › 검진기관 찾기, 또는 <b>The건강보험</b> 앱에서 찾고, 대상 여부도 앱과 1577-1000에서 바로 확인됩니다.</p>
<p>가을부터 예약이 차기 시작해 12월에는 원하는 날짜를 잡기 어렵습니다. 위내시경을 수면으로 받으려면 보호자와 시간을 맞춰야 하니 더 일찍 잡는 것이 좋습니다.</p>
</div>`)}
${section('안 받으면 — 직장가입자 과태료', '산업안전보건법 · 정당한 사유 없이 받지 않았을 때', table(['누가', '1차', '2차', '3차'], fines))}
${section('해를 넘겼다면', null, `<div class="doc"><p>다음 해에 공단에 <b>전년도 미수검자 추가 신청</b>을 하면 그 해 대상으로 다시 넣어 줍니다. 지역가입자·피부양자는 공단 누리집(건강iN › 나의 건강관리 › 전년도 미수검자 추가신청)이나 The건강보험 앱, 전화 1577-1000으로, 직장가입자는 회사 검진 담당자에게 말하면 됩니다. 다만 그 해 원래 대상자와 겹치니 서둘러 예약하세요.</p></div>`)}
${section('검진 전 준비', null, `<div class="doc"><p>전날 저녁 9시부터 금식(물 한두 모금은 괜찮음), 당일 아침 혈압약·심장약은 보통 그대로 먹되 검진기관에 확인, 당뇨약은 검진 뒤에. 몸에 붙이는 금속·장신구는 빼고 갑니다. 여성은 생리 중이면 소변·자궁경부 검사를 미룹니다. 결과는 보통 2주 안에 우편이나 앱으로 옵니다.</p></div>`)}
${section('자주 묻는 것', null, faqHtml(qa))}
${section('이어서', null, list([
  { href: '/checkup/', title: '검진 결과 해석', sub: '혈압·혈당·콜레스테롤·간수치를 넣으면 한 번에 판정' },
  { href: '/flu/', title: '2026-2027 독감 예방접종', sub: '생년월일 넣으면 무료 시작일' },
  { href: '/bp/log/', title: '혈압 기록', sub: '집에서 잰 혈압 7일 평균' },
  { href: '/bmi/', title: 'BMI · 정상 체중', sub: '검진 결과의 첫 줄' },
]))}
<p class="note">국민건강보험공단 건강검진 실시 안내, 보건복지부 2026년 국가건강검진 개편 자료, 산업안전보건법 시행령 과태료 기준을 정리했습니다. 대상 여부는 공단 조회가 기준이며, 사업장·가입 상태에 따라 다를 수 있습니다.</p>`;
    write('/checkup/2026/', shell({ url: '/checkup/2026/', og: 'checkup2026', nav: 'checkup', title, desc, body, scripts: ['/js/season.js'], ld: [pageLd('/checkup/2026/', title, desc), faqLd(qa)] }));
  }
}
