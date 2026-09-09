/* 체중 기록 — 날짜별 몸무게를 이 기기(localStorage)에 저장하고 그래프·추세·목표 도달일을 보여 준다 */
(function () {
  var M = window.Bodyzip, box = document.querySelector('[data-live="weight"]');
  if (!M || !box) return;
  var KEY = 'bz.weight';
  function read() { try { var v = localStorage.getItem(KEY); return v ? JSON.parse(v) : []; } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function today() { var t = new Date(Date.now() + 9 * 3600e3); return t.toISOString().slice(0, 10); }
  function out(k, v) { var e = box.querySelector('[data-out="' + k + '"]'); if (e) e.textContent = v; }
  function val(k) { var e = box.querySelector('[data-k="' + k + '"]'); return e ? parseFloat(e.value) || 0 : 0; }
  function days(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

  function chart(list) {
    var el = box.querySelector('[data-out="chart"]');
    if (!el) return;
    if (list.length < 2) { el.innerHTML = '<p class="sub" style="padding:24px 0;text-align:center">기록이 2개 이상 쌓이면 그래프가 그려집니다</p>'; return; }
    var W = 640, H = 220, P = 34;
    var ws = list.map(function (r) { return r.w; });
    var lo = Math.min.apply(null, ws), hi = Math.max.apply(null, ws);
    if (hi - lo < 2) { lo -= 1; hi += 1; }
    var t0 = new Date(list[0].d), t1 = new Date(list[list.length - 1].d);
    var span = Math.max(1, (t1 - t0) / 86400000);
    var pt = list.map(function (r) {
      var x = P + (new Date(r.d) - t0) / 86400000 / span * (W - P * 2);
      var y = P + (hi - r.w) / (hi - lo) * (H - P * 2);
      return [x, y, r];
    });
    var line = pt.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pt[pt.length - 1][0].toFixed(1) + ' ' + (H - P) + ' L' + pt[0][0].toFixed(1) + ' ' + (H - P) + ' Z';
    var goal = val('goal');
    var gy = goal && goal >= lo && goal <= hi ? P + (hi - goal) / (hi - lo) * (H - P * 2) : null;
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="체중 변화 그래프">' +
      '<path d="' + area + '" fill="#1F6F6B" opacity=".08"></path>' +
      (gy ? '<line x1="' + P + '" y1="' + gy.toFixed(1) + '" x2="' + (W - P) + '" y2="' + gy.toFixed(1) + '" stroke="#C96B3F" stroke-width="1.5" stroke-dasharray="5 4"></line><text x="' + (W - P) + '" y="' + (gy - 6).toFixed(1) + '" text-anchor="end" font-size="12" fill="#C96B3F">목표 ' + goal + 'kg</text>' : '') +
      '<path d="' + line + '" fill="none" stroke="#1F6F6B" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></path>' +
      pt.map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="#1F6F6B"></circle>'; }).join('') +
      '<text x="' + P + '" y="16" font-size="12" fill="#8A948E">' + hi.toFixed(1) + 'kg</text>' +
      '<text x="' + P + '" y="' + (H - 8) + '" font-size="12" fill="#8A948E">' + lo.toFixed(1) + 'kg</text>' +
      '<text x="' + (W - P) + '" y="' + (H - 8) + '" text-anchor="end" font-size="12" fill="#8A948E">' + list[list.length - 1].d.slice(5) + '</text>' +
      '</svg>';
  }

  function render() {
    var list = read().slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    var last = list[list.length - 1], first = list[0];
    var h = val('h') || 170, goal = val('goal');
    if (last) {
      var b = M.bmiOf(h, last.w);
      out('now', last.w + 'kg');
      out('bmi', b.bmi + ' · ' + b.label);
      out('diff', list.length > 1 ? (last.w - first.w >= 0 ? '+' : '') + Math.round((last.w - first.w) * 10) / 10 + 'kg (' + days(first.d, last.d) + '일)' : '기록 1개');
      if (goal && list.length > 1) {
        var dd = days(first.d, last.d), rate = dd > 0 ? (first.w - last.w) / dd : 0;   /* kg/일 */
        if (rate > 0.001 && last.w > goal) {
          var need = Math.ceil((last.w - goal) / rate);
          var dt = new Date(new Date(last.d).getTime() + need * 86400000);
          out('eta', need + '일 뒤 · ' + dt.toISOString().slice(0, 10));
        } else out('eta', last.w <= goal ? '목표 달성' : '아직 추세가 없습니다');
      } else out('eta', goal ? '기록이 2개 이상이면' : '목표를 넣으면');
    } else { out('now', '—'); out('bmi', '—'); out('diff', '—'); out('eta', '—'); }
    var tb = box.querySelector('[data-out="rows"]');
    if (tb) tb.innerHTML = list.length ? list.slice().reverse().slice(0, 30).map(function (r, i) {
      var prev = list[list.indexOf(r) - 1];
      var d = prev ? (r.w - prev.w >= 0 ? '+' : '') + Math.round((r.w - prev.w) * 10) / 10 : '—';
      return '<tr><td>' + r.d + '</td><td>' + r.w + 'kg</td><td>' + d + '</td><td><button type="button" class="lnk" data-del="' + r.d + '">지우기</button></td></tr>';
    }).join('') : '<tr><td colspan="4">아직 기록이 없습니다. 오늘 몸무게를 넣어 보세요.</td></tr>';
    Array.prototype.forEach.call(box.querySelectorAll('[data-del]'), function (b2) {
      b2.addEventListener('click', function () { save(read().filter(function (r) { return r.d !== b2.getAttribute('data-del'); })); render(); });
    });
    chart(list);
  }
  var add = box.querySelector('[data-act="add"]');
  if (add) add.addEventListener('click', function () {
    var w = val('w'), d = (box.querySelector('[data-k="date"]') || {}).value || today();
    if (!w) return;
    var list = read().filter(function (r) { return r.d !== d; });
    list.push({ d: d, w: Math.round(w * 10) / 10 });
    save(list); render();
  });
  var clear = box.querySelector('[data-act="clear"]');
  if (clear) clear.addEventListener('click', function () { if (confirm('기록을 모두 지울까요?')) { save([]); render(); } });
  Array.prototype.forEach.call(box.querySelectorAll('[data-k="h"], [data-k="goal"]'), function (el) { el.addEventListener('input', render); });
  var dt = box.querySelector('[data-k="date"]'); if (dt && !dt.value) dt.value = today();
  render();
})();
