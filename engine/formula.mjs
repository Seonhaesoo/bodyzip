/* 분유 수유량 — 미국소아과학회(AAP) HealthyChildren 「Amount and Schedule of Baby Formula Feedings」(2022):
 *   하루 몸무게 1파운드(453g)당 약 2.5온스(75ml) ≈ 1kg당 165ml, 하루 평균 32온스(960ml) 이내,
 *   첫 주 1회 30~60ml → 첫 달 동안 90~120ml까지, 6개월 무렵 1회 180~240ml × 4~5회.
 * 미국 CDC 「How Much and How Often to Feed Infant Formula」(2026): 신생아는 2~3시간마다 30~60ml(하루 8~12회), 이후 3~4시간마다.
 * 개월별 하루 횟수는 두 기관의 간격을 이은 기준값이고, 6개월부터는 이유식이 늘면서 분유가 줄어든다 */
export const ML_PER_KG = 165;
export const DAY_MAX = 960;
export const FIRST_WEEK = { per: [30, 60], feeds: [8, 12] };
export const FEEDS = [8, 7, 6, 6, 5, 5];                                   /* 0~5개월 하루 횟수 기준 */
export const FEEDS_RANGE = [[7, 8], [6, 8], [6, 7], [5, 6], [5, 6], [4, 5]];
export const FEEDS_TEXT = FEEDS_RANGE.map(([a, b]) => `${a}~${b}회`);
/* 6~12개월 — 이유식과 함께. 1회 180~240ml(AAP 6개월 무렵), 횟수는 이유식 단계에 따라 줄어든다.
 * 라벨은 모두 '회'로 끝나게 둔다 — 페이지에서 뒤에 '와·를'을 붙인다 */
export const SOLIDS = {
  6: { solids: '이유식 2회', feeds: [3, 4] },
  7: { solids: '이유식 2회', feeds: [3, 4] },
  8: { solids: '이유식 2~3회', feeds: [3, 3] },
  9: { solids: '이유식 3회', feeds: [2, 3] },
  10: { solids: '이유식 3회 + 간식 1~2회', feeds: [2, 3] },
  11: { solids: '이유식 3회 + 간식 1~2회', feeds: [2, 3] },
  12: { solids: '밥 3회 + 간식 2회', feeds: null },
};
export const SOLID_PER = [180, 240];
export const MILK_12 = [400, 500];
export const r10 = (x) => Math.round(x / 10) * 10;
export const feedsFor = (months) => FEEDS[Math.max(0, Math.min(5, Math.floor(months)))];
export const dailyFor = (kg) => r10(Math.min(DAY_MAX, kg * ML_PER_KG));
export const solidsDaily = (m) => { const s = SOLIDS[m]; return s && s.feeds ? [Math.min(DAY_MAX, s.feeds[0] * SOLID_PER[0]), Math.min(DAY_MAX, s.feeds[1] * SOLID_PER[1])] : null; };

/* 생후 일수·몸무게 → 수유 계획. feeds를 주면 그 횟수로 1회량을 나눈다 */
export function formulaPlan(days, kg, feeds) {
  const months = days / 30.4375;
  if (days < 7) return { stage: 'week1', months, per: FIRST_WEEK.per, feeds: FIRST_WEEK.feeds, daily: null };
  if (months < 6) {
    const n = feeds || feedsFor(months), raw = kg * ML_PER_KG, daily = dailyFor(kg);
    return { stage: 'weight', months, daily, raw: Math.round(raw), capped: raw > DAY_MAX, feeds: n, per: r10(daily / n), hours: Math.round(24 / n * 10) / 10 };
  }
  const m = Math.min(12, Math.floor(months)), s = SOLIDS[m];
  if (!s.feeds) return { stage: 'milk', months, solids: s.solids, milk: MILK_12 };
  return { stage: 'solids', months, solids: s.solids, feeds: s.feeds, per: SOLID_PER, daily: solidsDaily(m) };
}
