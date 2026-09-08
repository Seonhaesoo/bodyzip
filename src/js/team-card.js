/* 바디집 — 회식 음주 표 카드: 사람별 술·양·몸무게 → 최고 농도, 0.03% 아래 시각, 완전 분해 시각. /alcohol/team/ 전용 */
(function () {
  var M = window.Bodyzip, box = document.querySelector('[data-live="team"]');
  if (!M || !box) return;
  var canvas = document.getElementById('card-canvas'), img = document.getElementById('card-img'), tbody = box.querySelector('[data-out="rows"]'), hint = box.querySelector('[data-out="hint"]');
  var DR = {}; M.DRINKS.forEach(function (d) { DR[d.key] = d; });
  function rows() {
    var out = [];
    Array.prototype.forEach.call(box.querySelectorAll('[data-row]'), function (r) {
      var name = (r.querySelector('[data-k="name"]').value || '').trim(), n = parseFloat(r.querySelector('[data-k="n"]').value) || 0, kg = parseFloat(r.querySelector('[data-k="kg"]').value) || 0;
      if (!n || !kg) return;
      var d = DR[r.querySelector('[data-k="drink"]').value] || DR.soju, sex = r.querySelector('[data-k="sex"]').value || 'm';
      var g = M.alcoholGrams(d.ml * n, d.abv), b = M.bac(g, kg, sex);
      out.push({ name: name || ('#' + (out.length + 1)), drink: d.label.split(' ')[0] + ' ' + n + (d.key === 'wine' || d.key === 'whisky' || d.key === 'soju-shot' ? '잔' : '병'), sex: sex, kg: kg, peak: b.peak, drive: b.driveHours, sober: b.soberHours, level: M.bacLevel(b.peak).split(' (')[0] });
    });
    return out;
  }
  function clock(base, hours) { var m = Math.round(base + hours * 60), d = Math.floor(m / 1440), t = m % 1440; return (d ? '+' + d + '일 ' : '') + (t < 600 ? '0' : '') + Math.floor(t / 60) + ':' + (t % 60 < 10 ? '0' : '') + (t % 60); }
  function endMin() { var v = box.querySelector('[data-k="end"]').value || '23:00'; var p = v.split(':').map(Number); return p[0] * 60 + p[1]; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function draw(list, end) {
    var W = 1080, H = 1350; canvas.width = W; canvas.height = H;
    var c = canvas.getContext('2d');
    c.fillStyle = '#F6F1E8'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#DED2BC'; c.lineWidth = 3; rr(c, 48, 48, W - 96, H - 96, 28); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '500 36px "Noto Sans KR", sans-serif'; c.fillStyle = '#6B6259'; c.fillText('회식 뒤 운전은 언제부터 · 마지막 잔 ' + (box.querySelector('[data-k="end"]').value || '23:00'), W / 2, 150);
    c.font = '700 64px "Gowun Batang", serif'; c.fillStyle = '#211C15'; c.fillText('우리 팀 혈중알코올농도', W / 2, 250);
    var top = 360, rowH = list.length > 6 ? 105 : 125, cols = [150, 400, 640, 900];
    c.font = '500 30px "Noto Sans KR", sans-serif'; c.fillStyle = '#8A948E';
    ['이름 · 마신 것', '최고 농도', '0.03% 아래', '완전 분해'].forEach(function (h, i) { c.textAlign = i === 0 ? 'left' : 'center'; c.fillText(h, cols[i], top); });
    c.strokeStyle = '#DED2BC'; c.lineWidth = 2; c.beginPath(); c.moveTo(120, top + 40); c.lineTo(W - 120, top + 40); c.stroke();
    list.slice(0, 8).forEach(function (r, i) {
      var y = top + 40 + rowH * (i + 0.55);
      c.textAlign = 'left'; c.font = '700 36px "Noto Sans KR", sans-serif'; c.fillStyle = '#211C15'; c.fillText(r.name, cols[0], y - 18);
      c.font = '400 28px "Noto Sans KR", sans-serif'; c.fillStyle = '#6B6259'; c.fillText(r.drink + ' · ' + r.kg + 'kg', cols[0], y + 24);
      c.textAlign = 'center'; c.font = '600 40px "IBM Plex Mono", monospace'; c.fillStyle = r.peak >= 0.08 ? '#C96B3F' : r.peak >= 0.03 ? '#B8862D' : '#1F6F6B'; c.fillText(r.peak + '%', cols[1], y - 12);
      c.font = '400 26px "Noto Sans KR", sans-serif'; c.fillStyle = '#6B6259'; c.fillText(r.level, cols[1], y + 26);
      c.font = '600 40px "IBM Plex Mono", monospace'; c.fillStyle = '#211C15'; c.fillText(r.drive <= 0 ? '기준 미만' : clock(end, r.drive), cols[2], y); c.fillText(clock(end, r.sober), cols[3], y);
      c.strokeStyle = '#EEE6D6'; c.beginPath(); c.moveTo(120, y + rowH / 2); c.lineTo(W - 120, y + rowH / 2); c.stroke();
    });
    c.textAlign = 'center'; c.font = '400 28px "Noto Sans KR", sans-serif'; c.fillStyle = '#8A948E';
    c.fillText('위드마크 공식 · 흡수 1.5시간 + 시간당 0.015%p 분해 · 참고용, 운전 가능을 보증하지 않음', W / 2, H - 150);
    c.fillText('bodyzip.com/alcohol/team/', W / 2, H - 96);
    img.src = canvas.toDataURL('image/png');
  }
  var timer = null;
  function render() {
    var list = rows(), end = endMin();
    if (tbody) tbody.innerHTML = list.map(function (r) { return '<tr><td>' + r.name + '<small>' + r.drink + ' · ' + r.kg + 'kg</small></td><td>' + r.peak + '%<small>' + r.level + '</small></td><td>' + (r.drive <= 0 ? '기준 미만' : clock(end, r.drive)) + '</td><td>' + clock(end, r.sober) + '</td></tr>'; }).join('') || '<tr><td colspan="4">이름·몸무게·마신 양을 넣으면 여기에 나옵니다</td></tr>';
    if (hint) hint.textContent = list.length ? list.length + '명 · 가장 늦은 0.03% 시각 ' + clock(end, Math.max.apply(null, list.map(function (r) { return r.drive; }))) : '';
    clearTimeout(timer); timer = setTimeout(function () { draw(list, end); }, 80);
  }
  var ready = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('600 40px "IBM Plex Mono"'), document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('400 30px "Noto Sans KR"')]).catch(function () {}) : Promise.resolve();
  ready.then(function () { render(); setTimeout(render, 800); });
  Array.prototype.forEach.call(box.querySelectorAll('input, select'), function (el) { el.addEventListener('input', render); el.addEventListener('change', render); });
  box.addEventListener('submit', function (e) { e.preventDefault(); render(); });
  function blob(cb) { draw(rows(), endMin()); canvas.toBlob(function (b) { cb(b); }, 'image/png'); }
  var save = box.querySelector('[data-act="save"]'), share = box.querySelector('[data-act="share"]');
  if (save) save.addEventListener('click', function () { blob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = '회식 음주 표.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }); });
  if (share) {
    if (!(navigator.share && navigator.canShare)) share.hidden = true;
    else share.addEventListener('click', function () { blob(function (b) { var f = new File([b], 'team.png', { type: 'image/png' }); if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: '회식 뒤 운전은 언제부터', text: '우리 팀 혈중알코올농도 표 — bodyzip.com/alcohol/team/' }).catch(function () {}); }); });
  }
})();
