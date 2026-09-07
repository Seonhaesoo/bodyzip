/* 몸자 — 그 자리에서 계산하는 화면들 (window.Momja 엔진)
 * [data-live="bmr"] 기초대사량 · [data-live="bodyfat"] 체지방 · [data-live="baby"] 아기 개월수 · [data-live="due"] 출산예정일 · [data-live="cycle"] 배란일 · [data-live="bmi"] BMI */
(function () {
  var M = window.Momja; if (!M) return;
  var num = M.num;
  function q(box, k) { return box.querySelector('[data-k="' + k + '"]'); }
  function out(box, k, v) { var el = box.querySelector('[data-out="' + k + '"]'); if (el) el.textContent = v; }
  function val(box, k) { var el = q(box, k); return el ? parseFloat(el.value) || 0 : 0; }
  function sel(box, k) { var el = q(box, k); return el ? el.value : ''; }
  function dateOf(box, k) { var v = sel(box, k); if (!v) return null; var p = v.split('-').map(Number); return M.utc(p[0], p[1], p[2]); }
  function today() { var t = new Date(Date.now() + 9 * 3600e3); return M.utc(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); }

  function bind(box, fn) {
    Array.prototype.forEach.call(box.querySelectorAll('input, select'), function (el) { el.addEventListener('input', fn); el.addEventListener('change', fn); });
    box.addEventListener('submit', function (e) { e.preventDefault(); fn(); });
    fn();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-live="bmr"]'), function (box) {
    bind(box, function () {
      var sex = sel(box, 'sex') || 'm', cm = val(box, 'h') || 170, kg = val(box, 'w') || 65, age = val(box, 'age') || 30, act = sel(box, 'act') || 'light';
      var b = M.bmr(sex, cm, kg, age), t = M.tdee(b, act);
      out(box, 'bmr', num(b)); out(box, 'tdee', num(t)); out(box, 'lose', num(t - 500)); out(box, 'gain', num(t + 300));
      out(box, 'hb', num(M.bmrHB(sex, cm, kg, age)));
      var p = M.protein(kg); out(box, 'protein', p.base + '~' + p.active + 'g');
      var bm = M.bmiOf(cm, kg); out(box, 'bmi', bm.bmi + ' · ' + bm.label);
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-live="bodyfat"]'), function (box) {
    bind(box, function () {
      var sex = sel(box, 'sex') || 'm', cm = val(box, 'h') || 170, waist = val(box, 'waist') || 80, neck = val(box, 'neck') || 38, hip = val(box, 'hip') || 95;
      var hipRow = box.querySelector('[data-row="hip"]'); if (hipRow) hipRow.hidden = sex !== 'f';
      if (sex === 'm' && waist <= neck) { out(box, 'pct', '—'); out(box, 'cat', '허리가 목보다 커야 합니다'); return; }
      if (sex === 'f' && waist + hip <= neck) { out(box, 'pct', '—'); out(box, 'cat', '값을 확인하세요'); return; }
      var p = M.bodyFatNavy(sex, cm, waist, neck, hip);
      out(box, 'pct', p + '%'); out(box, 'cat', M.bodyFatCat(sex, p));
      var kg = val(box, 'w'); if (kg) { out(box, 'fat', Math.round(kg * p / 100 * 10) / 10 + 'kg'); out(box, 'lean', Math.round(kg * (1 - p / 100) * 10) / 10 + 'kg'); }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-live="baby"]'), function (box) {
    bind(box, function () {
      var b = dateOf(box, 'birth'); if (!b) return;
      var t = today(), a = M.ageOn(b, t);
      out(box, 'age', a.months + '개월 ' + a.days + '일'); out(box, 'days', num(a.totalDays) + '일째'); out(box, 'weeks', a.weeks + '주');
      out(box, 'year', a.years + '세 ' + a.remMonths + '개월'); out(box, 'growth', M.growthText(a.months));
      var link = box.querySelector('[data-out="link"]'); if (link) { link.href = '/baby/' + M.iso(b) + '/'; link.textContent = M.fmt(b) + '생 접종 일정·개월수 표 →'; }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-live="due"]'), function (box) {
    bind(box, function () {
      var l = dateOf(box, 'lmp'); if (!l) return;
      var p = M.pregnancy(l), w = M.weeksOn(l, today());
      out(box, 'due', M.fmt(p.due) + ' (' + M.wd(p.due) + ')'); out(box, 'week', w.weeks + '주 ' + w.rem + '일 (' + w.trimester + '분기)');
      out(box, 'left', Math.max(0, M.diffDays(today(), p.due)) + '일 남음');
      var link = box.querySelector('[data-out="link"]'); if (link) { var mm = l.getUTCMonth() + 1, dd = l.getUTCDate(); link.href = '/due-date/' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd + '/'; }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-live="cycle"]'), function (box) {
    bind(box, function () {
      var l = dateOf(box, 'lmp'); if (!l) return;
      var len = val(box, 'len') || 28, c = M.cycle(l, len);
      out(box, 'ov', M.fmt(c.ovulation)); out(box, 'fertile', M.fmtShort(c.fertileStart) + ' ~ ' + M.fmtShort(c.fertileEnd)); out(box, 'next', M.fmt(c.next));
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-live="bmi"]'), function (box) {
    bind(box, function () {
      var cm = val(box, 'h') || 170, kg = val(box, 'w') || 65;
      var b = M.bmiOf(cm, kg), r = M.normalRange(cm), tn = M.toNormal(cm, kg);
      out(box, 'bmi', b.bmi); out(box, 'cat', b.label); out(box, 'range', r.min + '~' + r.max + 'kg');
      out(box, 'to', tn.dir === 'ok' ? '정상 범위 안' : (tn.dir === 'lose' ? '−' : '+') + tn.kg + 'kg');
      var link = box.querySelector('[data-out="link"]'); if (link) link.href = '/bmi/' + Math.round(cm) + '/' + Math.round(kg) + '/';
    });
  });
})();
