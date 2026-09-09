/* 오늘 담기 — 음식을 담아 하루 칼로리를 세는 장바구니. 이 기기(localStorage)에만 저장 */
(function () {
  var M = window.Bodyzip, G = window.BODYZIP_GRID || {};
  var KEY = 'bz.today', PROF = 'bz.profile';
  function todayKey() { var t = new Date(Date.now() + 9 * 3600e3); return t.toISOString().slice(0, 10); }
  function read(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function load() { var d = read(KEY, null); if (!d || d.date !== todayKey()) d = { date: todayKey(), items: [] }; return d; }
  function save(d) { write(KEY, d); }

  /* 음식·운동 페이지의 담기 버튼 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-add]'), function (btn) {
    btn.addEventListener('click', function () {
      var d = load();
      var kc = +btn.getAttribute('data-kcal'); if (!isFinite(kc)) return;
      d.items.push({ n: btn.getAttribute('data-name'), k: kc, s: btn.getAttribute('data-add') });
      save(d);
      var t = btn.textContent; btn.textContent = '담았어요 (' + d.items.length + '개)';
      setTimeout(function () { btn.textContent = t; }, 1600);
    });
  });

  var box = document.querySelector('[data-live="today"]');
  if (!box || !M) return;
  var num = M.num;
  var tbody = box.querySelector('[data-out="rows"]');
  function out(k, v) { var e = box.querySelector('[data-out="' + k + '"]'); if (e) e.textContent = v; }
  function profile() {
    var p = read(PROF, {});
    ['sex', 'age', 'h', 'w', 'act'].forEach(function (k) {
      var el = box.querySelector('[data-k="' + k + '"]');
      if (el && p[k] != null && p[k] !== '') el.value = p[k];
    });
  }
  function saveProfile() {
    var p = {};
    ['sex', 'age', 'h', 'w', 'act'].forEach(function (k) { var el = box.querySelector('[data-k="' + k + '"]'); if (el) p[k] = el.value; });
    write(PROF, p);
  }
  function tdee() {
    var sex = (box.querySelector('[data-k="sex"]') || {}).value || 'm';
    var age = parseFloat((box.querySelector('[data-k="age"]') || {}).value) || 30;
    var h = parseFloat((box.querySelector('[data-k="h"]') || {}).value) || 170;
    var w = parseFloat((box.querySelector('[data-k="w"]') || {}).value) || 65;
    var act = (box.querySelector('[data-k="act"]') || {}).value || 'light';
    var b = M.bmr(sex, h, w, age);
    return { bmr: b, tdee: M.tdee(b, act) };
  }
  function render() {
    var d = load(), t = tdee(), total = d.items.reduce(function (a, x) { return a + x.k; }, 0);
    out('total', num(total) + 'kcal');
    out('tdee', num(t.tdee) + 'kcal');
    out('left', (t.tdee - total >= 0 ? '남은 ' + num(t.tdee - total) : '초과 ' + num(total - t.tdee)) + 'kcal');
    out('bowls', M.bowls(total) + '공기');
    out('walk', total ? M.minutesFor(total, 3.0, parseFloat((box.querySelector('[data-k="w"]') || {}).value) || 65) + '분' : '—');
    var bar = box.querySelector('[data-out="bar"]');
    if (bar) { var r = Math.min(1.4, total / t.tdee); bar.style.width = (r / 1.4 * 100).toFixed(1) + '%'; bar.className = 'today-fill' + (total > t.tdee ? ' over' : ''); }
    if (tbody) tbody.innerHTML = d.items.length ? d.items.map(function (x, i) {
      return '<tr><td>' + (x.s ? '<a href="/food/' + x.s + '/">' + x.n + '</a>' : x.n) + '</td><td>' + num(x.k) + 'kcal</td><td><button type="button" class="lnk" data-del="' + i + '">지우기</button></td></tr>';
    }).join('') : '<tr><td colspan="3">아직 담은 것이 없습니다. 아래에서 음식을 찾아 담아 보세요.</td></tr>';
    Array.prototype.forEach.call(box.querySelectorAll('[data-del]'), function (b) {
      b.addEventListener('click', function () { var d2 = load(); d2.items.splice(+b.getAttribute('data-del'), 1); save(d2); render(); });
    });
  }
  /* 음식 검색해서 담기 */
  var q = box.querySelector('[data-k="q"]'), sug = box.querySelector('[data-out="sug"]');
  function search() {
    var t = (q.value || '').trim().toLowerCase();
    if (!t || !G.foods) { sug.innerHTML = ''; return; }
    var hit = G.foods.filter(function (f) { return (f.ks || []).some(function (k) { return k.indexOf(t) >= 0; }) || f.name.toLowerCase().indexOf(t) >= 0; }).slice(0, 8);
    sug.innerHTML = hit.map(function (f) { return '<button type="button" class="chip" style="min-width:0;padding:6px 10px" data-pick="' + f.slug + '" data-name="' + f.name + '">' + f.name + '</button>'; }).join('') || '<span class="sub">찾는 음식이 없습니다</span>';
    Array.prototype.forEach.call(sug.querySelectorAll('[data-pick]'), function (b) {
      b.addEventListener('click', function () {
        var slug = b.getAttribute('data-pick'), f = (G.kcal || {})[slug];
        if (f == null) return;
        var d = load(); d.items.push({ n: b.getAttribute('data-name'), k: f, s: slug }); save(d);
        q.value = ''; sug.innerHTML = ''; render();
      });
    });
  }
  if (q) { q.addEventListener('input', search); box.addEventListener('submit', function (e) { e.preventDefault(); search(); }); }
  Array.prototype.forEach.call(box.querySelectorAll('[data-k]'), function (el) {
    el.addEventListener('input', function () { saveProfile(); render(); });
    el.addEventListener('change', function () { saveProfile(); render(); });
  });
  var clear = box.querySelector('[data-act="clear"]');
  if (clear) clear.addEventListener('click', function () { if (confirm('오늘 담은 것을 모두 비울까요?')) { save({ date: todayKey(), items: [] }); render(); } });
  profile(); render();
})();
