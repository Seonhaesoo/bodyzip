/* 기저귀 단계 계산기 — 몸무게(필수)·성별·생년월일 또는 개월 → 맞는 단계, 상한까지 남은 kg, 같은 백분위로 자랄 때 다음 단계 시기, 하루·한 달 개수.
 * 계산은 window.Bodyzip(engine/diaper.mjs + growth.mjs). 입력값은 이 기기 밖으로 나가지 않는다 */
(function () {
  var B = window.Bodyzip;
  if (!B || !B.diaperStep || !document.getElementById('dp-form')) return;
  var $ = function (id) { return document.getElementById(id); };
  var numOf = function (id) { var v = parseFloat(String($(id).value || '').replace(/[^0-9.]/g, '')); return isNaN(v) ? null : v; };

  function months() {
    var b = $('dp-birth').value;
    if (b) {
      var d = (Date.now() - Date.parse(b + 'T00:00:00')) / 864e5;
      if (d >= 0) { var m = Math.round(d / 30.4375 * 10) / 10; $('dp-mo').value = m; return m; }
    }
    return numOf('dp-mo');
  }

  function calc() {
    var kg = numOf('dp-kg'), sex = $('dp-sex').value, mo = months();
    if (kg == null || kg <= 0) { $('dp-step').textContent = '—'; $('dp-sub').textContent = '몸무게를 넣어 주세요'; return; }
    var r = B.diaperStep(kg);
    $('dp-step').textContent = r.over ? B.DIAPER_STEPS[B.DIAPER_STEPS.length - 1].short + ' 이상' : r.main.short;
    $('dp-sub').textContent = r.over ? '가장 큰 단계보다 무겁습니다 — 팬티형 점보·특대 사이즈의 권장 체중을 확인하세요'
      : r.main.label + ' · ' + B.stepRange(r.main) + (r.alt ? ' · ' + r.alt.short + '(' + B.stepRange(r.alt) + ')도 맞는 몸무게' : '');
    $('dp-left').textContent = r.over ? '—' : (r.toTop > 0 ? r.toTop + 'kg' : '상한');
    var o = (mo != null && !r.over) ? B.diaperOutgrow(B, sex, mo, kg) : null;
    $('dp-next').textContent = r.over ? '—' : !r.next ? '마지막 단계' : o && o.month != null ? '약 ' + Math.round(o.month) + '개월' : (mo == null ? '개월을 넣으면' : '한동안 그대로');
    var pd = B.perDayFor(mo != null ? mo : 6);
    $('dp-count').textContent = pd.day[0] + '~' + pd.day[1] + '개 · ' + (pd.day[0] * 30) + '~' + (pd.day[1] * 30) + '개';

    var tips = [];
    if (r.alt) tips.push('<b>' + r.main.short + '와 ' + r.alt.short + '가 모두 맞는 몸무게입니다.</b> ' + (r.main.key > r.alt.key ? r.alt.short + ' 상한(' + r.alt.hi + 'kg)에 가까워 ' + r.main.short + '를 먼저 권합니다. 마르고 다리가 가는 아기라면 ' + r.alt.short + '를 더 써도 됩니다.' : r.main.short + '를 쓰다가 새거나 밴드 자국이 남으면 ' + r.alt.short + '로 올리세요.'));
    if (!r.over && r.toTop <= 1 && r.toTop >= 0) tips.push('지금 단계 상한까지 ' + r.toTop + 'kg 남았습니다. 곧 바꿀 수 있으니 큰 묶음보다 소포장이 낫습니다.');
    if (o && o.month != null && r.next) tips.push('지금 몸무게 백분위대로 자라면 <b>생후 약 ' + Math.round(o.month) + '개월</b>에 ' + r.main.short + ' 상한(' + r.main.hi + 'kg)에 닿고 ' + r.next.short + '로 넘어갑니다. 어림이니 실제로는 새는지·자국이 남는지로 판단하세요.');
    if (mo != null && mo >= 0 && mo <= 60) {
      var g = B.growthCheck ? B.growthCheck('weight', sex, mo, kg) : null;
      if (g && g.pct != null) tips.push('생후 ' + mo + '개월 ' + (sex === 'f' ? '여아' : '남아') + ' ' + kg + 'kg은 또래 몸무게 ' + g.pct + '백분위입니다. <a href="/baby/percentile/">성장 백분위 자세히 →</a>');
    }
    $('dp-tips').innerHTML = tips.map(function (t) { return '<div class="callout">' + t + '</div>'; }).join('');
  }
  Array.prototype.forEach.call(document.querySelectorAll('#dp-form input, #dp-form select'), function (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); });
  $('dp-form').addEventListener('submit', function (e) { e.preventDefault(); calc(); });
  calc();
})();
