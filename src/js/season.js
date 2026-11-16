/* 철 페이지 계산 — [data-live="flu"] 독감 무료 대상·횟수·시작일, [data-live="checkup2026"] 올해 검진 대상·항목
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
    end: '2027-04-30', kidsFrom: '2012-01-01', kidsTo: '2026-08-31', kidsStart: '2026-09-21', preg: '2026-09-21', onceBy: '2026.6.30',
    senior: [['75세 이상', '0000-00-00', '1951-12-31', '2026-10-06'], ['70~74세', '1952-01-01', '1956-12-31', '2026-10-12'], ['65~69세', '1957-01-01', '1961-12-31', '2026-10-15']],
    covid: { '75세 이상': '2026-10-12', '70~74세': '2026-10-12', '65~69세': '2026-10-15' }, covidEnd: '2027-06-30'
  };
  function addMonthsIso(iso, n) {   /* 말일 넘침은 그 달 말일로 */
    var p = iso.split('-').map(Number), y = p[0], m = p[1] - 1 + n, d = p[2];
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return y + '-' + ('0' + (m + 1)).slice(-2) + '-' + ('0' + Math.min(d, last)).slice(-2);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="flu"]'), function (box) {
    bind(box, function () {
      var b = q(box, 'birth').value, preg = q(box, 'preg').checked, hist = (q(box, 'hist') || {}).value || 'two', today = todayIso();
      function blank(m) { out(box, 'free', '—'); out(box, 'date', '—'); out(box, 'doses', '—'); out(box, 'msg', m); }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(b)) { blank('생년월일을 넣어 보세요.'); return; }
      if (b > today) { blank('아직 오지 않은 날짜입니다.'); return; }
      var ended = today > FLU.end, tail = ended ? ' 이번 절기 무료 접종은 ' + dot(FLU.end) + '에 끝났습니다.' : '';
      if (preg) {
        out(box, 'free', '무료'); out(box, 'date', md(FLU.preg)); out(box, 'doses', '1회');
        out(box, 'msg', '<b>임신부 (임신 주수와 관계없이)</b>: ' + md(FLU.preg) + '부터 ' + dot(FLU.end) + '까지 전국 위탁의료기관·보건소에서 무료. 산모수첩이나 임신확인서 같은 서류를 보여 주세요.' + tail);
        return;
      }
      if (b >= FLU.kidsFrom && b <= FLU.kidsTo) {
        var six = addMonthsIso(b, 6), start = six > FLU.kidsStart ? six : FLU.kidsStart;
        var nineAgo = (+today.slice(0, 4) - 9) + today.slice(4), under9 = b > nineAgo;   /* 오늘 기준 9세 미만 = 이 날짜 뒤 출생 */
        var two = under9 && hist !== 'two';
        out(box, 'free', '무료'); out(box, 'date', start.slice(0, 4) === FLU.kidsStart.slice(0, 4) ? md(start) : dot(start)); out(box, 'doses', two ? '2회' : '1회');
        var m = '<b>어린이 (생후 6개월~14세, ' + dot(FLU.kidsFrom) + '~' + dot(FLU.kidsTo) + ' 출생)</b>: ';
        m += (six > FLU.kidsStart ? '생후 6개월이 되는 <b>' + dot(six) + '</b>부터' : md(FLU.kidsStart) + '부터') + ' ' + dot(FLU.end) + '까지 무료.';
        if (two) m += ' 9세 미만이고 ' + (hist === 'one' ? FLU.onceBy + '까지 1회만 맞았으니' : '처음 맞거나 기록을 모르니') + ' <b>1개월 간격으로 2회</b>입니다. 두 번째는 첫 접종 1개월 뒤에 맞습니다.';
        else if (under9) m += ' 이미 2회 이상 맞았다면 올해는 1회입니다.';
        else m += ' 9세 이상은 해마다 1회입니다.';
        m += ' 최종 횟수는 예진 의사가 정합니다.' + tail;
        if (six > FLU.end) m = '<b>생후 6개월 미만</b>: 생후 6개월이 되는 ' + dot(six) + '은 이번 절기(' + dot(FLU.end) + '까지)가 끝난 뒤입니다. 다음 절기 일정은 질병관리청 발표를 확인하세요.';
        out(box, 'msg', m);
        if (six > FLU.end) { out(box, 'free', '—'); out(box, 'date', '—'); out(box, 'doses', '—'); }
        return;
      }
      if (b > FLU.kidsTo) {
        out(box, 'free', '대상 아님'); out(box, 'date', '—'); out(box, 'doses', '—');
        out(box, 'msg', '<b>' + dot(FLU.kidsTo) + ' 뒤 출생</b>: 이번 절기 어린이 무료 접종은 ' + dot(FLU.kidsTo) + '까지 태어난 아이가 대상입니다. 독감 백신은 생후 6개월부터 맞을 수 있어, 그 전에는 함께 사는 가족이 맞아 두는 것이 방법입니다.');
        return;
      }
      for (var i = 0; i < FLU.senior.length; i++) {
        var g = FLU.senior[i];
        if (b >= g[1] && b <= g[2]) {
          out(box, 'free', '무료'); out(box, 'date', md(g[3])); out(box, 'doses', '1회');
          out(box, 'msg', '<b>' + g[0] + ' (' + (g[1] === '0000-00-00' ? dot(g[2]) + ' 이전' : dot(g[1]) + '~' + dot(g[2])) + ' 출생)</b>: ' + md(g[3]) + '부터 ' + dot(FLU.end) + '까지 무료. 코로나19 백신(' + md(FLU.covid[g[0]]) + '부터 ' + dot(FLU.covidEnd) + '까지)도 한 번 방문으로 함께 맞도록 권합니다.' + tail);
          return;
        }
      }
      out(box, 'free', '비급여'); out(box, 'date', '—'); out(box, 'doses', '1회');
      out(box, 'msg', '<b>15~64세 (임신부 제외)</b>: 국가 무료 대상이 아니라 비급여로 맞습니다. 값은 병원마다 다릅니다. 만성질환(심장·폐 질환, 당뇨, 신장 기능 이상, 면역저하 등)이 있으면 질병관리청이 꼽는 합병증 위험군이니 접종을 의사와 상의하세요.');
    });
  });

  /* ---------- 건강검진 ---------- */
  var Y = 2026, END = '2026-12-31';
  function daysLeft() { var t = todayIso(); return Math.round((Date.parse(END + 'T00:00:00Z') - Date.parse(t + 'T00:00:00Z')) / 864e5); }
  Array.prototype.forEach.call(document.querySelectorAll('[data-live="checkup2026"]'), function (box) {
    var left = daysLeft();
    out(box, 'dday', left > 0 ? Y + '년 검진 마감 <b>12월 31일(목)</b> · 오늘 기준 <b>' + left + '일</b> 남았습니다' : left === 0 ? '<b>오늘(12월 31일)이 ' + Y + '년 검진 마감일</b>입니다' : Y + '년 검진은 12월 31일에 마감했습니다. 못 받았다면 ' + (Y + 1) + '년에 공단에 전년도 미수검자 추가 신청을 하세요.');
    bind(box, function () {
      var by = parseInt(q(box, 'by').value, 10), sex = q(box, 'sex').value, type = q(box, 'type').value;
      if (!(by >= 1900 && by <= Y)) { out(box, 'yes', '—'); out(box, 'age', '—'); out(box, 'cancer', '—'); out(box, 'msg', '태어난 해를 넣어 보세요.'); out(box, 'items', ''); return; }
      var age = Y - by, even = by % 2 === 0, adult = age >= 20;
      var target = type === 'field' ? true : even && (type === 'office' || adult);
      var why = type === 'field' ? '비사무직은 해마다 대상' : even ? (adult || type === 'office' ? '짝수년생이라 올해 대상' : '20세부터 대상') : '홀수년생은 ' + (Y + 1) + '년 대상';
      var items = ['공통 검사 (혈압·혈액·소변·흉부 X선·구강)'];
      if ((sex === 'm' && age >= 24 && (age - 24) % 4 === 0) || (sex === 'f' && age >= 40 && (age - 40) % 4 === 0)) items.push('이상지질혈증 (콜레스테롤·중성지방)');
      if (age === 40) items.push('B형간염 항원·항체');
      if (age === 40 || age === 50 || age === 60 || age === 70) items.push('생활습관평가');
      if (age === 40) items.push('치면세균막검사');
      if (age === 56) items.push('C형간염 항체');
      if (age === 56 || age === 66) items.push('폐기능검사 (2026년 신설)');
      if (sex === 'f' && (age === 54 || age === 60 || age === 66)) items.push('골밀도');
      if (age >= 66 && (age - 66) % 2 === 0) items.push('인지기능장애');
      if (age >= 20 && age <= 34 && (age - 20) % 2 === 0) items.push('정신건강검사 (우울증·조기정신증)');
      else if (age >= 35) items.push('정신건강검사 (우울증 · 나이대에 한 번, 해당 여부는 공단 조회)');
      if (age === 66 || age === 70 || age === 80) items.push('노인신체기능검사');
      var cancer = [];
      if (age >= 40) cancer.push('위암 (2년마다)');
      if (age >= 50) cancer.push('대장암 (매년 분변잠혈)');
      if (age >= 40) cancer.push('간암 (간경변·B·C형 간염 등 고위험군만, 6개월마다)');
      if (sex === 'f' && age >= 40) cancer.push('유방암 (2년마다)');
      if (sex === 'f' && age >= 20) cancer.push('자궁경부암 (2년마다)');
      if (age >= 54 && age <= 74) cancer.push('폐암 (30갑년 이상 흡연 고위험군만, 2년마다)');
      out(box, 'yes', target ? '대상' : '아님');
      out(box, 'age', age + '세');
      out(box, 'cancer', cancer.length ? cancer.length + '종' : '없음');
      var msg = '<b>' + by + '년생 · 검진 나이 ' + age + '세</b>: ' + why + '.';
      if (target) msg += ' ' + Y + '년 12월 31일까지 받으면 됩니다' + (left > 0 ? '(' + left + '일 남음).' : '.') + (type === 'office' || type === 'field' ? ' 직장가입자는 안 받으면 과태료가 있습니다.' : '');
      else if (!even && type !== 'field') msg += ' 올해는 일반검진 차례가 아니지만, 작년에 못 받았다면 공단에 전년도 미수검자 추가 신청을 할 수 있습니다.';
      out(box, 'msg', msg);
      var html;
      if (age < 20) html = '<p>일반건강검진은 20세부터입니다(직장가입자는 나이와 무관). 영유아·학생 검진은 따로 있습니다.</p>';
      else if (target) html = '<p><b>올해 받는 검사</b>: ' + items.join(' · ') + '</p>' + (cancer.length ? '<p><b>암검진</b>: ' + cancer.join(' · ') + '</p>' : '');
      else html = '<p>' + (Y + 1) + '년에 받는 검사: ' + items.join(' · ') + (cancer.length ? '. 암검진: ' + cancer.join(' · ') : '') + ' (내년 나이 기준으로 조금 달라질 수 있음)</p>';
      out(box, 'items', html);
    });
  });
})();
