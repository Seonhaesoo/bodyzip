/* 탄단지 계산기 — 성별·나이·키·몸무게·활동량·목표·배분 → 하루 칼로리와 탄수화물·단백질·지방 g (window.Bodyzip = engine/body.mjs + macro.mjs) */
(function () {
  var B = window.Bodyzip;
  if (!B || !B.macroPlan || !document.getElementById('mc-form')) return;
  var $ = function (id) { return document.getElementById(id); };
  var n = function (id) { var v = parseFloat(String($(id).value || '').replace(/[^0-9.]/g, '')); return isNaN(v) ? 0 : v; };
  var fmt = function (v) { return Math.round(v).toLocaleString('ko-KR'); };
  function calc() {
    var sex = $('mc-sex').value, age = n('mc-age'), h = n('mc-h'), w = n('mc-w'), act = $('mc-act').value, goal = $('mc-goal').value, split = $('mc-split').value;
    if (!(age > 0 && h > 0 && w > 0)) { $('mc-kcal').textContent = '—'; $('mc-sub').textContent = '나이·키·몸무게를 넣어 주세요'; return; }
    var bmr = B.bmr(sex, h, w, age), t = B.tdee(bmr, act);
    var floor = Math.max(bmr, sex === 'f' ? 1200 : 1500);
    var kcal = goal === 'lose' ? Math.max(floor, t - 500) : goal === 'gain' ? t + 300 : t;
    var p = B.macroPlan(kcal, split);
    $('mc-kcal').textContent = fmt(p.kcal);
    $('mc-sub').textContent = '기초대사량 ' + fmt(bmr) + 'kcal · 하루 필요 ' + fmt(t) + 'kcal' + (goal === 'lose' ? ' − 500' + (kcal === floor && t - 500 < floor ? ' (하한선 ' + fmt(floor) + 'kcal에 맞춤)' : '') : goal === 'gain' ? ' + 300' : '');
    $('mc-c').textContent = p.pick.carb + 'g';
    $('mc-p').textContent = p.pick.protein + 'g';
    $('mc-f').textContent = p.pick.fat + 'g';
    var tips = [];
    tips.push('<b>기준 범위</b>: 탄수화물 ' + p.range.carb[0] + '~' + p.range.carb[1] + 'g · 단백질 ' + p.range.protein[0] + '~' + p.range.protein[1] + 'g · 지방 ' + p.range.fat[0] + '~' + p.range.fat[1] + 'g (2025 섭취기준 비율). 세 끼로 나누면 한 끼에 탄 ' + p.meal.carb + 'g · 단 ' + p.meal.protein + 'g · 지 ' + p.meal.fat + 'g쯤입니다.');
    tips.push('단백질 ' + p.pick.protein + 'g은 몸무게 1kg당 약 ' + (Math.round(p.pick.protein / w * 10) / 10) + 'g입니다.');
    $('mc-tips').innerHTML = tips.map(function (x) { return '<div class="callout">' + x + '</div>'; }).join('');
  }
  Array.prototype.forEach.call(document.querySelectorAll('#mc-form input, #mc-form select'), function (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); });
  $('mc-form').addEventListener('submit', function (e) { e.preventDefault(); calc(); });
  calc();
})();
