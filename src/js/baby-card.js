/* 바디집 — 아기 100일·돌 카드 (캔버스로 그려서 저장·공유). /baby/card/ 전용 */
(function () {
  var M = window.Bodyzip, box = document.querySelector('[data-live="babycard"]');
  if (!M || !box) return;
  var canvas = document.getElementById('card-canvas'), img = document.getElementById('card-img'), hint = box.querySelector('[data-out="hint"]');
  var THEMES = {
    hanji: { bg: '#F6F1E8', ink: '#211C15', accent: '#C96B3F', soft: '#DED2BC', muted: '#6B6259' },
    teal: { bg: '#1F6F6B', ink: '#F6F1E8', accent: '#F0D9A8', soft: 'rgba(246,241,232,.28)', muted: 'rgba(246,241,232,.75)' },
    coral: { bg: '#F6E4D8', ink: '#4A2C24', accent: '#C96B3F', soft: '#E9CDBC', muted: '#8A6A5E' },
    ink: { bg: '#211C15', ink: '#F6F1E8', accent: '#E0A070', soft: 'rgba(246,241,232,.22)', muted: 'rgba(246,241,232,.65)' }
  };
  var MARKS = [[50, '50일'], [100, '100일'], [200, '200일'], [300, '300일'], ['m12', '첫돌'], [500, '500일'], ['m24', '두돌'], [1000, '1000일'], ['m36', '세돌']];
  function q(k) { return box.querySelector('[data-k="' + k + '"]'); }
  function today() { var t = new Date(Date.now() + 9 * 3600e3); return M.utc(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); }
  function parse(v) { if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null; var p = v.split('-').map(Number); return M.utc(p[0], p[1], p[2]); }
  try {
    var sp = new URLSearchParams(location.search);
    if (parse(sp.get('birth'))) q('birth').value = sp.get('birth');
    if (sp.get('name')) q('name').value = sp.get('name').slice(0, 12);
  } catch (e) {}
  if (!q('birth').value) q('birth').value = M.iso(M.addDays(today(), -99));

  function markDate(b, m) { return typeof m === 'string' ? M.addMonths(b, +m.slice(1)) : M.addDays(b, m - 1); }
  function state() {
    var b = parse(q('birth').value); if (!b) return null;
    var t = today(), days = M.diffDays(b, t) + 1, a = M.ageOn(b, t);
    if (days < 1) return { before: true, b: b, t: t, days: days };
    var hit = null, next = null;
    for (var i = 0; i < MARKS.length; i++) { var d = markDate(b, MARKS[i][0]), diff = M.diffDays(t, d); if (diff === 0) hit = MARKS[i][1]; else if (diff > 0 && !next) next = { label: MARKS[i][1], date: d, left: diff }; }
    return { b: b, t: t, days: days, age: a, hit: hit, next: next, name: (q('name').value || '').trim().slice(0, 12), theme: THEMES[q('theme').value] || THEMES.hanji, size: q('size').value === 'square' ? [1080, 1080] : [1080, 1350] };
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function shareText(s) { return (s.name ? s.name + ' · ' : '') + (s.hit ? s.hit + ' 🎉 · ' : '') + 'D+' + s.days + ' · ' + s.age.months + '개월 ' + s.age.days + '일'; }

  function draw(s) {
    var W = s.size[0], H = s.size[1], T = s.theme, tall = H > W;
    canvas.width = W; canvas.height = H;
    var c = canvas.getContext('2d');
    c.fillStyle = T.bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = T.soft; c.lineWidth = 3; rr(c, 48, 48, W - 96, H - 96, 28); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    var cy = tall ? 600 : 470;
    c.font = '500 40px "Noto Sans KR", sans-serif'; c.fillStyle = T.muted;
    c.fillText(M.fmt(s.b) + ' 태어남 · ' + M.fmtShort(s.t), W / 2, tall ? 170 : 140);
    if (s.name) { c.font = '700 64px "Gowun Batang", serif'; c.fillStyle = T.accent; c.fillText(s.name, W / 2, tall ? 275 : 235); }
    var big = s.hit ? s.hit : 'D+' + s.days;
    c.font = '700 ' + (big.length > 5 ? 200 : 250) + 'px ' + (s.hit ? '"Gowun Batang", serif' : '"IBM Plex Mono", "Noto Sans KR", monospace'); c.fillStyle = T.ink; c.fillText(big, W / 2, cy);
    c.font = '400 44px "Noto Sans KR", sans-serif'; c.fillStyle = T.ink;
    c.fillText((s.hit ? '태어난 지 ' + s.days + '일 · ' : '') + s.age.months + '개월 ' + s.age.days + '일', W / 2, cy + 180);
    if (s.next) { c.font = '400 36px "Noto Sans KR", sans-serif'; c.fillStyle = T.muted; c.fillText(s.next.label + '까지 D-' + s.next.left + ' · ' + M.fmt(s.next.date), W / 2, cy + 260); }
    var pw = W - 300, px = 150, py = cy + 340, ratio = Math.max(0, Math.min(1, s.days / 365));
    c.fillStyle = T.soft; rr(c, px, py, pw, 16, 8); c.fill();
    if (ratio > 0) { c.fillStyle = T.accent; rr(c, px, py, Math.max(16, pw * ratio), 16, 8); c.fill(); }
    c.font = '400 30px "Noto Sans KR", sans-serif'; c.fillStyle = T.muted;
    c.textAlign = 'left'; c.fillText('태어난 날', px, py + 52); c.textAlign = 'right'; c.fillText('첫돌', px + pw, py + 52); c.textAlign = 'center';
    c.font = '400 28px "Noto Sans KR", sans-serif'; c.fillStyle = T.muted; c.fillText('bodyzip.com', W / 2, H - 96);
    img.src = canvas.toDataURL('image/png'); img.alt = shareText(s);
  }
  var timer = null;
  function render() {
    var s = state();
    if (!s) { if (hint) hint.textContent = '생년월일을 넣어 주세요'; return; }
    if (s.before) { if (hint) hint.textContent = '아직 태어나기 전이에요. 임신 디데이 카드를 써 보세요.'; return; }
    if (hint) hint.textContent = shareText(s);
    clearTimeout(timer); timer = setTimeout(function () { draw(s); }, 60);
  }
  var ready = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('700 100px "IBM Plex Mono"'), document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('400 40px "Noto Sans KR"')]).catch(function () {}) : Promise.resolve();
  ready.then(function () { render(); setTimeout(render, 800); });
  Array.prototype.forEach.call(box.querySelectorAll('input, select'), function (el) { el.addEventListener('input', render); el.addEventListener('change', render); });
  box.addEventListener('submit', function (e) { e.preventDefault(); render(); });
  function blob(cb) { var s = state(); if (!s || s.before) return; draw(s); canvas.toBlob(function (b) { cb(b, s); }, 'image/png'); }
  var save = box.querySelector('[data-act="save"]'), share = box.querySelector('[data-act="share"]');
  if (save) save.addEventListener('click', function () { blob(function (b, s) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = '아기 ' + (s.hit || 'D+' + s.days) + ' 카드.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }); });
  if (share) {
    if (!(navigator.share && navigator.canShare)) share.hidden = true;
    else share.addEventListener('click', function () { blob(function (b, s) { var f = new File([b], 'baby.png', { type: 'image/png' }); if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: '아기 카드', text: shareText(s) + ' — bodyzip.com' }).catch(function () {}); else if (hint) hint.textContent = '이 브라우저는 바로 공유를 지원하지 않아요. 이미지를 저장한 뒤 올려 주세요.'; }); });
  }
})();
