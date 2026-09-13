/* 반려동물 구역 — 강아지·고양이 나이 환산, 사료량, 예방접종 일정(+캘린더) */
import * as D from '../engine/dates.mjs';
import * as P from '../engine/pet.mjs';
import * as I from '../engine/ics.mjs';
import { num } from '../engine/fmt.mjs';
import fs from 'node:fs';
import path from 'node:path';

export const DOG_YEARS = []; for (let y = 1; y <= 20; y++) DOG_YEARS.push(y);
export const CAT_YEARS = []; for (let y = 1; y <= 25; y++) CAT_YEARS.push(y);
export const DOG_KG = []; for (let k = 1; k <= 50; k++) DOG_KG.push(k);
export const CAT_KG = []; for (let k = 1; k <= 12; k++) CAT_KG.push(k);

export function buildPet(ctx) {
  const { write, shell, crumb, tiles, list, section, table, lead, ad, TODAY, OUT } = ctx;
  const wrapChips = (items) => `<div class="chips" style="flex-wrap:wrap;overflow:visible">${items.map((c) => c.on ? `<span class="chip on" style="min-width:0;padding:4px 9px">${c.label}</span>` : `<a class="chip" style="min-width:0;padding:4px 9px" href="${c.href}">${c.label}</a>`).join('')}</div>`;
  const NOTE = (s) => `<p class="note">${s} <a href="/method/">계산 기준 보기</a></p>`;
  const kindName = (k) => k === 'cat' ? '고양이' : '강아지';

  /* ---------- 나이 ---------- */
  const ageUrl = (kind, y) => `/pet/${kind}-age/${y}/`;
  const ageForm = (kind, y) => `<form class="quick live" data-live="petage" data-kind="${kind}" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>${kindName(kind)} 나이 → 사람 나이</span></div><div class="ye-grid"><label class="ye-f"><span>${kindName(kind)} 나이 (년)</span><input data-k="y" type="text" inputmode="decimal" value="${y}"></label>${kind === 'dog' ? `<label class="ye-f"><span>크기</span><select data-k="size">${P.DOG_SIZES.map((s) => `<option value="${s.key}">${s.label}</option>`).join('')}</select></label>` : ''}</div><div class="tiles"><div class="tile"><small>사람 나이로</small><span class="num" data-out="human"></span></div><div class="tile"><small>시기</small><span class="num" data-out="stage"></span></div>${kind === 'dog' ? '<div class="tile"><small>후성유전 공식 (참고)</small><span class="num" data-out="log"></span></div>' : '<div class="tile"><small>1살 = 사람 15세</small><span class="num">2살 = 24세</span></div>'}</div></form>`;
  for (const kind of ['dog', 'cat']) {
    const YEARS = kind === 'dog' ? DOG_YEARS : CAT_YEARS;
    for (const y of YEARS) {
      const url = ageUrl(kind, y);
      const h = kind === 'dog' ? P.dogAge(y, 'small') : P.catAge(y);
      const hm = kind === 'dog' ? P.dogAge(y, 'medium') : null, hl = kind === 'dog' ? P.dogAge(y, 'large') : null;
      const title = kind === 'dog' ? `강아지 ${y}살은 사람 나이로 몇 살? — 소형견 ${h}세 · 중형견 ${hm}세 · 대형견 ${hl}세` : `고양이 ${y}살은 사람 나이로 몇 살? — 약 ${h}세 (${P.petStage('cat', y).split(' —')[0]})`;
      const desc = kind === 'dog' ? `강아지 ${y}살은 사람 나이로 소형견 ${h}세, 중형견 ${hm}세, 대형견 ${hl}세에 해당합니다(1살 15세, 2살 24세, 이후 크기별 4·5·6세씩). 소형견 기준 ${P.petStage('dog', y, 'small')}.` : `고양이 ${y}살은 사람 나이로 약 ${h}세입니다(1살 15세, 2살 24세, 이후 해마다 4세씩). ${P.petStage('cat', y)}.`;
      const body = `
${crumb([['/pet/', '반려동물'], [`/pet/${kind}-age/`, `${kindName(kind)} 나이`], [null, `${y}살`]])}
<h1 class="title">${kindName(kind)} ${y}살은 사람 나이로</h1>
<p class="meta">1살 = 15세 · 2살 = 24세 · 이후 ${kind === 'dog' ? '소형 4 · 중형 5 · 대형 6세씩' : '해마다 4세씩'}</p>
${kind === 'dog' ? tiles([{ label: '소형견', value: `${h}세` }, { label: '중형견', value: `${hm}세` }, { label: '대형견', value: `${hl}세` }]) : tiles([{ label: '사람 나이로', value: `${h}세` }, { label: '시기', value: P.petStage('cat', y).split(' —')[0] }, { label: '다음 생일이면', value: `${P.catAge(y + 1)}세` }])}
${lead(kind === 'dog' ? `강아지 ${y}살은 사람으로 치면 소형견 <b>${h}세</b>, 중형견 ${hm}세, 대형견 ${hl}세 정도입니다. 큰 개일수록 빨리 늙어 같은 나이라도 사람 나이가 높습니다. 소형견 기준으로 ${P.petStage('dog', y, 'small')}.` : `고양이 ${y}살은 사람으로 치면 약 <b>${h}세</b>입니다. 첫 두 해에 24세까지 자라고 그 뒤로는 해마다 4세씩 더합니다. ${P.petStage('cat', y)}.`)}
${ageForm(kind, y)}
${section('나이별', kind === 'dog' ? '소형 · 중형 · 대형' : '사람 나이', table(kind === 'dog' ? ['나이', '소형견', '중형견', '대형견'] : ['나이', '사람 나이', '시기'], YEARS.map((k) => ({ cells: kind === 'dog' ? [`<a href="${ageUrl(kind, k)}">${k}살</a>`, `${P.dogAge(k, 'small')}세`, `${P.dogAge(k, 'medium')}세`, `${P.dogAge(k, 'large')}세`] : [`<a href="${ageUrl(kind, k)}">${k}살</a>`, `${P.catAge(k)}세`, P.petStage('cat', k).split(' —')[0]], cls: k === y ? 'on' : '' }))))}
${ad()}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>"1년 = 7살"은 틀린 공식입니다.</b> ${kindName(kind)}는 첫 1~2년에 성장을 거의 끝내기 때문에 어릴 때는 훨씬 빨리, 그 뒤로는 천천히 나이를 먹습니다. 그래서 1살을 15세, 2살을 24세로 봅니다.</p>
${kind === 'dog' ? '<p><b>큰 개가 더 빨리 늙습니다.</b> 대형견은 7세부터 노령견 관리(연 2회 검진, 관절·심장)를 시작하고, 소형견은 10세 무렵부터입니다.</p><p><b>2019년 UCSD 연구</b>는 DNA 메틸화로 사람 나이 = 16 × ln(개 나이) + 31이라는 공식을 냈습니다(래브라도 기준). 1살이 31세, 4살이 53세로 어릴 때 더 가파릅니다. 위 표와 함께 참고로 보세요.</p>' : '<p><b>실내 고양이는 15~20년</b>을 삽니다. 11세부터 노령묘로 보고 신장·갑상선·치아 검진을 6개월마다 권합니다.</p>'}
</div>`)}
${section('이어서', null, list([{ href: `/pet/${kind}-food/`, title: `${kindName(kind)} 사료량 계산`, sub: '몸무게·상태별 하루 그램' }, { href: `/pet/${kind}-vaccine/`, title: `${kindName(kind)} 예방접종 일정`, sub: '생일로 날짜 · 캘린더 파일' }, { href: `/pet/${kind === 'dog' ? 'cat' : 'dog'}-age/`, title: `${kindName(kind === 'dog' ? 'cat' : 'dog')} 나이 환산`, sub: '' }]))}
${NOTE('미국수의사회(AVMA) 지침(중형견 기준 1살 15세·2살 24세·이후 해마다 5세)을 크기별 4·5·6세로 나눈 통용 공식입니다. 품종·건강 상태에 따라 다릅니다.')}`;
      write(url, shell({ url, title, desc, body, nav: 'pet', scripts: ['/js/engine.js', '/js/live.js'] }));
    }
    write(`/pet/${kind}-age/`, shell({ url: `/pet/${kind}-age/`, title: kind === 'dog' ? '강아지 나이 계산기 — 사람 나이로 환산 (소형·중형·대형견 표)' : '고양이 나이 계산기 — 사람 나이로 환산 (1~25살 표)', desc: kind === 'dog' ? '강아지 나이를 사람 나이로 바꿉니다. 1살 15세, 2살 24세, 이후 소형견 4세·중형견 5세·대형견 6세씩. 1~20살 표와 노령견 시기.' : '고양이 나이를 사람 나이로 바꿉니다. 1살 15세, 2살 24세, 이후 해마다 4세씩. 1~25살 표와 노령묘 시기.', nav: 'pet', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/pet/', '반려동물'], [null, `${kindName(kind)} 나이`]])}
<h1 class="title">${kindName(kind)} 나이 → 사람 나이</h1>
<p class="meta">1살 = 15세 · 2살 = 24세 · 이후 ${kind === 'dog' ? '크기별 4·5·6세씩' : '해마다 4세씩'}</p>
${ageForm(kind, 5)}
${lead(kind === 'dog' ? '강아지 5살은 소형견 기준 사람 36세입니다. 나이를 누르면 크기별 환산과 그 시기에 챙길 것이 나옵니다.' : '고양이 5살은 사람 36세입니다. 나이를 누르면 환산과 그 시기에 챙길 것이 나옵니다.')}
${section('나이별', null, wrapChips(YEARS.map((k) => ({ label: `${k}살`, href: ageUrl(kind, k) }))))}
${ad()}
${section('이어서', null, list([{ href: `/pet/${kind}-food/`, title: `${kindName(kind)} 사료량`, sub: '몸무게별' }, { href: `/pet/${kind}-vaccine/`, title: `${kindName(kind)} 예방접종 일정`, sub: '캘린더 파일' }]))}` }));
  }

  /* ---------- 사료량 ---------- */
  const foodUrl = (kind, kg) => `/pet/${kind}-food/${kg}/`;
  const foodForm = (kind, kg) => { const F = kind === 'cat' ? P.CAT_FACTORS : P.DOG_FACTORS; return `<form class="quick live" data-live="petfood" data-kind="${kind}" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>RER × 상태 계수</span></div><div class="ye-grid"><label class="ye-f"><span>몸무게 (kg)</span><input data-k="kg" type="text" inputmode="decimal" value="${kg}"></label><label class="ye-f"><span>상태</span><select data-k="factor">${F.map((f) => `<option value="${f.key}">${f.label} (×${f.f})</option>`).join('')}</select></label><label class="ye-f"><span>사료 열량 (kcal/100g)</span><input data-k="kcal" type="text" inputmode="numeric" value="${P.KCAL_PER_100G}"></label></div><div class="tiles"><div class="tile"><small>하루 사료</small><span class="num" data-out="grams"></span></div><div class="tile"><small>하루 열량 (DER)</small><span class="num" data-out="der"></span></div><div class="tile"><small>한 끼 (하루 2번 / 3번)</small><span class="num" data-out="meal"></span></div></div></form>`; };
  for (const kind of ['dog', 'cat']) {
    const KGS = kind === 'dog' ? DOG_KG : CAT_KG, F = kind === 'cat' ? P.CAT_FACTORS : P.DOG_FACTORS;
    for (const kg of KGS) {
      const url = foodUrl(kind, kg), r = P.petFood(kind, kg, 'neutered');
      const title = `${kindName(kind)} ${kg}kg 하루 사료량 — 약 ${r.grams}g (${num(r.der)}kcal · 중성화 ${kind === 'cat' ? '성묘' : '성견'} 기준), 상태별 표`;
      const desc = `몸무게 ${kg}kg ${kindName(kind)}의 하루 사료량은 중성화 ${kind === 'cat' ? '성묘' : '성견'} 기준 약 ${r.grams}g(${num(r.der)}kcal, 사료 100g당 ${P.KCAL_PER_100G}kcal)입니다. 기초 열량 RER ${num(r.rer)}kcal에 상태 계수를 곱해 계산합니다. ${kind === 'cat' ? '아기 고양이' : '강아지'}·노령·감량 중 표.`;
      const body = `
${crumb([['/pet/', '반려동물'], [`/pet/${kind}-food/`, `${kindName(kind)} 사료량`], [null, `${kg}kg`]])}
<h1 class="title">${kindName(kind)} ${kg}kg 하루 사료량</h1>
<p class="meta">RER = 70 × 몸무게^0.75 · 하루 열량 = RER × 상태 계수 · 사료 100g당 ${P.KCAL_PER_100G}kcal 기준</p>
${tiles([{ label: '하루 사료 (중성화 성체)', value: `${r.grams}g` }, { label: '하루 열량', value: `${num(r.der)}kcal` }, { label: '기초 열량 RER', value: `${num(r.rer)}kcal` }])}
${lead(`몸무게 ${kg}kg ${kindName(kind)}가 가만히 있어도 쓰는 기초 열량(RER)은 ${num(r.rer)}kcal이고, 중성화한 성체는 여기에 계수 ${r.factor.f}를 곱한 <b>${num(r.der)}kcal</b>, 사료로는 하루 약 <b>${r.grams}g</b>(두 끼면 ${r.perMeal2}g씩)입니다. 사료 봉지의 100g당 열량이 다르면 아래 계산기에 넣으세요.`)}
${foodForm(kind, kg)}
${section('상태별 하루 사료량', `${kg}kg · 100g당 ${P.KCAL_PER_100G}kcal`, table(['상태', '계수', '하루 열량', '사료'], F.map((f) => { const x = P.petFood(kind, kg, f.key); return { cells: [f.label, `×${f.f}`, `${num(x.der)}kcal`, `${x.grams}g`], cls: f.key === 'neutered' ? 'on' : '' }; })))}
${ad()}
${section('몸무게별', '중성화 성체', wrapChips(KGS.map((k) => ({ label: `${k}kg`, href: foodUrl(kind, k), on: k === kg }))))}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>봉지 뒷면 급여표보다 이 계산이 보통 적게 나옵니다.</b> 급여표는 활동량 많은 개체 기준이라 실내 반려동물은 10~20% 과식하기 쉽습니다. 계산값에서 시작해 2주마다 몸무게를 재고 조절하세요.</p>
<p><b>갈비뼈가 만져지되 보이지 않으면 적정 체형(BCS 4~5/9)</b>입니다. 살이 찌면 "실내·살찌기 쉬움" 계수로, 빼야 하면 "체중 감량 중" 계수로 바꿉니다.</p>
<p><b>간식은 하루 열량의 10% 이내.</b> 간식을 주면 그만큼 사료를 빼세요. 사료 열량은 봉지의 "대사에너지(ME) kcal/kg"을 10으로 나누면 100g당 값입니다(3,700kcal/kg → 370).</p>
</div>`)}
${section('이어서', null, list([{ href: `/pet/${kind}-age/`, title: `${kindName(kind)} 나이 환산`, sub: '사람 나이로' }, { href: `/pet/${kind}-vaccine/`, title: `${kindName(kind)} 예방접종 일정`, sub: '캘린더 파일' }, { href: '/food/', title: '사람 음식 칼로리', sub: `치킨 한 조각은 ${kindName(kind)}에게 너무 많습니다` }]))}
${NOTE('RER·DER 계산은 WSAVA 영양 가이드라인의 일반 공식이며 계수는 개체·품종·질환에 따라 수의사가 조정합니다.')}`;
      write(url, shell({ url, title, desc, body, nav: 'pet', scripts: ['/js/engine.js', '/js/live.js'] }));
    }
    write(`/pet/${kind}-food/`, shell({ url: `/pet/${kind}-food/`, title: `${kindName(kind)} 사료량 계산기 — 몸무게·상태별 하루 급여량 (g·kcal)`, desc: `${kindName(kind)} 몸무게와 상태(중성화·${kind === 'cat' ? '아기 고양이' : '강아지'}·노령·감량)를 넣으면 하루 열량과 사료 그램이 나옵니다. RER 70×kg^0.75 공식, ${kind === 'dog' ? '1~50' : '1~12'}kg 표.`, nav: 'pet', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/pet/', '반려동물'], [null, `${kindName(kind)} 사료량`]])}
<h1 class="title">${kindName(kind)} 하루 사료량</h1>
<p class="meta">RER = 70 × 몸무게^0.75 · 상태 계수 · 사료 열량</p>
${foodForm(kind, kind === 'dog' ? 5 : 4)}
${lead(`몸무게를 누르면 상태별 하루 사료량 표가 나옵니다. 기본값은 사료 100g당 ${P.KCAL_PER_100G}kcal(건사료 평균)이며 봉지의 열량으로 바꿔 넣으면 정확해집니다.`)}
${section('몸무게별 (중성화 성체)', 'kcal · g', table(['몸무게', '하루 열량', '사료'], KGS.map((k) => { const x = P.petFood(kind, k, 'neutered'); return { cells: [`<a href="${foodUrl(kind, k)}">${k}kg</a>`, `${num(x.der)}kcal`, `${x.grams}g`] }; })))}
${ad()}
${section('이어서', null, list([{ href: `/pet/${kind}-age/`, title: `${kindName(kind)} 나이 환산`, sub: '' }, { href: `/pet/${kind}-vaccine/`, title: `${kindName(kind)} 예방접종 일정`, sub: '' }]))}` }));
  }

  /* ---------- 예방접종 (생일별, 최근 1년) ---------- */
  const vacUrl = (kind, dt) => `/pet/${kind}-vaccine/${D.iso(dt)}/`;
  const vacForm = (kind, dt) => `<form class="quick live" data-live="petvac" data-kind="${kind}" style="margin-top:14px"><div class="live-head"><b>직접 계산</b><span>생일을 바꾸면 바로</span></div><div class="ye-grid"><label class="ye-f"><span>${kindName(kind)} 생년월일</span><input data-k="birth" type="date" value="${D.iso(dt)}"></label></div><div class="tiles"><div class="tile"><small>지금</small><span class="num" data-out="age"></span></div><div class="tile"><small>다음 접종</small><span class="num" data-out="next"></span></div><div class="tile"><small>심장사상충 예방 시작</small><span class="num" data-out="hw"></span></div></div><div class="live-foot"><a data-out="link" href="/pet/${kind}-vaccine/">일정 표 →</a><a data-out="ics" href="/pet/${kind}-vaccine/">캘린더 파일(.ics) 받기 →</a></div></form>`;
  const dates = []; for (let k = 365; k >= 0; k--) dates.push(D.addDays(TODAY, -k));
  for (const kind of ['dog', 'cat']) {
    for (const birth of dates) {
      const url = vacUrl(kind, birth), vac = P.petVaccineDates(kind, birth);
      const rows = []; for (const v of vac) for (const ds of v.doses) rows.push({ dt: ds.date, cells: [v.name, ds.label, D.fmt(ds.date), `<a href="${I.gcalUrl(`🐾 ${v.name} ${ds.label}`, ds.date, '동물병원 일반 일정 · 실제 접종은 수의사와 상의', `https://bodyzip.com${url}`)}" target="_blank" rel="noopener" title="구글 캘린더에 추가">＋</a>`], past: ds.date < TODAY, name: v.name, label: ds.label });
      rows.sort((a, b) => a.dt - b.dt);
      const nextDose = rows.find((r) => r.dt >= TODAY);
      const ageDays = D.diffDays(birth, TODAY), weeks = Math.floor(ageDays / 7);
      fs.mkdirSync(path.join(OUT, url), { recursive: true }); fs.writeFileSync(path.join(OUT, url, 'vaccines.ics'), I.petIcs(kind, birth, { now: TODAY }));
      const title = `${D.fmt(birth)}생 ${kindName(kind)} 예방접종 일정 — 오늘 ${weeks}주, 다음 ${nextDose ? `${nextDose.name.startsWith('연간') ? '' : '접종 '}${nextDose.name.split(' (')[0]} ${D.fmtShort(nextDose.dt)}` : '연간 추가 접종'}`;
      const desc = `${D.fmt(birth)}에 태어난 ${kindName(kind)}는 ${D.fmtShort(TODAY)} 기준 생후 ${weeks}주(${num(ageDays)}일)입니다. ${kind === 'dog' ? '종합백신 5회·코로나·켄넬코프·인플루엔자·광견병' : '종합백신 3회·백혈병·광견병'} 날짜와 심장사상충 예방 시작일, 연간 추가 접종. 캘린더 파일로 저장.`;
      const body = `
${crumb([['/pet/', '반려동물'], [`/pet/${kind}-vaccine/`, `${kindName(kind)} 예방접종`], [null, D.fmt(birth)]])}
<h1 class="title">${D.fmt(birth)}생 ${kindName(kind)}</h1>
<p class="meta">${D.fmtShort(TODAY)} 기준 생후 ${weeks}주 · 국내 동물병원 일반 일정 · 실제 일정은 수의사와 상의</p>
${vacForm(kind, birth)}
${lead(`${D.fmt(birth)}에 태어난 ${kindName(kind)}는 오늘 생후 <b>${weeks}주</b>입니다. ${kind === 'dog' ? '종합백신은 6주부터 2주 간격으로 5회, 광견병은 16주에 맞고' : '종합백신은 8주부터 3주 간격으로 3회, 광견병은 16주에 맞고'} 심장사상충 예방약은 ${D.fmtShort(P.heartwormStart(birth))}(8주)부터 매달 먹이거나 바릅니다. 아래 표를 캘린더 파일로 받으면 하루 전 알림이 옵니다.`)}
${section('접종 일정', '지난 접종은 흐리게 · ＋는 구글 캘린더에 하나씩', `<div class="tbl"><table><thead><tr><th>백신</th><th>시기</th><th>날짜</th><th>캘린더</th></tr></thead><tbody>${rows.map((r) => `<tr${r.past ? ' style="color:var(--ghost)"' : ''}>${r.cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)}
<div class="cal-box">
  <div class="cal-head"><b>캘린더에 한 번에 넣기</b><span>접종 · 심장사상충 매달 · 연간 추가 접종 · 중성화 상담</span></div>
  ${nextDose ? `<p class="cal-next">다음 접종 <b>${nextDose.name.split(' (')[0]} ${nextDose.label}</b> · ${D.fmt(nextDose.dt)} (${D.diffDays(TODAY, nextDose.dt) === 0 ? '오늘' : `D-${D.diffDays(TODAY, nextDose.dt)}`})</p>` : ''}
  <div class="btn-row"><a class="btn" href="${url}vaccines.ics">캘린더 파일 받기 (.ics)</a></div>
  <p class="cal-how"><b>아이폰</b> 파일을 열면 캘린더에 "모두 추가" · <b>안드로이드</b> 내려받은 파일을 구글 캘린더 앱으로 열기 · <b>PC</b> calendar.google.com ▸ 설정 ▸ 가져오기.</p>
</div>
${ad()}
${section('알아두면 좋은 것', null, `<div class="doc">
<p><b>접종 뒤 2~3일은 목욕·산책을 쉬고</b> 얼굴 붓기·구토·무기력이 보이면 바로 병원에 연락하세요. 접종 당일은 병원 근처에서 30분 정도 기다렸다 가는 것이 안전합니다.</p>
<p><b>산책은 기초 접종이 끝난 뒤</b>(${kind === 'dog' ? '보통 16주 접종 후 1~2주' : '실내 고양이는 외출 없이도 접종 필요'}). 그 전에는 안고 나가 바깥 소리와 냄새에 익숙해지게 합니다.</p>
<p><b>심장사상충·외부기생충 예방약은 평생 매달.</b> 모기가 없는 겨울에도 거르지 않는 것이 국내 수의사들의 권고입니다. 중성화는 ${kind === 'dog' ? '6개월(대형견은 성장이 끝난 뒤)' : '5개월'} 무렵 상담합니다.</p>
</div>`)}
${section('이어서', null, list([{ href: `/pet/${kind}-food/`, title: `${kindName(kind)} 사료량`, sub: '몸무게별' }, { href: `/pet/${kind}-age/`, title: `${kindName(kind)} 나이 환산`, sub: '사람 나이로' }, { href: '/baby/', title: '아기 예방접종 일정', sub: '사람 아기는 이쪽' }]))}
<p class="note">국내 동물병원에서 흔히 쓰는 일정을 정리한 참고 자료입니다. 백신 종류·간격은 병원과 지역, 동물의 건강 상태에 따라 다르며 수의사의 판단이 우선합니다.</p>`;
      /* 생일별 접종 페이지(강아지·고양이 732장)는 날짜만 다른 부가 페이지라 검색에서 뺀다(2026-09-13) — 허브 /pet/*-vaccine/ 는 색인 */
      write(url, shell({ url, title, desc, body, nav: 'pet', noindex: true, scripts: ['/js/engine.js', '/js/live.js'] }));
    }
    const byMonth = {};
    for (const dt of dates) { const k = `${dt.getUTCFullYear()}년 ${dt.getUTCMonth() + 1}월`; (byMonth[k] = byMonth[k] || []).push(dt); }
    write(`/pet/${kind}-vaccine/`, shell({ url: `/pet/${kind}-vaccine/`, title: `${kindName(kind)} 예방접종 시기 계산기 — 생일로 날짜 · 캘린더 파일 · 심장사상충`, desc: `${kindName(kind)} 생년월일을 넣으면 ${kind === 'dog' ? '종합백신·코로나·켄넬코프·인플루엔자·광견병' : '종합백신·백혈병·광견병'} 접종 날짜와 심장사상충 예방 시작일, 연간 추가 접종이 나오고 캘린더 파일(.ics)로 저장할 수 있습니다.`, nav: 'pet', scripts: ['/js/engine.js', '/js/live.js'], body: `
${crumb([['/pet/', '반려동물'], [null, `${kindName(kind)} 예방접종`]])}
<h1 class="title">${kindName(kind)} 예방접종 일정</h1>
<p class="meta">생일로 · ${kind === 'dog' ? '6주부터 2주 간격 5회' : '8주부터 3주 간격 3회'} · 광견병 16주 · 연간 추가 접종 · 캘린더 파일</p>
${vacForm(kind, D.addDays(TODAY, -60))}
${lead(`생일을 넣으면 접종 날짜와 다음 접종, 심장사상충 예방 시작일이 나오고 캘린더 파일로 받을 수 있습니다. 최근 1년 안에 태어났다면 아래에서 생일을 눌러 전체 표를 보세요.`)}
${section('표준 일정', null, table(['백신', '시기'], (kind === 'dog' ? P.DOG_VACCINES : P.CAT_VACCINES).map((v) => ({ cells: [v.name, v.weeks.map((w) => `${w}주`).join(' · ') + (v.yearly ? ' · 이후 매년' : '')] }))))}
${Object.entries(byMonth).map(([k, l]) => section(k, null, `<div class="chips" style="flex-wrap:wrap;overflow:visible">${l.map((dt) => `<a class="chip" style="min-width:0;padding:4px 8px" href="${vacUrl(kind, dt)}">${dt.getUTCDate()}일</a>`).join('')}</div>`)).join('\n')}
${ad()}` }));
  }

  /* ---------- 반려 인덱스 ---------- */
  write('/pet/', shell({ url: '/pet/', title: '반려동물 계산 사전 — 강아지·고양이 나이 환산, 사료량, 예방접종 일정과 캘린더', desc: '강아지·고양이 나이를 사람 나이로, 몸무게별 하루 사료량, 생일로 예방접종·심장사상충 날짜를 계산하고 캘린더 파일로 저장합니다.', nav: 'pet', body: `
${crumb([['/', '홈'], [null, '반려동물']])}
<h1 class="title">반려동물</h1>
<p class="meta">나이 환산 · 사료량 · 예방접종 캘린더</p>
${lead(`강아지 5살은 사람 ${P.dogAge(5, 'small')}세, 5kg 강아지(중성화)의 하루 사료는 약 ${P.petFood('dog', 5, 'neutered').grams}g. 생일을 넣으면 예방접종 날짜가 나오고 캘린더에 한 번에 넣을 수 있습니다.`)}
${section('강아지', null, `<div class="dict">
<a href="/pet/dog-age/"><b>강아지 나이</b><span>5살 → 소형견 <span class="num">${P.dogAge(5, 'small')}</span>세 · 대형견 ${P.dogAge(5, 'large')}세</span></a>
<a href="/pet/dog-food/"><b>강아지 사료량</b><span>5kg 중성화 → 하루 <span class="num">${P.petFood('dog', 5, 'neutered').grams}</span>g</span></a>
<a href="/pet/dog-vaccine/"><b>강아지 예방접종</b><span>6·8·10·12·14주 종합백신 · 16주 광견병 · 캘린더 파일</span></a>
</div>`)}
${section('고양이', null, `<div class="dict">
<a href="/pet/cat-age/"><b>고양이 나이</b><span>5살 → 사람 <span class="num">${P.catAge(5)}</span>세</span></a>
<a href="/pet/cat-food/"><b>고양이 사료량</b><span>4kg 중성화 → 하루 <span class="num">${P.petFood('cat', 4, 'neutered').grams}</span>g</span></a>
<a href="/pet/cat-vaccine/"><b>고양이 예방접종</b><span>8·11·14주 종합백신 · 16주 광견병 · 캘린더 파일</span></a>
</div>`)}
${ad()}
<p class="note">환산표·급여 공식·접종 일정은 일반적인 기준이며 품종·건강 상태에 따라 수의사가 조정합니다.</p>` }));
}
