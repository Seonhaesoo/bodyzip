/* 바디집 — 아이 예상 키 결과 카드 (아이 키 예측 페이지의 계산기 값으로 그려 저장·공유) */
(function () {
  var M = window.Bodyzip, box = document.querySelector('[data-live="child"]'), wrap = document.querySelector('[data-card="child"]');
  if (!M || !box || !wrap) return;
  var canvas = wrap.querySelector('canvas'), img = wrap.querySelector('img');
  function val(k) { var el = box.querySelector('[data-k="' + k + '"]'); return el ? parseFloat(el.value) || 0 : 0; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function state() { var f = val('f') || 175, m = val('m') || 162, c = M.childHeight(f, m); return { f: f, m: m, boy: c.boy, girl: c.girl }; }
  function text(s) { return '아빠 ' + s.f + 'cm · 엄마 ' + s.m + 'cm → 아들 ' + s.boy + 'cm · 딸 ' + s.girl + 'cm (±8.5cm)'; }
  function draw(s) {
    var W = 1080, H = 1350; canvas.width = W; canvas.height = H;
    var c = canvas.getContext('2d');
    c.fillStyle = '#F6F1E8'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#DED2BC'; c.lineWidth = 3; rr(c, 48, 48, W - 96, H - 96, 28); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '500 40px "Noto Sans KR", sans-serif'; c.fillStyle = '#6B6259'; c.fillText('우리 아이 예상 키', W / 2, 170);
    c.font = '700 60px "Gowun Batang", serif'; c.fillStyle = '#211C15'; c.fillText('아빠 ' + s.f + 'cm · 엄마 ' + s.m + 'cm', W / 2, 270);
    var y0 = 470;
    [['아들', s.boy], ['딸', s.girl]].forEach(function (p, i) {
      var y = y0 + i * 300;
      c.font = '500 44px "Noto Sans KR", sans-serif'; c.fillStyle = '#6B6259'; c.fillText(p[0], W / 2, y - 95);
      c.font = '600 170px "IBM Plex Mono", "Noto Sans KR", monospace'; c.fillStyle = i === 0 ? '#1F6F6B' : '#C96B3F'; c.fillText(p[1] + 'cm', W / 2, y + 10);
      c.font = '400 34px "Noto Sans KR", sans-serif'; c.fillStyle = '#6B6259'; c.fillText(Math.round((p[1] - 8.5) * 10) / 10 + ' ~ ' + Math.round((p[1] + 8.5) * 10) / 10 + 'cm 안에 95%', W / 2, y + 125);
    });
    c.font = '400 32px "Noto Sans KR", sans-serif'; c.fillStyle = '#8A948E'; c.fillText('중간 부모 키 공식 · 유전 70~80% · 잠·영양·운동이 나머지', W / 2, H - 170);
    c.font = '400 28px "Noto Sans KR", sans-serif'; c.fillText('bodyzip.com/child-height/', W / 2, H - 96);
    img.src = canvas.toDataURL('image/png'); img.alt = text(s);
  }
  var timer = null;
  function render() { clearTimeout(timer); timer = setTimeout(function () { draw(state()); }, 80); }
  var ready = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('600 100px "IBM Plex Mono"'), document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('400 40px "Noto Sans KR"')]).catch(function () {}) : Promise.resolve();
  ready.then(function () { render(); setTimeout(render, 800); });
  Array.prototype.forEach.call(box.querySelectorAll('input, select'), function (el) { el.addEventListener('input', render); el.addEventListener('change', render); });
  function blob(cb) { var s = state(); draw(s); canvas.toBlob(function (b) { cb(b, s); }, 'image/png'); }
  var save = wrap.querySelector('[data-act="save"]'), share = wrap.querySelector('[data-act="share"]');
  if (save) save.addEventListener('click', function () { blob(function (b, s) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = '아이 예상 키 ' + s.f + '-' + s.m + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }); });
  if (share) {
    if (!(navigator.share && navigator.canShare)) share.hidden = true;
    else share.addEventListener('click', function () { blob(function (b, s) { var f = new File([b], 'child-height.png', { type: 'image/png' }); if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: '우리 아이 예상 키', text: text(s) + ' — bodyzip.com' }).catch(function () {}); }); });
  }
})();
