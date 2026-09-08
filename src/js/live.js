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
      out(box, 'bmr', num(b)); out(box, 'tdee', num(t)); out(box, 'lose', num(Math.max(b, t - 500))); out(box, 'gain', num(t + 300));
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
      var link = box.querySelector('[data-out="link"]');
      if (a.totalDays < 0) { out(box, 'age', '아직 태어나기 전'); out(box, 'days', (-a.totalDays) + '일 남음'); out(box, 'year', '—'); out(box, 'growth', '출산예정일 계산은 임신 메뉴에서.'); if (link) link.hidden = true; var ics0 = box.querySelector('[data-out="ics"]'); if (ics0) ics0.hidden = true; return; }
      out(box, 'age', a.months + '개월 ' + a.days + '일'); out(box, 'days', num(a.totalDays) + '일째'); out(box, 'weeks', a.weeks + '주');
      out(box, 'year', a.years + '세 ' + a.remMonths + '개월'); out(box, 'growth', M.growthText(a.months));
      if (link) { link.hidden = false; if (a.totalDays > 3 * 365) { link.href = '/baby/'; link.textContent = '접종 일정 표는 만 3세까지 제공 →'; } else { link.href = '/baby/' + M.iso(b) + '/'; link.textContent = M.fmt(b) + '생 접종 일정·개월수 표 →'; } }
      var ics = box.querySelector('[data-out="ics"]');
      if (ics && M.babyIcs) {
        ics.hidden = false;
        if (a.totalDays <= 3 * 365) { ics.href = '/baby/' + M.iso(b) + '/vaccines.ics'; ics.removeAttribute('download'); }
        else { try { if (ics._url) URL.revokeObjectURL(ics._url); ics._url = URL.createObjectURL(new Blob([M.babyIcs(b)], { type: 'text/calendar;charset=utf-8' })); ics.href = ics._url; ics.download = '아기 예방접종 ' + M.iso(b) + '.ics'; } catch (e) { ics.hidden = true; } }
      }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-live="due"]'), function (box) {
    bind(box, function () {
      var l = dateOf(box, 'lmp'); if (!l) return;
      var p = M.pregnancy(l), w = M.weeksOn(l, today()), left = M.diffDays(today(), p.due);
      out(box, 'due', M.fmt(p.due) + ' (' + M.wd(p.due) + ')');
      out(box, 'week', w.days < 0 ? '아직 시작 전' : w.weeks + '주 ' + w.rem + '일 (' + w.trimester + '분기)');
      out(box, 'left', left < 0 ? '예정일 ' + (-left) + '일 지남' : left + '일 남음');
      var link = box.querySelector('[data-out="link"]'); if (link) { var mm = l.getUTCMonth() + 1, dd = l.getUTCDate(); link.href = '/due-date/' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd + '/'; }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-live="cycle"]'), function (box) {
    bind(box, function () {
      var l = dateOf(box, 'lmp'); if (!l) return;
      var len = Math.min(45, Math.max(20, val(box, 'len') || 28)), c = M.cycle(l, len);
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

  /* 걸음 수 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="steps"]'), function (box) {
    bind(box, function () {
      var n = Math.max(0, Math.round(val(box, 'n'))) || 10000, kg = val(box, 'w') || 60, cm = val(box, 'h') || 170;
      var r = M.steps(n, kg, cm);
      out(box, 'km', r.km + 'km'); out(box, 'min', r.minutes + '분'); out(box, 'kcal', num(r.kcal) + 'kcal');
      var link = box.querySelector('[data-out="link"]'); if (link) { var s = Math.max(1000, Math.min(30000, Math.round(n / 1000) * 1000)); link.href = '/steps/' + s + '/'; link.textContent = num(s) + '보 표 →'; }
    });
  });

  /* 수면 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="sleep"]'), function (box) {
    bind(box, function () {
      var w = sel(box, 'wake') || '07:00', b = sel(box, 'bed');
      var wp = w.split(':').map(Number), bt = M.bedtimes(wp[0], wp[1]);
      out(box, 'b6', bt[0].time); out(box, 'b5', bt[1].time); out(box, 'b4', bt[2].time);
      var bp; if (b) bp = b.split(':').map(Number); else { var now = new Date(); bp = [now.getHours(), now.getMinutes()]; }
      var wt = M.waketimes(bp[0], bp[1]);
      out(box, 'n6', wt[0].time); out(box, 'n5', wt[1].time); out(box, 'n4', wt[2].time);
    });
  });

  /* 아이 키 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="child"]'), function (box) {
    bind(box, function () {
      var f = val(box, 'f') || 175, m = val(box, 'm') || 162, c = M.childHeight(f, m);
      out(box, 'boy', c.boy + 'cm'); out(box, 'girl', c.girl + 'cm'); out(box, 'range', '아들 ' + Math.round((c.boy - 8.5) * 10) / 10 + '~' + Math.round((c.boy + 8.5) * 10) / 10);
      var link = box.querySelector('[data-out="link"]'); if (link) { var ff = Math.max(160, Math.min(190, Math.round(f))), mm = Math.max(150, Math.min(175, Math.round(m))); link.href = '/child-height/' + ff + '-' + mm + '/'; }
    });
  });

  /* 혈중알코올 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="alcohol"]'), function (box) {
    bind(box, function () {
      var key = sel(box, 'drink') || 'soju', n = val(box, 'n') || 1, kg = val(box, 'w') || 70, sex = sel(box, 'sex') || 'm', hrs = val(box, 'hrs') || 0;
      var d = null; for (var i = 0; i < M.DRINKS.length; i++) if (M.DRINKS[i].key === key) d = M.DRINKS[i];
      if (!d) return;
      var g = M.alcoholGrams(d.ml * n, d.abv), r = M.bac(g, kg, sex, hrs);
      out(box, 'peak', r.peak + '%'); out(box, 'now', r.now + '%'); out(box, 'level', M.bacLevel(r.now).split(' (')[0]);
      out(box, 'drive', r.driveHours <= 0 ? '기준 미만' : '마지막 잔 뒤 ' + r.driveHours + '시간'); out(box, 'sober', '마지막 잔 뒤 ' + r.soberHours + '시간'); out(box, 'grams', Math.round(g) + 'g');
    });
  });

  /* 다이어트 기간 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="diet"]'), function (box) {
    bind(box, function () {
      var from = val(box, 'from') || 75, to = val(box, 'to') || 68, def = val(box, 'def') || 500;
      if (to >= from) { out(box, 'diff', '목표가 지금보다 작아야'); out(box, 'weeks', '—'); out(box, 'date', '—'); out(box, 'perweek', '—'); return; }
      var p = M.dietPlan(from, to, def), end = M.addDays(today(), p.days);
      out(box, 'diff', p.diff + 'kg'); out(box, 'weeks', p.weeks + '주 (' + p.days + '일)'); out(box, 'date', M.fmt(end)); out(box, 'perweek', p.perWeek);
      var link = box.querySelector('[data-out="link"]'); if (link) { var k = Math.max(1, Math.min(30, Math.round(p.diff))); link.href = '/diet/' + k + '/'; link.textContent = k + 'kg 감량 표 →'; }
    });
  });

  /* 임신 주차 → 예정일 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="week"]'), function (box) {
    bind(box, function () {
      var w = Math.max(0, Math.min(45, Math.round(val(box, 'w')))), d = Math.max(0, Math.min(6, Math.round(val(box, 'd'))));
      var t = today(), lmp = M.addDays(t, -(w * 7 + d)), due = M.addDays(lmp, 280), left = M.diffDays(t, due);
      out(box, 'due', M.fmt(due) + ' (' + M.wd(due) + ')'); out(box, 'left', left >= 0 ? left + '일 남음' : (-left) + '일 지남'); out(box, 'lmp', M.fmt(lmp));
      var link = box.querySelector('[data-out="link"]'); if (link) { var mm = lmp.getUTCMonth() + 1, dd = lmp.getUTCDate(); link.href = '/due-date/' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd + '/'; }
      var wl = box.querySelector('[data-out="wlink"]'); if (wl) { var ww = Math.max(1, Math.min(42, w || 1)); wl.href = '/pregnancy/week/' + ww + '/'; wl.textContent = '임신 ' + ww + '주 안내 →'; }
    });
  });
})();
