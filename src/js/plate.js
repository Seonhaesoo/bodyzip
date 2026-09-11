/* 명절 접시 담기 — 음식마다 + / − 로 한 상을 담으면 합계 칼로리·밥 공기·걷기 시간이 나온다.
 * 담은 양은 이 기기(localStorage 'bz.plate:<이름>')에만 저장하고, '오늘 먹은 것'(bz.today)으로 보낼 수 있다. */
(function () {
  var box = document.querySelector('[data-live="plate"]');
  if (!box) return;
  var KEY = 'bz.plate:' + (box.getAttribute('data-plate') || 'plate'), TODAY = 'bz.today', PROF = 'bz.profile';
  var MET = parseFloat(box.getAttribute('data-met')) || 3.0;
  function read(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function todayKey() { var t = new Date(Date.now() + 9 * 3600e3); return t.toISOString().slice(0, 10); }
  function fmt(n) { return Math.round(n).toLocaleString('ko-KR'); }
  var rows = [].slice.call(box.querySelectorAll('[data-key]'));
  var q = read(KEY, {}) || {};
  var wEl = box.querySelector('[data-k="w"]');
  var prof = read(PROF, {}) || {};
  if (wEl && !wEl.value && prof.w) wEl.value = prof.w;
  function weight() { var w = parseFloat(wEl && wEl.value); return w >= 20 && w <= 250 ? w : 60; }
  function out(k, v) { var e = box.querySelector('[data-out="' + k + '"]'); if (e) e.textContent = v; }
  function msg(html) { var e = box.querySelector('[data-out="msg"]'); if (e) e.innerHTML = html; }
  function walkText(kcal) {
    var m = Math.round(kcal / (MET * 3.5 * weight() / 200));
    return m >= 60 ? Math.floor(m / 60) + '시간 ' + (m % 60 ? (m % 60) + '분' : '') : m + '분';
  }
  function picked() {
    return rows.filter(function (r) { return (q[r.getAttribute('data-key')] || 0) > 0; }).map(function (r) {
      return { slug: r.getAttribute('data-slug'), name: r.getAttribute('data-name'), kcal: +r.getAttribute('data-kcal'), n: q[r.getAttribute('data-key')] };
    });
  }
  function total() { return picked().reduce(function (a, x) { return a + x.kcal * x.n; }, 0); }
  function render() {
    var sum = 0, kinds = 0;
    rows.forEach(function (r) {
      var n = q[r.getAttribute('data-key')] || 0;
      r.querySelector('[data-q]').textContent = n;
      r.classList.toggle('on', n > 0);
      sum += n * +r.getAttribute('data-kcal');
      if (n > 0) kinds++;
    });
    out('total', fmt(sum) + 'kcal');
    out('bowls', (Math.round(sum / 300 * 10) / 10) + '공기');
    out('walk', sum ? walkText(sum).trim() : '—');
    out('count', kinds ? kinds + '가지 담음 · 몸무게 ' + weight() + 'kg 기준' : '아직 담은 것이 없습니다');
    write(KEY, q);
  }
  rows.forEach(function (r) {
    var k = r.getAttribute('data-key');
    [].forEach.call(r.querySelectorAll('[data-d]'), function (b) {
      b.addEventListener('click', function () { q[k] = Math.max(0, Math.min(20, (q[k] || 0) + (+b.getAttribute('data-d')))); render(); });
    });
  });
  [].forEach.call(box.querySelectorAll('[data-preset]'), function (b) {
    b.addEventListener('click', function () {
      try { q = JSON.parse(b.getAttribute('data-preset')) || {}; } catch (e) { q = {}; }
      render();
      msg('‘' + b.textContent + '’을 담았습니다. 먹은 만큼 + · − 로 고치세요.');
    });
  });
  if (wEl) wEl.addEventListener('input', render);
  function act(name, fn) { var b = box.querySelector('[data-act="' + name + '"]'); if (b) b.addEventListener('click', fn); }
  act('reset', function () { q = {}; render(); msg(''); });
  act('today', function () {
    var p = picked();
    if (!p.length) { msg('먼저 음식을 담아 주세요.'); return; }
    var d = read(TODAY, null);
    if (!d || d.date !== todayKey()) d = { date: todayKey(), items: [] };
    p.forEach(function (x) { d.items.push({ n: x.name + (x.n > 1 ? ' × ' + x.n : ''), k: x.kcal * x.n, s: x.slug }); });
    write(TODAY, d);
    msg('오늘 먹은 것에 ' + p.length + '가지를 담았습니다. <a href="/today/">오늘 담은 것 보기 →</a>');
  });
  act('copy', function () {
    var p = picked();
    if (!p.length) { msg('먼저 음식을 담아 주세요.'); return; }
    var sum = total();
    var text = (box.getAttribute('data-title') || '내 한 상') + ': ' + p.map(function (x) { return x.name + (x.n > 1 ? ' ×' + x.n : ''); }).join(', ') +
      ' = 약 ' + fmt(sum) + 'kcal (밥 ' + (Math.round(sum / 300 * 10) / 10) + '공기, ' + weight() + 'kg 기준 걷기 ' + walkText(sum).trim() + ') ' + location.origin + location.pathname;
    function done() { msg('결과를 복사했습니다. 카톡이나 메모에 붙여 넣으세요.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { msg('복사가 막혀 있습니다. 아래 글을 길게 눌러 복사하세요: ' + text.replace(/</g, '&lt;')); }
      document.body.removeChild(t);
    }
  });
  render();
})();
