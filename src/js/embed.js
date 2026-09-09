/* 임베드 위젯 — 다른 사이트의 iframe 안에서 도는 작은 계산기 (window.Bodyzip) */
(function () {
  var M = window.Bodyzip;
  if (!M) return;
  var box = document.querySelector('[data-embed]');
  if (!box) return;
  var kind = box.getAttribute('data-embed');
  var out = function (k) { var e = box.querySelector('[data-out="' + k + '"]'); return e; };
  var set = function (k, v) { var e = out(k); if (e) e.textContent = v; };
  var val = function (k) { var e = box.querySelector('[data-k="' + k + '"]'); return e ? parseFloat(e.value) || 0 : 0; };
  var sel = function (k) { var e = box.querySelector('[data-k="' + k + '"]'); return e ? e.value : ''; };
  function today() { var t = new Date(Date.now() + 9 * 3600e3); return M.utc(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); }

  function update() {
    if (kind === 'bmi') {
      var cm = val('h') || 170, kg = val('w') || 65;
      var b = M.bmiOf(cm, kg), r = M.normalRange(cm), tn = M.toNormal(cm, kg);
      set('bmi', b.bmi); set('cat', b.label); set('range', r.min + '~' + r.max + 'kg');
      set('to', tn.dir === 'ok' ? '정상 범위 안' : (tn.dir === 'lose' ? '−' : '+') + tn.kg + 'kg');
      var link = out('link');
      if (link) link.href = 'https://bodyzip.com/bmi/' + Math.max(140, Math.min(200, Math.round(cm))) + '/' + Math.max(40, Math.min(120, Math.round(kg))) + '/?utm_source=embed';
    } else if (kind === 'due') {
      var v = sel('lmp');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
      var p = v.split('-').map(Number), lmp = M.utc(p[0], p[1], p[2]);
      var pr = M.pregnancy(lmp), w = M.weeksOn(lmp, today()), left = M.diffDays(today(), pr.due);
      set('due', M.fmt(pr.due));
      set('week', w.days < 0 ? '아직 시작 전' : w.weeks + '주 ' + w.rem + '일');
      set('left', left < 0 ? '예정일 ' + (-left) + '일 지남' : left + '일 남음');
      var l2 = out('link');
      if (l2) { var mm = lmp.getUTCMonth() + 1, dd = lmp.getUTCDate(); l2.href = 'https://bodyzip.com/due-date/' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd + '/?utm_source=embed'; }
    }
  }
  Array.prototype.forEach.call(box.querySelectorAll('input, select'), function (el) {
    el.addEventListener('input', update); el.addEventListener('change', update);
  });
  box.addEventListener('submit', function (e) { e.preventDefault(); update(); });
  update();
})();
