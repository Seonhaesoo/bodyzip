/* 혈압 기록 — 집에서 잰 혈압을 이 기기(localStorage)에 저장하고 7일 평균 · 아침/저녁 평균 · 그래프를 보여 준다 */
(function () {
  var M = window.Bodyzip, box = document.querySelector('[data-live="bplog"]');
  if (!M || !box || !M.homeAvg) return;
  var KEY = 'bz.bp';
  function read() { try { var v = localStorage.getItem(KEY); return v ? JSON.parse(v) : []; } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function q(k) { return box.querySelector('[data-k="' + k + '"]'); }
  function out(k, v) { var e = box.querySelector('[data-out="' + k + '"]'); if (e) e.textContent = v; }
  function numOf(k) { var e = q(k); return e ? parseFloat(e.value) || 0 : 0; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function kst(ms) { return new Date(ms + 9 * 3600e3); }
  function stamp(ms) { var t = kst(ms); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()) + ' ' + pad(t.getUTCHours()) + ':' + pad(t.getUTCMinutes()); }
  function msOf(dateStr, timeStr) { var p = dateStr.split('-').map(Number), h = (timeStr || '00:00').split(':').map(Number); return Date.UTC(p[0], p[1] - 1, p[2], h[0] || 0, h[1] || 0) - 9 * 3600e3; }
  function sorted() { return read().sort(function (a, b) { return a.t - b.t; }); }

  function fillNow() {
    var t = kst(Date.now()), d = q('date'), tm = q('time');
    if (d && !d.value) d.value = t.toISOString().slice(0, 10);
    if (tm && !tm.value) tm.value = pad(t.getUTCHours()) + ':' + pad(t.getUTCMinutes());
  }

  function chart(list) {
    var el = box.querySelector('[data-out="chart"]');
    if (!el) return;
    if (list.length < 2) { el.innerHTML = '<p class="sub" style="padding:24px 0;text-align:center">기록이 2개 이상 쌓이면 그래프가 그려집니다</p>'; return; }
    var pts = list.slice(-60), W = 640, H = 240, P = 34;
    var lo = Math.min.apply(null, pts.map(function (r) { return r.d; }).concat([80])) - 10;
    var hi = Math.max.apply(null, pts.map(function (r) { return r.s; }).concat([140])) + 10;
    var t0 = pts[0].t, t1 = pts[pts.length - 1].t, span = Math.max(1, t1 - t0);
    function X(t) { return P + (t - t0) / span * (W - P * 2); }
    function Y(v) { return P + (hi - v) / (hi - lo) * (H - P * 2); }
    function line(k) { return pts.map(function (r, i) { return (i ? 'L' : 'M') + X(r.t).toFixed(1) + ' ' + Y(r[k]).toFixed(1); }).join(' '); }
    function ref(v, label) { var y = Y(v).toFixed(1); return '<line x1="' + P + '" y1="' + y + '" x2="' + (W - P) + '" y2="' + y + '" stroke="#C96B3F" stroke-width="1.2" stroke-dasharray="5 4"></line><text x="' + (W - P) + '" y="' + (Y(v) - 5).toFixed(1) + '" text-anchor="end" font-size="11" fill="#C96B3F">' + label + '</text>'; }
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="혈압 변화 그래프 — 위 선이 수축기, 아래 선이 이완기">' +
      ref(135, '가정혈압 기준 135') + ref(85, '85') +
      '<path d="' + line('s') + '" fill="none" stroke="#1F6F6B" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"></path>' +
      '<path d="' + line('d') + '" fill="none" stroke="#6FA8A4" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"></path>' +
      pts.map(function (r) { var x = X(r.t).toFixed(1); return '<circle cx="' + x + '" cy="' + Y(r.s).toFixed(1) + '" r="3" fill="#1F6F6B"></circle><circle cx="' + x + '" cy="' + Y(r.d).toFixed(1) + '" r="3" fill="#6FA8A4"></circle>'; }).join('') +
      '<text x="' + P + '" y="16" font-size="12" fill="#8A948E">' + hi + '</text>' +
      '<text x="' + P + '" y="' + (H - 8) + '" font-size="12" fill="#8A948E">' + lo + '</text>' +
      '<text x="' + (W - P) + '" y="' + (H - 8) + '" text-anchor="end" font-size="12" fill="#8A948E">' + stamp(t1).slice(5, 10) + '</text>' +
      '</svg><p class="sub" style="margin-top:4px"><span style="color:#1F6F6B">●</span> 수축기 · <span style="color:#6FA8A4">●</span> 이완기 · 점선은 가정혈압 기준(135/85)</p>';
  }

  function render() {
    var list = sorted(), a = M.homeAvg(list, Date.now(), 7);
    out('avg', a.n ? a.s + '/' + a.d : '—');
    out('am', a.am.n ? a.am.s + '/' + a.am.d : '—');
    out('pm', a.pm.n ? a.pm.s + '/' + a.pm.d : '—');
    out('verdict', !a.n ? '최근 7일 기록이 없습니다. 아침·저녁에 2번씩 재서 넣어 보세요.'
      : (a.over ? '최근 7일 평균이 가정혈압 고혈압 기준(135/85mmHg) 이상입니다. 기록을 진료 때 보여 주세요.' : '최근 7일 평균이 가정혈압 기준(135/85mmHg) 미만입니다.')
        + ' ' + a.n + '회 · ' + a.days + '일' + (a.enough ? '' : ' (5일 넘게 모이면 더 정확합니다)') + (a.p ? ' · 맥박 평균 ' + a.p : ''));
    var tb = box.querySelector('[data-out="rows"]');
    if (tb) tb.innerHTML = list.length ? list.slice().reverse().slice(0, 60).map(function (r) {
      var tag = M.readingTag(r.s, r.d);
      return '<tr><td>' + stamp(r.t) + '</td><td>' + (M.SLOT_NAME[r.slot] || '') + '</td><td>' + r.s + '/' + r.d + '</td><td>' + (r.p || '—') + '</td><td>' + tag.label + '</td><td><button type="button" class="lnk" data-del="' + r.t + '">지우기</button></td></tr>';
    }).join('') : '<tr><td colspan="6">아직 기록이 없습니다.</td></tr>';
    Array.prototype.forEach.call(box.querySelectorAll('[data-del]'), function (b) {
      b.addEventListener('click', function () { var t = +b.getAttribute('data-del'); save(read().filter(function (r) { return r.t !== t; })); render(); });
    });
    chart(list);
  }

  function addReading() {
    var s = Math.round(numOf('s')), d = Math.round(numOf('d')), p = Math.round(numOf('p'));
    var ds = (q('date') || {}).value, ts = (q('time') || {}).value;
    if (!M.bpValid(s, d)) { out('msg', '수축기는 60~260, 이완기는 30~160 사이이고 수축기가 더 커야 합니다.'); return; }
    if (!ds) ds = kst(Date.now()).toISOString().slice(0, 10);
    var list = read(), ms = msOf(ds, ts), hour = parseInt((ts || '0').split(':')[0], 10) || 0;
    while (list.some(function (r) { return r.t === ms; })) ms += 60000;          /* 같은 시각 두 번째 측정은 1분 뒤로 */
    var slot = (q('slot') || {}).value || M.slotOf(hour);
    list.push({ t: ms, s: s, d: d, p: p > 0 ? p : 0, slot: slot });
    save(list);
    var lv = M.bloodPressure(s, d);
    out('msg', lv.key === 'crisis' ? lv.note : s - d < 20 ? '수축기와 이완기 차이가 작습니다. 한 번 더 재 보세요.' : '기록했습니다. 1~2분 쉬고 한 번 더 재서 넣으면 더 정확합니다.');
    ['s', 'd', 'p'].forEach(function (k) { var e = q(k); if (e) e.value = ''; });
    render();
  }

  var add = box.querySelector('[data-act="add"]');
  if (add) add.addEventListener('click', addReading);
  box.addEventListener('submit', function (e) { e.preventDefault(); addReading(); });
  var clr = box.querySelector('[data-act="clear"]');
  if (clr) clr.addEventListener('click', function () { if (confirm('혈압 기록을 모두 지울까요?')) { save([]); render(); out('msg', '모두 지웠습니다.'); } });

  var cp = box.querySelector('[data-act="copy"]');
  if (cp) cp.addEventListener('click', function () {
    var list = sorted(), a = M.homeAvg(list, Date.now(), 7);
    var lines = ['바디집 혈압 기록 (최근 7일)', a.n ? '평균 ' + a.s + '/' + a.d + ' mmHg · ' + a.n + '회 · ' + a.days + '일' + (a.p ? ' · 맥박 ' + a.p : '') : '최근 7일 기록 없음'];
    if (a.am.n) lines.push('아침 평균 ' + a.am.s + '/' + a.am.d + ' (' + a.am.n + '회)');
    if (a.pm.n) lines.push('저녁 평균 ' + a.pm.s + '/' + a.pm.d + ' (' + a.pm.n + '회)');
    lines.push('---');
    list.slice(-30).forEach(function (r) { lines.push(stamp(r.t) + ' ' + (M.SLOT_NAME[r.slot] || '') + ' ' + r.s + '/' + r.d + (r.p ? ' 맥박 ' + r.p : '')); });
    function done(ok) { out('msg', ok ? '요약을 복사했습니다. 진료 때 메모나 메시지로 보여 주세요.' : '복사가 막혀 있습니다. 표를 캡처해 보여 주세요.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lines.join('\n')).then(function () { done(true); }, function () { done(false); });
    else done(false);
  });

  var csv = box.querySelector('[data-act="csv"]');
  if (csv) csv.addEventListener('click', function () {
    var rows = [['날짜시각', '시간대', '수축기', '이완기', '맥박']].concat(sorted().map(function (r) { return [stamp(r.t), M.SLOT_NAME[r.slot] || '', r.s, r.d, r.p || '']; }));
    try {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' }));
      a.download = '혈압기록.csv'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    } catch (e) { out('msg', '이 브라우저에서는 파일 저장이 막혀 있습니다. 요약 복사를 써 주세요.'); }
  });

  fillNow();
  render();
})();
