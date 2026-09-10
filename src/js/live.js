/* 바디집 — 그 자리에서 계산하는 화면들 (window.Bodyzip 엔진)
 * [data-live="bmr"] 기초대사량 · [data-live="bodyfat"] 체지방 · [data-live="baby"] 아기 개월수 · [data-live="due"] 출산예정일 · [data-live="cycle"] 배란일 · [data-live="bmi"] BMI */
(function () {
  var M = window.Bodyzip; if (!M) return;
  var num = M.num;
  function q(box, k) { return box.querySelector('[data-k="' + k + '"]'); }
  function out(box, k, v) { var el = box.querySelector('[data-out="' + k + '"]'); if (el) el.textContent = v; }
  function val(box, k) { var el = q(box, k); return el ? parseFloat(el.value) || 0 : 0; }
  function sel(box, k) { var el = q(box, k); return el ? el.value : ''; }
  function dateOf(box, k) { var v = sel(box, k); if (!v) return null; var p = v.split('-').map(Number); return M.utc(p[0], p[1], p[2]); }
  function today() { var t = new Date(Date.now() + 9 * 3600e3); return M.utc(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); }

  function blobLink(a, text, name) { try { if (a._url) URL.revokeObjectURL(a._url); a._url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' })); a.href = a._url; a.download = name; a.hidden = false; } catch (e) { a.hidden = true; } }
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
      var ics = box.querySelector('[data-out="ics"]'); if (ics && M.pregnancyIcs) { if (box.getAttribute('data-lmp') === M.iso(l) && box.getAttribute('data-ics')) { ics.href = box.getAttribute('data-ics'); ics.removeAttribute('download'); } else blobLink(ics, M.pregnancyIcs(l), '임신 일정 ' + M.iso(l) + '.ics'); }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-live="cycle"]'), function (box) {
    bind(box, function () {
      var l = dateOf(box, 'lmp'); if (!l) return;
      var len = Math.min(45, Math.max(20, val(box, 'len') || 28)), c = M.cycle(l, len);
      out(box, 'ov', M.fmt(c.ovulation)); out(box, 'fertile', M.fmtShort(c.fertileStart) + ' ~ ' + M.fmtShort(c.fertileEnd)); out(box, 'next', M.fmt(c.next));
      var ics = box.querySelector('[data-out="ics"]'); if (ics && M.cycleIcs) { if (len === 28 && box.getAttribute('data-lmp') === M.iso(l) && box.getAttribute('data-ics')) { ics.href = box.getAttribute('data-ics'); ics.removeAttribute('download'); } else blobLink(ics, M.cycleIcs(l, len), '생리주기 ' + len + '일 ' + M.iso(l) + '.ics'); }
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

  /* 성장 백분위 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="percentile"]'), function (box) {
    bind(box, function () {
      var sex = sel(box, 'sex') || 'm', b = dateOf(box, 'birth'), mo = val(box, 'month');
      if (b) { var dd = M.diffDays(b, today()); if (dd >= 0) { mo = Math.round(M.monthsFromDays(dd) * 10) / 10; var mi = q(box, 'month'); if (mi && document.activeElement !== mi) mi.value = mo; } }
      mo = Math.max(0, Math.min(M.MAX_MONTH, mo || 0));
      var notes = [];
      [['w', 'weight', 'wp'], ['h', 'length', 'hp'], ['hc', 'head', 'hcp']].forEach(function (o) {
        var v = val(box, o[0]); if (!v) { out(box, o[2], '—'); return; }
        var r = M.growthCheck(o[1], sex, mo, v); out(box, o[2], r.pct + '백분위');
        notes.push(M.MEASURES[o[1]].label + ': ' + r.band.label + ' (중간값 ' + r.median + M.MEASURES[o[1]].unit + ')');
      });
      out(box, 'note', notes.length ? notes.join(' · ') : '몸무게·키·머리둘레 가운데 아는 것만 넣어도 됩니다.');
      var link = box.querySelector('[data-out="link"]'); if (link) { var mm = Math.max(0, Math.min(36, Math.round(mo))); link.href = '/baby/percentile/' + (sex === 'f' ? 'girl' : 'boy') + '/' + mm + '/'; link.textContent = (sex === 'f' ? '여아 ' : '남아 ') + mm + '개월 백분위표 →'; }
    });
  });

  /* 분유 수유량 (미국소아과학회 1kg당 하루 165ml · 960ml 이내) */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="formula"]'), function (box) {
    bind(box, function () {
      var b = dateOf(box, 'birth'), days = val(box, 'mo') * 30.4375, kg = val(box, 'kg'), fe = parseInt(sel(box, 'feeds'), 10) || 0;
      if (b) { var dd = M.diffDays(b, today()); if (dd >= 0) { days = dd; var mi = q(box, 'mo'); if (mi && document.activeElement !== mi) mi.value = Math.round(dd / 30.4375 * 10) / 10; } }
      var p = M.formulaPlan(days, kg, fe), mm = Math.max(0, Math.min(12, Math.floor(days / 30.4375))), link = box.querySelector('[data-out="link"]');
      if (p.stage === 'week1') { out(box, 'per', '30~60ml'); out(box, 'feeds', '8~12회'); out(box, 'daily', '—'); out(box, 'interval', '2~3시간'); out(box, 'note', '태어나서 1주까지는 1회 30~60ml로 시작해 배고파할 때마다 먹입니다(미국 CDC·소아과학회). 몸무게로 계산하는 하루 총량은 1주가 지난 뒤부터 봅니다.'); }
      else if (p.stage === 'weight') {
        if (!kg) { ['per', 'feeds', 'daily', 'interval'].forEach(function (k) { out(box, k, '—'); }); out(box, 'note', '몸무게를 넣으면 하루 총량과 1회량이 나옵니다.'); }
        else { out(box, 'per', p.per + 'ml'); out(box, 'feeds', p.feeds + '회'); out(box, 'daily', num(p.daily) + 'ml'); out(box, 'interval', '평균 ' + p.hours + '시간'); out(box, 'note', (p.capped ? '몸무게로는 ' + num(p.raw) + 'ml지만 하루 960ml를 넘기지 않게 잡았습니다. ' : '') + (kg < 2.5 ? '2.5kg 미만이면 병원에서 정한 양을 먼저 따르세요. ' : '') + '1kg당 하루 165ml 기준입니다. 아기가 덜 먹거나 더 원하면 신호를 따르세요.'); }
      } else if (p.stage === 'solids') { out(box, 'per', '180~240ml'); out(box, 'feeds', p.feeds[0] === p.feeds[1] ? p.feeds[0] + '회' : p.feeds[0] + '~' + p.feeds[1] + '회'); out(box, 'daily', num(p.daily[0]) + '~' + num(p.daily[1]) + 'ml'); out(box, 'interval', '이유식 사이'); out(box, 'note', p.solids + '와 함께 먹는 시기입니다. 이유식을 잘 먹을수록 분유는 줄어듭니다.'); }
      else { out(box, 'per', '—'); out(box, 'feeds', '—'); out(box, 'daily', '우유 ' + p.milk[0] + '~' + p.milk[1] + 'ml'); out(box, 'interval', '끼니 사이'); out(box, 'note', '돌이 지나면 분유 대신 생우유와 밥(하루 3끼 + 간식 2회)으로 바꿉니다.'); }
      if (link) { link.href = '/baby/formula/' + mm + '/'; link.textContent = mm === 12 ? '돌 아기 우유량 →' : (mm ? '생후 ' + mm + '개월' : '신생아') + ' 분유량 표 →'; }
    });
  });

  /* 어린이·청소년 백분위 (만 3~18세, 2017 소아청소년 성장도표) */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="kids"]'), function (box) {
    bind(box, function () {
      var sex = sel(box, 'sex') || 'm', b = dateOf(box, 'birth'), months = val(box, 'y') * 12 + val(box, 'mo');
      if (b) { var dd = M.diffDays(b, today()); if (dd >= 0) { months = dd / 30.4375; var yy = Math.floor(months / 12), mm = Math.floor(months - yy * 12), yi = q(box, 'y'), mi = q(box, 'mo'); if (yi && document.activeElement !== yi) yi.value = yy; if (mi && document.activeElement !== mi) mi.value = mm; } }
      var h = val(box, 'h'), w = val(box, 'w'), link = box.querySelector('[data-out="link"]'), s2 = sex === 'f' ? 'girl' : 'boy';
      ['hp', 'wp', 'bp', 'adult'].forEach(function (k) { out(box, k, '—'); });
      if (months < 36) { out(box, 'note', '만 3세 미만은 WHO 기준 아기 성장 백분위에서 봅니다.'); if (link) { link.href = '/baby/percentile/'; link.textContent = '아기 성장 백분위 →'; } return; }
      if (months >= 228) { out(box, 'note', '만 18세까지 계산합니다. 어른은 BMI로 봅니다.'); if (link) { link.href = '/bmi/'; link.textContent = 'BMI 계산 →'; } return; }
      var notes = [], y = Math.floor(months / 12);
      if (h) { var rh = M.kidsCheck('height', sex, months, h); out(box, 'hp', rh.pct + ' · ' + M.kidsRank(rh.pct)); notes.push('키 ' + rh.band.label + ' · 또래 한가운데 ' + rh.median + 'cm'); if (months < 204) out(box, 'adult', M.trackAdult(sex, months, h) + 'cm'); }
      if (w) { var rw = M.kidsCheck('weight', sex, months, w); out(box, 'wp', String(rw.pct)); notes.push('몸무게 ' + rw.band.label + ' · 한가운데 ' + rw.median + 'kg'); }
      if (h && w) { var bmi = M.kidsBmi(h, w), rb = M.kidsCheck('bmi', sex, months, bmi); out(box, 'bp', bmi + ' · ' + rb.pct); notes.push('BMI ' + rb.band.label); }
      out(box, 'note', notes.length ? notes.join(' / ') : '키와 몸무게 가운데 아는 것만 넣어도 됩니다.');
      if (link) { var rg = M.kidsHeightRange(sex, y), hr = Math.round(h); if (h && hr >= rg[0] && hr <= rg[1]) { link.href = '/kids/' + y + '-' + s2 + '/' + hr + '/'; link.textContent = '만 ' + y + '세 ' + hr + 'cm 자세히 →'; } else { link.href = '/kids/' + y + '-' + s2 + '/'; link.textContent = '만 ' + y + '세 ' + (sex === 'f' ? '여자' : '남자') + ' 백분위표 →'; } }
    });
  });

  /* 반려동물 나이 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="petage"]'), function (box) {
    var kind = box.getAttribute('data-kind') || 'dog';
    bind(box, function () {
      var y = val(box, 'y') || 1, size = sel(box, 'size') || 'small';
      out(box, 'human', (kind === 'cat' ? M.catAge(y) : M.dogAge(y, size)) + '세'); out(box, 'stage', M.petStage(kind, y, size).split(' —')[0]);
      if (kind === 'dog') { var lg = M.dogAgeLog(y); out(box, 'log', lg == null ? '— (1살부터)' : lg + '세'); }
    });
  });

  /* 반려동물 사료량 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="petfood"]'), function (box) {
    var kind = box.getAttribute('data-kind') || 'dog';
    bind(box, function () {
      var kg = val(box, 'kg') || 5, f = sel(box, 'factor') || 'neutered', kcal = val(box, 'kcal') || M.KCAL_PER_100G;
      var r = M.petFood(kind, kg, f, kcal);
      out(box, 'grams', r.grams + 'g'); out(box, 'der', num(r.der) + 'kcal'); out(box, 'meal', r.perMeal2 + 'g / ' + r.perMeal3 + 'g');
    });
  });

  /* 반려동물 예방접종 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="petvac"]'), function (box) {
    var kind = box.getAttribute('data-kind') || 'dog', name = kind === 'cat' ? '고양이' : '강아지';
    bind(box, function () {
      var b = dateOf(box, 'birth'); if (!b) return;
      var t = today(), days = M.diffDays(b, t), ics = box.querySelector('[data-out="ics"]'), link = box.querySelector('[data-out="link"]');
      if (days < 0) { out(box, 'age', '아직 태어나기 전'); out(box, 'next', '—'); out(box, 'hw', '—'); if (ics) ics.hidden = true; return; }
      out(box, 'age', Math.floor(days / 7) + '주 (' + num(days) + '일)');
      var rows = []; M.petVaccineDates(kind, b).forEach(function (v) { v.doses.forEach(function (d) { rows.push({ n: v.name, d: d.date }); }); }); rows.sort(function (a, c) { return a.d - c.d; });
      var nx = null; for (var i = 0; i < rows.length; i++) if (rows[i].d >= t) { nx = rows[i]; break; }
      out(box, 'next', nx ? nx.n.split(' (')[0] + ' · ' + M.fmtShort(nx.d) : '연간 추가 접종만'); out(box, 'hw', M.fmt(M.heartwormStart(b)));
      if (link) { if (days <= 365) { link.href = '/pet/' + kind + '-vaccine/' + M.iso(b) + '/'; link.textContent = M.fmt(b) + '생 일정 표 →'; } else { link.href = '/pet/' + kind + '-vaccine/'; link.textContent = '일정 표는 최근 1년생만 →'; } }
      if (ics && M.petIcs) { if (days <= 365) { ics.hidden = false; ics.href = '/pet/' + kind + '-vaccine/' + M.iso(b) + '/vaccines.ics'; ics.removeAttribute('download'); } else blobLink(ics, M.petIcs(kind, b), name + ' 예방접종 ' + M.iso(b) + '.ics'); }
    });
  });

  /* 카페인 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="caffeine"]'), function (box) {
    bind(box, function () {
      var total = 0; M.CAFFEINE.forEach(function (c) { var n = val(box, 'c-' + c.key); if (n) total += n * c.mg; });
      var mode = sel(box, 'limit') || '400', kg = val(box, 'kg') || 50, lim = M.caffeineLimit(mode, kg);
      var last = sel(box, 'last') || '14:00', bed = sel(box, 'bed') || '23:00', lp = last.split(':').map(Number), bp = bed.split(':').map(Number);
      var hrs = (bp[0] * 60 + bp[1] - (lp[0] * 60 + lp[1])) / 60; if (hrs < 0) hrs += 24;
      var left = M.caffeineLeft(total, hrs);
      out(box, 'total', total + 'mg'); out(box, 'ratio', Math.round(total / lim * 100) + '% (기준 ' + lim + 'mg)'); out(box, 'left', left + 'mg');
      out(box, 'note', !total ? '마신 잔 수를 넣어 주세요.' : total > lim ? '하루 기준을 넘었습니다. 오늘은 여기까지.' : left > 100 ? '잘 때 ' + left + 'mg이 남아 잠들기 어려울 수 있습니다. 마지막 잔을 앞당겨 보세요.' : '기준 안이고 잘 때 남는 양도 적습니다.');
    });
  });

  /* 금연 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="quit"]'), function (box) {
    bind(box, function () {
      var d0 = dateOf(box, 'date'); if (!d0) return;
      var days = M.diffDays(d0, today()); if (days < 0) { out(box, 'days', '아직 시작 전'); return; }
      var per = val(box, 'per') || 20, price = val(box, 'price') || 4500, r = M.quitStats(days, per, price), st = M.quitStage(days), y = M.quitStats(365, per, price);
      out(box, 'days', days + '일'); out(box, 'cigs', num(r.cigs) + '개비'); out(box, 'money', num(r.money) + '원'); out(box, 'life', r.lifeText); out(box, 'stage', st.label + ' — ' + st.text); out(box, 'year', num(y.money) + '원');
    });
  });

  /* 건강검진 — 단일 수치 */
  function simple(kind, fn, fmt) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-live="' + kind + '"]'), function (box) {
      bind(box, function () {
        var v = val(box, 'v'); if (!v) return;
        var r = fn(v, sel(box, 'sex') || 'm');
        out(box, 'label', r.label); out(box, 'note', r.note);
        var link = box.querySelector('[data-out="link"]'); if (link) link.href = fmt(v);
      });
    });
  }
  var nearOf = function (arr, v) { if (!arr || !arr.length) return v; return arr.reduce(function (a, b) { return Math.abs(b - v) < Math.abs(a - v) ? b : a; }); };
  var G2 = window.BODYZIP_GRID || {};
  simple('glucose', M.glucose, function (v) { return '/glucose/' + nearOf(G2.glu, v) + '/'; });
  simple('chol', M.totalChol, function (v) { return '/cholesterol/' + nearOf(G2.tc, v) + '/'; });
  simple('ldl', M.ldl, function (v) { return '/ldl/' + nearOf(G2.ldl, v) + '/'; });
  simple('hdl', M.hdl, function (v) { return '/hdl/' + nearOf(G2.hdl, v) + '/'; });
  simple('tg', M.triglyceride, function (v) { return '/triglyceride/' + nearOf(G2.tg, v) + '/'; });
  simple('uric', function (v, sex) { return M.uric(v, sex); }, function (v) { return '/uric/' + nearOf(G2.uric, v) + '/'; });

  /* 혈압 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="bp"]'), function (box) {
    bind(box, function () {
      var s = val(box, 'sys'), d = val(box, 'dia'); if (!s || !d) return;
      var r = M.bloodPressure(s, d);
      out(box, 'label', r.label); out(box, 'pulse', r.pulse + 'mmHg'); out(box, 'note', r.note);
      var link = box.querySelector('[data-out="link"]');
      if (link) link.href = '/bp/' + nearOf(G2.sys, s) + '-' + nearOf(G2.dia, d) + '/';
    });
  });

  /* 간수치 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="liver"]'), function (box) {
    bind(box, function () {
      var a = val(box, 'ast'), b = val(box, 'alt'); if (!a && !b) return;
      var r = M.liver(a, b);
      out(box, 'label', r.label); out(box, 'ratio', r.ratio == null ? '—' : r.ratio + (r.alcoholHint ? ' (음주 의심)' : ''));
      out(box, 'note', r.note);
      var link = box.querySelector('[data-out="link"]'); if (link) link.href = '/liver/' + nearOf(G2.alt, b || a) + '/';
    });
  });

  /* 검진 종합 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="checkup"]'), function (box) {
    bind(box, function () {
      var v = {}, keys = ['sys', 'dia', 'glucose', 'hba1c', 'total', 'hdl', 'ldl', 'tg', 'ast', 'alt', 'ggt', 'uric'];
      keys.forEach(function (k) { var x = val(box, k); if (x) v[k] = x; });
      var r = M.summary(v, sel(box, 'sex') || 'm');
      out(box, 'summary', r.text);
      var tb = box.querySelector('[data-out="rows"]');
      if (tb) tb.innerHTML = r.rows.length ? r.rows.map(function (x) {
        return '<tr><td>' + x.name + '</td><td>' + x.value + '<small>' + x.unit + '</small></td><td>' + x.label + '<small>' + x.note + '</small></td></tr>';
      }).join('') : '<tr><td colspan="3">수치를 넣으면 여기에 판정이 나옵니다</td></tr>';
    });
  });
})();
