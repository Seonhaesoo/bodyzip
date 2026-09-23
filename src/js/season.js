/* 철 페이지 계산 — [data-live="flu"] 독감 무료 대상·시작일, [data-live="checkup2026"] 올해 검진 대상·항목
 * 날짜·출생 범위는 tools/pages-season.mjs 의 FLU·CHK 와 같아야 한다 (해마다 함께 갱신). */
(function () {
  function q(box, k) { return box.querySelector('[data-k="' + k + '"]'); }
  function out(box, k, v) { var el = box.querySelector('[data-out="' + k + '"]'); if (el) el.innerHTML = v; }
  function bind(box, fn) {
    Array.prototype.forEach.call(box.querySelectorAll('input, select'), function (el) { el.addEventListener('input', fn); el.addEventListener('change', fn); });
    box.addEventListener('submit', function (e) { e.preventDefault(); fn(); });
    fn();
  }
  function todayIso() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  function md(iso) { var p = iso.split('-'); return (+p[1]) + '월 ' + (+p[2]) + '일'; }
  function dot(iso) { return iso.replace(/-/g, '.'); }

  /* ---------- 독감 ---------- */
  var FLU = {
    end: '2027-04-30', kidsFrom: '2012-01-01', kidsTo: '2026-08-31', kidsTwo: '2026-09-21', kidsOne: '2026-09-28', preg: '2026-09-21',
    senior: [['75세 이상', '0000-00-00', '1951-12-31', '2026-10-12'], ['70~74세', '1952-01-01', '1956-12-31', '2026-10-15'], ['65~69세', '1957-01-01', '1961-12-31', '2026-10-19']],
    covidStart: '2026-10-12', covidEnd: '2027-06-30'
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="flu"]'), function (box) {
    bind(box, function () {
      var b = q(box, 'birth').value, preg = q(box, 'preg').checked, today = todayIso();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(b)) { out(box, 'free', '—'); out(box, 'date', '—'); out(box, 'now', '—'); out(box, 'msg', '생년월일을 넣어 보세요.'); return; }
      if (b > today) { out(box, 'free', '—'); out(box, 'date', '—'); out(box, 'now', '—'); out(box, 'msg', '아직 오지 않은 날짜입니다.'); return; }
      var res = null, extra = '';
      if (b >= FLU.kidsFrom && b <= FLU.kidsTo) {
        var nineAgo = (+today.slice(0, 4) - 9) + today.slice(4);   /* 오늘 기준 9세 미만 = 이 날짜 뒤 출생 */
        var under9 = b > nineAgo;
        res = { free: true, date: under9 ? FLU.kidsTwo : FLU.kidsOne, who: '어린이 (생후 6개월~14세, ' + dot(FLU.kidsFrom) + '~' + dot(FLU.kidsTo) + ' 출생)' };
        extra = under9
          ? ' 9세 미만이라 <b>올해 처음 맞거나 지금까지 1회만 맞았다면 4주 간격으로 2회</b>(' + md(FLU.kidsTwo) + '부터), 이미 두 번 이상 맞았다면 1회(' + md(FLU.kidsOne) + '부터)입니다.'
          : ' 해마다 1회이며 ' + md(FLU.kidsOne) + '부터입니다.';
      } else if (b > FLU.kidsTo) {
        res = { free: false, who: '생후 6개월 미만' };
        extra = ' 생후 6개월이 되기 전에는 독감 백신을 맞을 수 없습니다. 임신 중이거나 함께 사는 어른이 맞으면 아기를 지켜 줍니다. 6개월이 지나면 이번 절기(' + md(FLU.end) + '까지) 안에 무료로 맞을 수 있습니다.';
      } else {
        for (var i = 0; i < FLU.senior.length; i++) {
          var g = FLU.senior[i];
          if (b >= g[1] && b <= g[2]) {
            res = { free: true, date: g[3], who: g[0] + ' (' + (g[1] === '0000-00-00' ? dot(g[2]) + ' 이전' : dot(g[1]) + '~' + dot(g[2])) + ' 출생)' };
            extra = ' 코로나19 백신도 같은 날 함께 맞도록 권합니다(코로나19는 ' + md(FLU.covidStart) + '부터 ' + dot(FLU.covidEnd) + '까지).';
            break;
          }
        }
      }
      if (preg) { res = { free: true, date: FLU.preg, who: '임신부 (임신 주수와 관계없이)' }; extra = ' 산모수첩이나 임신확인서를 가져가세요. 엄마가 맞으면 생후 6개월 전 아기도 항체를 나눠 받습니다.'; }
      if (!res) { res = { free: false, who: '15~64세 성인' }; extra = ' 국가 지원 대상이 아니라 비급여로 맞습니다. 값은 병원마다 다르고, 직장·학교 단체 접종이 싼 경우가 많습니다. 만성질환이 있거나 노부모·어린 아기와 함께 산다면 10~11월에 꼭 맞아 두세요.'; }
      out(box, 'free', res.free ? '무료' : '비급여');
      out(box, 'date', res.date ? md(res.date) : '—');
      out(box, 'now', res.free ? (today >= res.date ? (today <= FLU.end ? '지금 가능' : '절기 끝') : '아직') : (res.date === undefined && res.who === '생후 6개월 미만' ? '나중에' : '언제든'));
      out(box, 'msg', '<b>' + res.who + '</b> — ' + (res.free ? md(res.date) + '부터 ' + dot(FLU.end) + '까지 전국 위탁의료기관·보건소에서 무료.' : '') + extra);
    });
  });

  /* ---------- 건강검진 ---------- */
  var Y = 2026;
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="checkup2026"]'), function (box) {
    bind(box, function () {
      var by = parseInt(q(box, 'by').value, 10), sex = q(box, 'sex').value, type = q(box, 'type').value;
      if (!(by >= 1900 && by <= Y)) { out(box, 'yes', '—'); out(box, 'age', '—'); out(box, 'cancer', '—'); out(box, 'msg', '태어난 해를 넣어 보세요.'); out(box, 'items', ''); return; }
      var age = Y - by, even = by % 2 === 0, adult = age >= 20;
      var target = type === 'field' ? true : even && (type === 'office' || adult);
      var why = type === 'field' ? '비사무직은 해마다 대상' : even ? (adult || type === 'office' ? '짝수년생이라 올해 대상' : '20세부터 대상') : '홀수년생은 ' + (Y + 1) + '년 대상';
      var items = ['공통 검사 (혈압·혈액·소변·흉부 X선·구강)'];
      if ((sex === 'm' && age >= 24 && (age - 24) % 4 === 0) || (sex === 'f' && age >= 40 && (age - 40) % 4 === 0)) items.push('이상지질혈증 (콜레스테롤·중성지방)');
      if (age === 40) items.push('B형간염 항원·항체');
      if (age === 56) items.push('C형간염 항체');
      if (age === 56 || age === 66) items.push('폐기능검사 (2026년 신설)');
      if (sex === 'f' && (age === 54 || age === 60 || age === 66)) items.push('골밀도');
      if (age >= 66 && (age - 66) % 2 === 0) items.push('인지기능장애');
      if (age >= 20 && age <= 34 && (age - 20) % 2 === 0) items.push('정신건강검사 (우울증)');
      else if (age >= 35) items.push('정신건강검사 (우울증) — 나이대에 한 번, 해당 여부는 공단 조회');
      if (age === 66) items.push('생애전환기 검사 (노인 신체기능)');
      var cancer = [];
      if (age >= 40) cancer.push('위암 (2년마다)');
      if (age >= 50) cancer.push('대장암 (매년 분변잠혈)');
      if (age >= 40) cancer.push('간암 — B·C형 간염 보유자 등 고위험군만 (6개월마다)');
      if (sex === 'f' && age >= 40) cancer.push('유방암 (2년마다)');
      if (sex === 'f' && age >= 20) cancer.push('자궁경부암 (2년마다)');
      if (age >= 54 && age <= 74) cancer.push('폐암 — 30갑년 이상 흡연자만 (2년마다)');
      out(box, 'yes', target ? '대상' : '아님');
      out(box, 'age', age + '세');
      out(box, 'cancer', cancer.length ? cancer.length + '종' : '없음');
      var msg = '<b>' + by + '년생 · 검진 나이 ' + age + '세</b> — ' + why + '.';
      if (target) msg += ' ' + Y + '년 12월 31일까지 받으면 됩니다.' + (type === 'office' || type === 'field' ? ' 직장가입자는 안 받으면 과태료가 있습니다.' : '');
      else if (!even && type !== 'field') msg += ' 올해는 일반검진 차례가 아니지만, 작년에 못 받았다면 공단에 전년도 미수검자 추가 신청을 할 수 있습니다.';
      out(box, 'msg', msg);
      var html;
      if (age < 20) html = '<p>일반건강검진은 20세부터입니다(직장가입자는 나이와 무관). 영유아·학생 검진은 따로 있습니다.</p>';
      else if (target) html = '<p><b>올해 받는 검사</b> — ' + items.join(' · ') + '</p>' + (cancer.length ? '<p><b>암검진</b> — ' + cancer.join(' · ') + '</p>' : '');
      else html = '<p>' + (Y + 1) + '년에 받는 검사 — ' + items.join(' · ') + (cancer.length ? '. 암검진: ' + cancer.join(' · ') : '') + ' (내년 나이 기준으로 조금 달라질 수 있음)</p>';
      out(box, 'items', html);
    });
  });
})();
