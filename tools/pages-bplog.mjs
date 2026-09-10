/* 혈압 기록 — /bp/log/ (집에서 잰 혈압을 기기에만 저장 · 7일 평균 · 아침/저녁 평균 · 그래프 · 진료용 요약) */
import { BP_LEVELS } from '../engine/checkup.mjs';
import { HOME_LIMIT } from '../engine/bplog.mjs';

export function buildBpLog(ctx) {
  const { write, shell, crumb, list, section, lead, ad } = ctx;
  const CRISIS = BP_LEVELS.find((x) => x.key === 'crisis').note.replace('180/120 이상입니다. ', '');
  const [HS, HD] = HOME_LIMIT;
  const body = `
${crumb([['/checkup/', '건강검진 해석'], ['/bp/', '혈압'], [null, '혈압 기록']])}
<h1 class="title">혈압 기록</h1>
<p class="meta">집에서 잰 혈압 · 최근 7일 평균 · 아침과 저녁 비교 · 이 기기에만 저장</p>
<form class="quick live" data-live="bplog" style="margin-top:14px">
<div class="live-head"><b>혈압 넣기</b><span>아침·저녁 2번씩</span></div>
<div class="ye-grid">
<label class="ye-f"><span>날짜</span><input data-k="date" type="date"></label>
<label class="ye-f"><span>시각</span><input data-k="time" type="time"></label>
<label class="ye-f"><span>수축기 (위 숫자)</span><input data-k="s" type="text" inputmode="numeric" placeholder="128"></label>
<label class="ye-f"><span>이완기 (아래 숫자)</span><input data-k="d" type="text" inputmode="numeric" placeholder="82"></label>
<label class="ye-f"><span>맥박 (선택)</span><input data-k="p" type="text" inputmode="numeric" placeholder="70"></label>
<label class="ye-f"><span>시간대</span><select data-k="slot"><option value="">시각으로 자동</option><option value="am">아침</option><option value="pm">저녁</option><option value="etc">낮·기타</option></select></label>
</div>
<div class="btn-row"><button type="button" class="btn" data-act="add">기록 추가</button><button type="button" class="btn btn-share" data-act="clear">전부 지우기</button></div>
<p class="sub" style="margin-top:8px" data-out="msg"></p>
<div class="tiles"><div class="tile"><small>최근 7일 평균</small><span class="num" data-out="avg">—</span></div><div class="tile"><small>아침 평균</small><span class="num" data-out="am">—</span></div><div class="tile"><small>저녁 평균</small><span class="num" data-out="pm">—</span></div></div>
<p class="sub" style="margin-top:8px" data-out="verdict"></p>
<div class="chart" data-out="chart"></div>
<div class="tbl" style="margin-top:12px"><table><thead><tr><th>날짜·시각</th><th>때</th><th>혈압</th><th>맥박</th><th>표시</th><th></th></tr></thead><tbody data-out="rows"></tbody></table></div>
<div class="btn-row"><button type="button" class="btn" data-act="copy">진료용 요약 복사</button><button type="button" class="btn btn-share" data-act="csv">CSV로 저장</button></div>
<p class="cal-how">기록은 이 브라우저 안에만 저장되고 서버로 보내지 않습니다. 브라우저 데이터를 지우면 함께 사라지니 가끔 CSV로 저장해 두세요.</p>
</form>
${lead(`집에서 잰 혈압은 진료실보다 긴장이 덜해 평소 혈압에 가깝습니다. 아침과 저녁에 2번씩 재서 넣으면 최근 7일 평균과 아침·저녁 평균이 나옵니다. 가정혈압은 평균 <b>${HS}/${HD}mmHg</b> 이상이면 고혈압으로 봅니다(대한고혈압학회). 진료실 기준 140/90보다 5씩 낮습니다.`)}
${section('재는 법', '아침·저녁 2번씩, 5~7일', `<div class="doc">
<p><b>아침</b>은 일어나 1시간 안, 소변을 본 뒤 약과 아침을 먹기 전에 잽니다. <b>저녁</b>은 잠자리에 들기 전에 잽니다.</p>
<p><b>재기 30분 전에는</b> 커피·담배·운동을 피하고, 등받이 있는 의자에 앉아 1~2분 쉽니다. 다리를 꼬지 말고 재는 동안 말하지 않습니다.</p>
<p><b>커프(팔에 감는 띠)는</b> 맨살 위, 심장 높이에 둡니다. 처음에는 양팔을 재 보고 더 높게 나오는 팔로 계속 잽니다.</p>
<p><b>1~2분 간격으로 2번</b> 재서 둘 다 넣습니다. 진료 전 5~7일 동안 아침·저녁으로 재면 가장 정확합니다.</p>
</div>`)}
${ad()}
${section('숫자 읽기', null, `<div class="doc">
<p><b>평균이 중요합니다.</b> 한 번 높게 나온 값보다 7일 평균을 봅니다. 평균이 ${HS}/${HD} 이상이면 기록을 들고 내과에 가세요.</p>
<p><b>아침이 저녁보다 계속 높다면</b> 진료 때 함께 알리세요.</p>
<p><b>180/120 이상이 나오면</b> ${CRISIS}</p>
<p><b>혈압약을 먹고 있다면</b> 기록을 보고 스스로 약을 줄이거나 끊지 말고 의사와 상의하세요.</p>
</div>`)}
${section('이어서', null, list([{ href: '/bp/', title: '혈압 수치표', sub: '한 번 잰 값의 판정' }, { href: '/guide/blood-pressure-home/', title: '집에서 혈압 재는 법', sub: '서재' }, { href: '/weight/', title: '체중 기록', sub: '체중 1kg에 수축기 약 1mmHg' }, { href: '/checkup/', title: '검진 결과 해석', sub: '혈당·콜레스테롤까지' }]))}
<p class="note">가정혈압 기준(${HS}/${HD}mmHg)과 재는 법은 대한고혈압학회 진료지침을 따랐습니다. 기록은 참고용이며 진단이나 치료를 대신하지 않습니다. <a href="/method/">계산 기준 보기</a></p>`;
  write('/bp/log/', shell({ url: '/bp/log/', og: 'bplog', nav: 'checkup', title: '혈압 기록 — 집에서 잰 혈압 7일 평균과 아침·저녁 비교 (기기에만 저장)', desc: '집에서 잰 혈압을 날짜·시각별로 기록하면 최근 7일 평균, 아침·저녁 평균, 그래프가 나오고 가정혈압 고혈압 기준(135/85mmHg)과 비교합니다. 진료용 요약 복사·CSV 저장. 회원 가입 없이 이 기기에만 저장됩니다.', body, scripts: ['/js/engine.js', '/js/bp-log.js'] }));
}
