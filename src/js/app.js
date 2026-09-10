/* 바디집 — 페이지 스크립트 (정적 사이트)
 * 1) 스마트 검색: "키 170 몸무게 65", "치킨 칼로리", "출산예정일 3월 5일", "아기 2025-01-31" → 알맞은 페이지
 * 2) 빠른 찾기 폼, 변형 토글, 복사 버튼 */
(function () {
  var G = window.BODYZIP_GRID || {};
  function nearest(arr, v) { if (!arr || !arr.length) return v; return arr.reduce(function (a, b) { return Math.abs(b - v) < Math.abs(a - v) ? b : a; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* 이름·별칭 가운데 가장 긴 것이 검색어에 들어 있는 항목 — 같은 길이면 앞 항목 */
  function best(items, t) {
    var hit = null, len = 0;
    (items || []).forEach(function (it) { (it.ks || []).forEach(function (k) { if (k && t.indexOf(k) >= 0 && k.length > len) { hit = it; len = k.length; } }); });
    return hit;
  }

  function parseSmart(s) {
    var t = (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!t) return null;
    var nums = (t.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    // 날짜: 3월 5일 / 3/5 / 2025-01-31
    var ymd = t.match(/(20\d\d)[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/);
    var md = t.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/) || t.match(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?:\s|$)/);
    if (/오늘\s*먹은|칼로리\s*담|담기|식단\s*기록|하루\s*칼로리\s*계산/.test(t)) return { href: '/today/', label: '오늘 먹은 칼로리 담기' };
    if (/체중\s*기록|몸무게\s*기록|체중\s*그래프|다이어트\s*기록/.test(t)) return { href: '/weight/', label: '체중 기록 그래프' };
    // 분유 수유량 — "2개월 분유량", "생후 3주 분유", "5kg 분유량", "100일 분유량", "신생아 분유량"
    if (/분유|수유\s*량|수유\s*양|젖병/.test(t)) {
      var fk = t.match(/(\d+(?:\.\d+)?)\s*(?:kg|킬로|키로)/), fw = t.match(/(\d{1,2})\s*주/), fm = t.match(/(\d{1,2})\s*개월/), fd = t.match(/(\d{1,3})\s*일/);
      if (fk) { var fkk = Math.max(2.5, Math.min(9, Math.round(+fk[1] * 2) / 2)); return { href: '/baby/formula/kg/' + fkk + '/', label: fkk + 'kg 아기 분유량' }; }
      if (fw && +fw[1] >= 1 && +fw[1] <= 8) return { href: '/baby/formula/week/' + (+fw[1]) + '/', label: '생후 ' + (+fw[1]) + '주 분유량' };
      if (fm) { var fmm = Math.max(0, Math.min(12, +fm[1])); return { href: '/baby/formula/' + fmm + '/', label: (fmm ? '생후 ' + fmm + '개월' : '신생아') + ' 분유량' }; }
      if (fd) { var fdd = +fd[1]; if (fdd < 7) return { href: '/baby/formula/0/', label: '신생아 첫 주 분유량' }; if (fdd < 60) return { href: '/baby/formula/week/' + Math.max(1, Math.min(8, Math.round(fdd / 7))) + '/', label: '생후 ' + fdd + '일 무렵 분유량' }; var fdm = Math.min(12, Math.floor(fdd / 30.4375)); return { href: '/baby/formula/' + fdm + '/', label: '생후 ' + fdd + '일 무렵 분유량' }; }
      if (/신생아/.test(t)) return { href: '/baby/formula/0/', label: '신생아 분유량' };
      if (/돌|12\s*개월/.test(t)) return { href: '/baby/formula/12/', label: '돌 아기 분유와 우유' };
      return { href: '/baby/formula/', label: '분유 수유량 계산기' };
    }
    // 아이 키 백분위 — "초3 평균 키", "중2 여자 몸무게", "10살 키 140", "만 7세 키"
    var ksex = /여자|여아|딸|소녀/.test(t) ? 'girl' : 'boy', ksn = ksex === 'girl' ? '여자' : '남자';
    if (!/임신|개월|주차|강아지|고양이|반려/.test(t)) {
      var kgr = t.match(/(초|중|고)(?:등학교|학교|등)?\s*([1-6])\s*(?:학년)?/);
      if (kgr && /키|몸무게|체중|평균|백분위|성장/.test(t)) { var gi = +kgr[2], gp = kgr[1] === '초' ? 'e' : kgr[1] === '중' ? 'm' : 'h'; if (gp === 'e' || gi <= 3) return { href: '/kids/grade/' + gp + gi + '-' + ksex + '/', label: kgr[1] + gi + ' ' + ksn + ' 평균 키·몸무게' }; }
      var kag = t.match(/(?:만\s*)?(\d{1,2})\s*(?:살|세)/);
      if (kag && +kag[1] >= 3 && +kag[1] <= 18 && /키|몸무게|체중|평균|백분위|성장|또래/.test(t) && !/아빠|엄마|부모/.test(t)) {
        var ky = +kag[1], kh = nums.filter(function (x) { return x >= 70 && x <= 200; })[0], kr = (G.kidsRange || {})[ksex + ky];
        if (kh && kr && Math.round(kh) >= kr[0] && Math.round(kh) <= kr[1]) return { href: '/kids/' + ky + '-' + ksex + '/' + Math.round(kh) + '/', label: '만 ' + ky + '세 ' + ksn + ' 키 ' + Math.round(kh) + 'cm 백분위' };
        return { href: '/kids/' + ky + '-' + ksex + '/', label: '만 ' + ky + '세 ' + ksn + '아이 평균 키·몸무게' };
      }
    }
    // 건강검진 수치
    if (/혈압/.test(t)) { var bpn = (t.match(/\d{2,3}/g) || []).map(Number).filter(function (x) { return x >= 40 && x <= 200; }); if (bpn.length >= 2) { var bs = nearest(G.sys || [bpn[0]], bpn[0]), bd = nearest(G.dia || [bpn[1]], bpn[1]); return { href: '/bp/' + bs + '-' + bd + '/', label: '혈압 ' + bs + '/' + bd + ' 판정' }; } return { href: '/bp/', label: '혈압 정상 수치' }; }
    if (/공복\s*혈당|혈당|당뇨/.test(t) && !/당화/.test(t)) { var gn = nums.filter(function (x) { return x >= 50 && x <= 300; }); if (gn.length) return { href: '/glucose/' + nearest(G.glu || [gn[0]], gn[0]) + '/', label: '공복혈당 ' + gn[0] + ' 판정' }; return { href: '/glucose/', label: '공복혈당 정상 수치' }; }
    if (/ldl|엘디엘|나쁜\s*콜레스테롤/.test(t)) { var ln = nums.filter(function (x) { return x >= 30 && x <= 300; }); if (ln.length) return { href: '/ldl/' + nearest(G.ldl || [ln[0]], ln[0]) + '/', label: 'LDL ' + ln[0] + ' 판정' }; return { href: '/ldl/', label: 'LDL 정상 수치' }; }
    if (/hdl|에이치디엘|좋은\s*콜레스테롤/.test(t)) { var hn = nums.filter(function (x) { return x >= 10 && x <= 150; }); if (hn.length) return { href: '/hdl/' + nearest(G.hdl || [hn[0]], hn[0]) + '/', label: 'HDL ' + hn[0] + ' 판정' }; return { href: '/hdl/', label: 'HDL 정상 수치' }; }
    if (/중성지방|트리글리/.test(t)) { var tn = nums.filter(function (x) { return x >= 20 && x <= 900; }); if (tn.length) return { href: '/triglyceride/' + nearest(G.tg || [tn[0]], tn[0]) + '/', label: '중성지방 ' + tn[0] + ' 판정' }; return { href: '/triglyceride/', label: '중성지방 정상 수치' }; }
    if (/콜레스테롤/.test(t)) { var cn = nums.filter(function (x) { return x >= 80 && x <= 400; }); if (cn.length) return { href: '/cholesterol/' + nearest(G.tc || [cn[0]], cn[0]) + '/', label: '총콜레스테롤 ' + cn[0] + ' 판정' }; return { href: '/cholesterol/', label: '콜레스테롤 정상 수치' }; }
    if (/간\s*수치|ast|alt|sgot|sgpt|지방간|감마지티피|간\s*효소/.test(t)) { var an = nums.filter(function (x) { return x >= 3 && x <= 400; }); if (an.length) return { href: '/liver/' + nearest(G.alt || [an[0]], an[0]) + '/', label: '간수치 ' + an[0] + ' 판정' }; return { href: '/liver/', label: '간수치 정상 범위' }; }
    if (/요산|통풍/.test(t)) { var un = nums.filter(function (x) { return x >= 1 && x <= 20; }); if (un.length) return { href: '/uric/' + nearest(G.uric || [un[0]], un[0]) + '/', label: '요산 ' + un[0] + ' 판정' }; return { href: '/uric/', label: '요산 정상 수치' }; }
    if (/건강검진|검진\s*결과|당화혈색소|검진표|결과지/.test(t)) return { href: '/checkup/', label: '건강검진 결과 해석' };
    if (/아기\s*카드|돌\s*카드|백일\s*카드|100일\s*카드|기념일\s*카드/.test(t)) return { href: '/baby/card/', label: '아기 100일·돌 카드' };
    if (/디데이|d-?day|카드/.test(t) && !/아기\s*카드/.test(t)) return { href: '/pregnancy/card/', label: '임신 디데이 카드 만들기' };
    if (/백분위|또래|성장\s*곡선|성장\s*도표/.test(t)) { var ps = /여아|여자|딸/.test(t) ? 'girl' : 'boy', pmm = t.match(/(\d{1,2})\s*개월/); if (pmm) { var pm2 = Math.max(0, Math.min(36, +pmm[1])); return { href: '/baby/percentile/' + ps + '/' + pm2 + '/', label: (ps === 'girl' ? '여아 ' : '남아 ') + pm2 + '개월 백분위표' }; } return /초등|중학|고등|청소년|학년|아이\s*키|어린이/.test(t) ? { href: '/kids/', label: '아이 키 백분위 계산 (3~18세)' } : { href: '/baby/percentile/', label: '아기 성장 백분위 계산' }; }
    if (/강아지|반려견|고양이|냥이|반려묘|사료|반려\s*동물|개\s*나이|멍멍/.test(t)) {
      var pk = /고양이|냥이|반려묘/.test(t) ? 'cat' : 'dog', pn = pk === 'cat' ? '고양이 ' : '강아지 ';
      if (/사료|급여|밥\s*양/.test(t)) { var km = t.match(/(\d+(?:\.\d+)?)\s*(?:kg|킬로|키로)/), rg = pk === 'cat' ? (G.catKg || [1, 12]) : (G.dogKg || [1, 50]); if (km) { var kk = Math.max(rg[0], Math.min(rg[1], Math.round(+km[1]))); return { href: '/pet/' + pk + '-food/' + kk + '/', label: pn + kk + 'kg 하루 사료량' }; } return { href: '/pet/' + pk + '-food/', label: pn + '사료량 계산' }; }
      if (/접종|백신|심장사상충|예방/.test(t)) { if (ymd) return { href: '/pet/' + pk + '-vaccine/' + ymd[1] + '-' + pad(+ymd[2]) + '-' + pad(+ymd[3]) + '/', label: pn + '예방접종 일정' }; return { href: '/pet/' + pk + '-vaccine/', label: pn + '예방접종 일정' }; }
      var ym = t.match(/(\d{1,2})\s*(?:살|세|년)/); if (ym) { var yr = pk === 'cat' ? (G.catYears || [1, 25]) : (G.dogYears || [1, 20]), yy = Math.max(yr[0], Math.min(yr[1], +ym[1])); return { href: '/pet/' + pk + '-age/' + yy + '/', label: pn + yy + '살은 사람 나이로' }; }
      return { href: '/pet/', label: '반려동물 계산' };
    }
    if (/카페인/.test(t)) { var ck = /믹스/.test(t) ? 'mix' : /캔커피/.test(t) ? 'canned' : /에너지|몬스터|레드불|핫식스/.test(t) ? 'energy' : /콜라/.test(t) ? 'cola' : /녹차/.test(t) ? 'green-tea' : /아메리카노|커피/.test(t) ? 'americano' : null, cn = t.match(/(\d+)\s*(?:잔|캔|병|봉)/); if (ck) { var cc = Math.max(1, Math.min(5, cn ? +cn[1] : 1)); return { href: '/caffeine/' + ck + '/' + cc + '/', label: cc + '잔 카페인' }; } return { href: '/caffeine/', label: '오늘 카페인 계산' }; }
    if (/금연|담배\s*끊|끊은\s*지/.test(t)) { var qd = t.match(/(\d+)\s*일/), qm = t.match(/(\d+)\s*개월/), qy = t.match(/(\d+)\s*년/), dd2 = qd ? +qd[1] : qm ? +qm[1] * 30 : qy ? +qy[1] * 365 : null; if (dd2 && G.quitDays) { var qq = nearest(G.quitDays, dd2); return { href: '/quit-smoking/' + qq + '/', label: '금연 ' + qq + '일' }; } return { href: '/quit-smoking/', label: '금연 계산기' }; }
    // 임신 N주
    var pw = t.match(/임신\s*(\d{1,2})\s*주/) || t.match(/(\d{1,2})\s*주\s*(?:차|째)?\s*(?:임신|아기|태아)/);
    if (pw) { var wn = Math.max(1, Math.min(42, +pw[1])); return { href: '/pregnancy/week/' + wn + '/', label: '임신 ' + wn + '주 아기 크기·엄마 몸·검사' }; }
    // 아기 N개월 (생년월일 없이)
    var pm = t.match(/(\d{1,2})\s*개월/);
    if (pm && !ymd && /아기|아이|발달|신생아|개월/.test(t)) { var mo = nearest(G.months || [+pm[1]], +pm[1]); return { href: '/baby/month/' + mo + '/', label: mo + '개월 아기 발달·수유·수면·접종' }; }
    if (/신생아/.test(t)) return { href: '/baby/month/0/', label: '신생아 발달·수유·수면' };
    // 걸음 수
    if (/걸음|만\s*보|천\s*보|\d\s*보(?:\s|$)|만보/.test(t)) {
      var st = null, mw = t.match(/(\d+(?:\.\d+)?)\s*만\s*보/), tw = t.match(/(\d+)\s*천\s*보/), nw = t.match(/(\d[\d,]*)\s*(?:걸음|보)/);
      if (mw) st = Math.round(+mw[1] * 10000); else if (tw) st = +tw[1] * 1000; else if (/만\s*보/.test(t)) st = 10000; else if (nw) st = +nw[1].replace(/,/g, '');
      if (st) { var rg = G.steps || [1000, 30000]; st = Math.max(rg[0], Math.min(rg[1], Math.round(st / 1000) * 1000)); return { href: '/steps/' + st + '/', label: st.toLocaleString() + '보 거리·칼로리' }; }
      return { href: '/steps/', label: '걸음 수 칼로리 계산' };
    }
    // 수면
    if (/수면|취침|기상|몇\s*시에?\s*자|자야|일어나/.test(t)) {
      var tm = t.match(/(\d{1,2})\s*시\s*(반|(\d{1,2})\s*분)?/) || t.match(/(\d{1,2}):(\d{2})/);
      if (tm && G.wakes) { var hh = +tm[1], mm = tm[2] === '반' ? 30 : (tm[3] != null ? +tm[3] : (tm[2] && /^\d+$/.test(tm[2]) ? +tm[2] : 0)); if (hh <= 12 && /오후|저녁|밤/.test(t)) hh += 12; var mins = nearest(G.wakes, hh * 60 + mm); var lab = pad(Math.floor(mins / 60)) + ':' + pad(mins % 60); return { href: '/sleep/' + lab.replace(':', '-') + '/', label: lab + ' 기상 → 취침 시각' }; }
      return { href: '/sleep/', label: '몇 시에 자야 할까 (수면 주기)' };
    }
    // 아이 키 예측
    if (/아이\s*키|자녀\s*키|아들|딸|아빠|아버지|엄마|어머니|부모\s*키|키\s*예측/.test(t) && !/개월|아기\s*키/.test(t)) {
      var hs = nums.filter(function (x) { return x >= 140 && x <= 200; });
      if (hs.length >= 2 && G.fathers) { var fa = hs[0], ma = hs[1]; if (/엄마|어머니/.test(t) && /아빠|아버지/.test(t) && t.indexOf('엄마') >= 0 && t.indexOf('엄마') < t.indexOf('아빠')) { fa = hs[1]; ma = hs[0]; } fa = Math.max(G.fathers[0], Math.min(G.fathers[1], Math.round(fa))); ma = Math.max(G.mothers[0], Math.min(G.mothers[1], Math.round(ma))); return { href: '/child-height/' + fa + '-' + ma + '/', label: '아빠 ' + fa + ' 엄마 ' + ma + ' 아이 예상 키' }; }
      return { href: '/child-height/', label: '아이 키 예측 계산' };
    }
    // 혈중알코올농도
    if (/회식|팀\s*음주|단체|우리\s*팀/.test(t)) return { href: '/alcohol/team/', label: '회식 음주 표 만들기' };
    if (/혈중|음주|알코올|알콜|알코홀|숙취|소주|맥주|막걸리|와인|운전/.test(t) && !/칼로리|kcal/.test(t)) {
      var dk = /맥주/.test(t) ? 'beer' : /막걸리/.test(t) ? 'makgeolli' : /와인/.test(t) ? 'wine' : 'soju';
      var cm = t.match(/(\d+(?:\.\d+)?)\s*(?:병|잔|캔)/), cnt = cm ? Math.round(+cm[1]) : 1; if (/반\s*병/.test(t)) cnt = 1;
      cnt = Math.max(1, Math.min(5, cnt));
      return { href: '/alcohol/' + dk + '/' + cnt + '/', label: ({ soju: '소주', beer: '맥주', makgeolli: '막걸리', wine: '와인' })[dk] + ' ' + cnt + (dk === 'wine' ? '잔' : '병') + ' 혈중알코올농도' };
    }
    // 다이어트 기간
    if (/다이어트|감량|빼|살\s*빼|몇\s*주/.test(t)) {
      var dm = t.match(/(\d+(?:\.\d+)?)\s*(?:kg|킬로|키로)/);
      if (dm) { var dk2 = Math.max(1, Math.min(30, Math.round(+dm[1]))); return { href: '/diet/' + dk2 + '/', label: dk2 + 'kg 빼는 데 걸리는 기간' }; }
      return { href: '/diet/', label: '다이어트 기간 계산' };
    }
    if (/권장\s*칼로리|나이별|연령별|섭취\s*기준/.test(t)) return { href: '/kcal-need/', label: '나이별 하루 권장 칼로리' };
    if (/출산|예정일|임신|생리\s*시작|마지막\s*생리/.test(t) && !/배란|가임/.test(t)) {
      if (md) return { href: '/due-date/' + pad(+md[1]) + '-' + pad(+md[2]) + '/', label: '마지막 생리 ' + (+md[1]) + '월 ' + (+md[2]) + '일 출산예정일' };
      if (ymd) return { href: '/due-date/' + pad(+ymd[2]) + '-' + pad(+ymd[3]) + '/', label: '출산예정일' };
      return { href: '/due-date/', label: '출산예정일 계산' };
    }
    if (/배란|가임|생리\s*주기|생리/.test(t)) {
      if (md) return { href: '/ovulation/' + pad(+md[1]) + '-' + pad(+md[2]) + '/', label: (+md[1]) + '월 ' + (+md[2]) + '일 시작 배란일·가임기' };
      if (ymd) return { href: '/ovulation/' + pad(+ymd[2]) + '-' + pad(+ymd[3]) + '/', label: '배란일·가임기' };
      return { href: '/ovulation/', label: '배란일 계산' };
    }
    if (/아기|아이|개월|생일|예방접종|돌/.test(t) && ymd) {
      return { href: '/baby/' + ymd[1] + '-' + pad(+ymd[2]) + '-' + pad(+ymd[3]) + '/', label: ymd[1] + '년 ' + (+ymd[2]) + '월 ' + (+ymd[3]) + '일생 아기 개월수·접종 일정' };
    }
    if (/체지방|허리|목둘레/.test(t)) return { href: '/bodyfat/', label: '체지방률 계산' };
    if (/기초대사|대사량|하루\s*칼로리|필요\s*칼로리|섭취/.test(t)) return { href: '/bmr/', label: '기초대사량·하루 칼로리' };
    if (/물\s|물$|수분/.test(t) && nums.length) { var wkg = nearest(G.water || [nums[0]], nums[0]); return { href: '/water/' + wkg + '/', label: wkg + 'kg 하루 물 섭취량' }; }
    // 키·몸무게
    var h = null, w = null;
    var hm = t.match(/키\s*(\d{3})/); if (hm) h = +hm[1];
    var wm = t.match(/(?:몸무게|체중)\s*(\d{2,3})/); if (wm) w = +wm[1];
    if (h == null || w == null) {
      var big = nums.filter(function (x) { return x >= 130 && x <= 220; }), small = nums.filter(function (x) { return x >= 25 && x < 130; });
      if (h == null && big.length) h = big[0];
      if (w == null && small.length) w = small[0];
    }
    if (h != null && w != null) { var hh = nearest(G.heights || [h], h), ww = Math.max(G.wmin || 30, Math.min(G.wmax || 150, Math.round(w))); return { href: '/bmi/' + hh + '/' + ww + '/', label: '키 ' + hh + 'cm 몸무게 ' + ww + 'kg BMI' }; }
    if (h != null) { var h2 = nearest(G.heights || [h], h); return { href: '/bmi/' + h2 + '/', label: '키 ' + h2 + 'cm 정상 체중' }; }
    // 운동
    var ex = best(G.exercises, t);
    if (ex) return { href: '/exercise/' + ex.slug + '/', label: ex.name + ' 소모 칼로리' };
    // 음식
    var fd = best(G.foods, t);
    if (fd) return { href: '/food/' + fd.slug + '/', label: fd.name + ' 칼로리' };
    if (/칼로리|kcal/.test(t)) return { href: '/food/', label: '음식 칼로리 사전' };
    if (w != null) return { href: '/water/' + nearest(G.water || [w], w) + '/', label: w + 'kg 하루 물·단백질' };
    return null;
  }

  var smart = document.querySelector('form[data-quick="smart"]');
  if (smart) {
    var sin = smart.querySelector('input'), hint = smart.querySelector('[data-hint]'), idle = hint ? hint.textContent : '';
    var show = function () { var r = parseSmart(sin.value); if (!hint) return; if (r) { hint.textContent = '→ ' + r.label; hint.classList.remove('off'); } else { hint.textContent = sin.value.trim() ? '예: 키 170 몸무게 65 · 치킨 칼로리 · 출산예정일 3월 5일' : idle; hint.classList.add('off'); } };
    sin.addEventListener('input', show);
    smart.addEventListener('submit', function (e) { e.preventDefault(); var r = parseSmart(sin.value); if (r) location.href = r.href; else { sin.focus(); show(); } });
    Array.prototype.forEach.call(smart.querySelectorAll('.quick-ex button'), function (bt) { bt.addEventListener('click', function () { sin.value = bt.textContent; show(); sin.focus(); }); });
    if (hint) hint.classList.add('off');
  }

  /* 키·몸무게 두 칸 폼 */
  var hw = document.querySelector('form[data-quick="hw"]');
  if (hw) hw.addEventListener('submit', function (e) {
    e.preventDefault();
    var h = parseInt(hw.querySelector('[name=h]').value, 10), w = parseInt(hw.querySelector('[name=w]').value, 10);
    if (!h) { hw.querySelector('[name=h]').focus(); return; }
    var hh = nearest(G.heights || [h], h);
    location.href = w ? '/bmi/' + hh + '/' + Math.max(G.wmin || 30, Math.min(G.wmax || 150, w)) + '/' : '/bmi/' + hh + '/';
  });

  /* 변형 토글 (남/여 등) */
  Array.prototype.forEach.call(document.querySelectorAll('[data-variants]'), function (g) {
    var state = {}, segs = g.querySelectorAll('[data-dim]');
    function apply() {
      var key = Array.prototype.map.call(segs, function (s) { return state[s.getAttribute('data-dim')]; }).join('-');
      Array.prototype.forEach.call(g.querySelectorAll('[data-variant]'), function (b) { b.hidden = b.getAttribute('data-variant') !== key; });
      var url = new URL(location.href);
      Array.prototype.forEach.call(segs, function (s) { url.searchParams.set(s.getAttribute('data-dim'), state[s.getAttribute('data-dim')]); });
      history.replaceState(null, '', url.pathname + url.search);
    }
    Array.prototype.forEach.call(segs, function (s) {
      var dim = s.getAttribute('data-dim'), q = new URL(location.href).searchParams.get(dim), btns = s.querySelectorAll('button'), initial = null;
      Array.prototype.forEach.call(btns, function (b) { if (b.getAttribute('data-value') === q) initial = q; });
      state[dim] = initial || s.getAttribute('data-default');
      Array.prototype.forEach.call(btns, function (b) {
        b.classList.toggle('on', b.getAttribute('data-value') === state[dim]);
        b.addEventListener('click', function () { state[dim] = b.getAttribute('data-value'); Array.prototype.forEach.call(btns, function (x) { x.classList.toggle('on', x === b); }); apply(); });
      });
    });
    apply();
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (b) {
    b.addEventListener('click', function () {
      var el = document.querySelector(b.getAttribute('data-copy')); if (!el) return;
      var text = el.value || el.textContent;
      var done = function () { var t = b.textContent; b.textContent = '복사했어요'; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { el.select && el.select(); }); else { el.select && el.select(); }
    });
  });

  /* 큰 숫자 타일 2열 */
  function wideTiles() { Array.prototype.forEach.call(document.querySelectorAll('.tiles:not(.tiles-wide)'), function (t) { var nums = t.querySelectorAll('.num'); for (var i = 0; i < nums.length; i++) { if (nums[i].textContent.trim().length >= 11) { t.classList.add('tiles-wide'); break; } } }); }
  wideTiles(); setTimeout(wideTiles, 0); document.addEventListener('input', function () { setTimeout(wideTiles, 0); });
})();
