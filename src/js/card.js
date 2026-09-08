/* 바디집 — 임신 디데이 카드 (캔버스로 그려서 저장·공유). /pregnancy/card/ 전용 */
(function () {
  var M = window.Bodyzip, box = document.querySelector('[data-live="card"]');
  if (!M || !box) return;
  var canvas = document.getElementById('card-canvas'), img = document.getElementById('card-img'), hint = box.querySelector('[data-out="hint"]');
  var WEEKS = window.BODYZIP_WEEKS || [];
  var THEMES = {
    hanji: { bg: '#F6F1E8', ink: '#211C15', accent: '#1F6F6B', soft: '#DED2BC', muted: '#6B6259' },
    teal: { bg: '#1F6F6B', ink: '#F6F1E8', accent: '#F0D9A8', soft: 'rgba(246,241,232,.28)', muted: 'rgba(246,241,232,.75)' },
    coral: { bg: '#F6E4D8', ink: '#4A2C24', accent: '#C96B3F', soft: '#E9CDBC', muted: '#8A6A5E' },
    ink: { bg: '#211C15', ink: '#F6F1E8', accent: '#E0A070', soft: 'rgba(246,241,232,.22)', muted: 'rgba(246,241,232,.65)' }
  };
  function q(k) { return box.querySelector('[data-k="' + k + '"]'); }
  function today() { var t = new Date(Date.now() + 9 * 3600e3); return M.utc(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); }
  function parse(v) { if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null; var p = v.split('-').map(Number); return M.utc(p[0], p[1], p[2]); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* 주소 ?due= / ?lmp= / ?w= 로 미리 채우기 */
  try {
    var sp = new URLSearchParams(location.search), t0 = today(), pre = null;
    if (parse(sp.get('due'))) pre = parse(sp.get('due'));
    else if (parse(sp.get('lmp'))) pre = M.addDays(parse(sp.get('lmp')), 280);
    else if (sp.get('w') && +sp.get('w') > 0) pre = M.addDays(t0, 280 - 7 * Math.min(42, +sp.get('w')));
    if (pre) q('due').value = M.iso(pre);
    if (sp.get('name')) q('name').value = sp.get('name').slice(0, 12);
  } catch (e) {}
  if (!q('due').value) q('due').value = M.iso(M.addDays(today(), 140));

  function state() {
    var due = parse(q('due').value); if (!due) return null;
    var lmp = M.addDays(due, -280), t = today(), w = M.weeksOn(lmp, t), left = M.diffDays(t, due);
    var sz = q('size').value === 'square' ? [1080, 1080] : [1080, 1350];
    return { due: due, t: t, weeks: w.weeks, rem: w.rem, days: w.days, left: left, name: (q('name').value || '').trim().slice(0, 12), theme: THEMES[q('theme').value] || THEMES.hanji, size: sz };
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function dtext(s) { return s.left > 0 ? 'D-' + s.left : s.left === 0 ? 'D-DAY' : 'D+' + (-s.left); }
  function shareText(s) { return '출산예정일 ' + M.fmt(s.due) + ' · ' + dtext(s) + (s.days >= 0 ? ' · 임신 ' + s.weeks + '주 ' + s.rem + '일' : ''); }

  function draw(s) {
    var W = s.size[0], H = s.size[1], T = s.theme, tall = H > W;
    canvas.width = W; canvas.height = H;
    var c = canvas.getContext('2d');
    c.fillStyle = T.bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = T.soft; c.lineWidth = 3; rr(c, 48, 48, W - 96, H - 96, 28); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    var cy = tall ? 600 : 470;
    c.font = '500 40px "Noto Sans KR", sans-serif'; c.fillStyle = T.muted;
    c.fillText(M.fmtShort(s.t) + (s.days >= 0 ? ' · 임신 ' + s.weeks + '주 ' + s.rem + '일' : ' · 임신 준비'), W / 2, tall ? 170 : 140);
    if (s.name) { c.font = '700 64px "Gowun Batang", serif'; c.fillStyle = T.accent; c.fillText(s.name, W / 2, tall ? 275 : 235); }
    var d = dtext(s);
    c.font = '700 ' + (d.length > 5 ? 220 : 270) + 'px "IBM Plex Mono", "Noto Sans KR", monospace'; c.fillStyle = T.ink; c.fillText(d, W / 2, cy);
    c.font = '400 44px "Noto Sans KR", sans-serif'; c.fillStyle = T.ink; c.fillText('출산예정일 ' + M.fmt(s.due) + ' ' + M.wd(s.due), W / 2, cy + 190);
    var pw = W - 300, px = 150, py = cy + 290, ratio = Math.max(0, Math.min(1, s.days / 280));
    c.fillStyle = T.soft; rr(c, px, py, pw, 16, 8); c.fill();
    if (ratio > 0) { c.fillStyle = T.accent; rr(c, px, py, Math.max(16, pw * ratio), 16, 8); c.fill(); }
    c.font = '400 30px "Noto Sans KR", sans-serif'; c.fillStyle = T.muted;
    c.textAlign = 'left'; c.fillText('0주', px, py + 52); c.textAlign = 'right'; c.fillText('40주', px + pw, py + 52); c.textAlign = 'center';
    var wk = WEEKS[s.weeks - 1];
    if (s.days >= 0 && wk && wk[0] && wk[0] !== '—') { c.font = '400 36px "Noto Sans KR", sans-serif'; c.fillStyle = T.ink; c.fillText('아기는 지금 ' + wk[0] + ' 크기' + (wk[1] ? ' · ' + wk[1] : '') + (wk[2] ? ' · ' + wk[2] : ''), W / 2, py + 130); }
    c.font = '400 28px "Noto Sans KR", sans-serif'; c.fillStyle = T.muted; c.fillText('bodyzip.com', W / 2, H - 96);
    img.src = canvas.toDataURL('image/png');
    img.alt = shareText(s);
  }

  var timer = null;
  function render() {
    var s = state();
    if (!s) { if (hint) hint.textContent = '출산예정일을 넣어 주세요'; return; }
    if (hint) hint.textContent = shareText(s);
    clearTimeout(timer); timer = setTimeout(function () { draw(s); }, 60);
  }
  var ready = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('700 100px "IBM Plex Mono"'), document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('400 40px "Noto Sans KR"')]).catch(function () {}) : Promise.resolve();
  ready.then(function () { render(); setTimeout(render, 800); });
  Array.prototype.forEach.call(box.querySelectorAll('input, select'), function (el) { el.addEventListener('input', render); el.addEventListener('change', render); });
  box.addEventListener('submit', function (e) { e.preventDefault(); render(); });

  function blob(cb) { var s = state(); if (!s) return; draw(s); canvas.toBlob(function (b) { cb(b, s); }, 'image/png'); }
  var save = box.querySelector('[data-act="save"]'), share = box.querySelector('[data-act="share"]');
  if (save) save.addEventListener('click', function () {
    blob(function (b, s) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = '임신 ' + dtext(s) + ' 카드.png';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    });
  });
  if (share) {
    if (!(navigator.share && navigator.canShare)) share.hidden = true;
    else share.addEventListener('click', function () {
      blob(function (b, s) {
        var f = new File([b], 'dday.png', { type: 'image/png' });
        if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: '임신 디데이 카드', text: shareText(s) + ' — bodyzip.com' }).catch(function () {});
        else if (hint) hint.textContent = '이 브라우저는 바로 공유를 지원하지 않아요. 이미지를 저장한 뒤 올려 주세요.';
      });
    });
  }
})();
