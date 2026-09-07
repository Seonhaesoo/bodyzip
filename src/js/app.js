/* 몸자 — 페이지 스크립트 (정적 사이트)
 * 1) 스마트 검색: "키 170 몸무게 65", "치킨 칼로리", "출산예정일 3월 5일", "아기 2025-01-31" → 알맞은 페이지
 * 2) 빠른 찾기 폼, 변형 토글, 복사 버튼 */
(function () {
  var G = window.MOMJA_GRID || {};
  function nearest(arr, v) { if (!arr || !arr.length) return v; return arr.reduce(function (a, b) { return Math.abs(b - v) < Math.abs(a - v) ? b : a; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function parseSmart(s) {
    var t = (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!t) return null;
    var nums = (t.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    // 날짜: 3월 5일 / 3/5 / 2025-01-31
    var ymd = t.match(/(20\d\d)[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/);
    var md = t.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/) || t.match(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?:\s|$)/);
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
    var ex = (G.exercises || []).filter(function (e) { return t.indexOf(e.k) >= 0; }).sort(function (a, b) { return b.k.length - a.k.length; })[0];
    if (ex) return { href: '/exercise/' + ex.slug + '/', label: ex.name + ' 소모 칼로리' };
    // 음식
    var fd = (G.foods || []).filter(function (f) { return t.indexOf(f.k) >= 0; }).sort(function (a, b) { return b.k.length - a.k.length; })[0];
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
