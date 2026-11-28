/* 탄수화물·단백질·지방(탄단지) 하루 g — /macro/ (2026-11-28)
 * 「2025 한국인 영양소 섭취기준」 에너지적정비율(보건복지부 2025-12-31 보도자료): 탄수화물 50~65%(2020년 55~65%), 단백질 10~20%(7~20%), 지방 15~30%(유지).
 * g = 하루 칼로리 × 비율 ÷ (탄수화물·단백질 4kcal/g, 지방 9kcal/g). 나이·성별 단백질 '권장섭취량(g)' 표는 원문을 확인하지 못해 쓰지 않는다. */
export const AMDR_2025 = { carb: [50, 65], protein: [10, 20], fat: [15, 30] };
export const AMDR_2020 = { carb: [55, 65], protein: [7, 20], fat: [15, 30] };
export const KCAL_PER_G = { carb: 4, protein: 4, fat: 9 };
/* 세 비율이 모두 범위 안이고 합이 100인 예시 배분 */
export const SPLITS = [
  { key: 'balanced', label: '고르게 (탄 55 · 단 20 · 지 25)', carb: 55, protein: 20, fat: 25 },
  { key: 'korean', label: '밥 위주 (탄 65 · 단 15 · 지 20)', carb: 65, protein: 15, fat: 20 },
  { key: 'lowcarb', label: '탄수화물 적게 (탄 50 · 단 20 · 지 30)', carb: 50, protein: 20, fat: 30 },
];
export const gramsOf = (kcal, key, pct) => Math.round(kcal * pct / 100 / KCAL_PER_G[key]);

export function macroPlan(kcal, splitKey = 'balanced') {
  const k = Math.max(0, Math.round(Number(kcal) || 0));
  const sp = SPLITS.find((s) => s.key === splitKey) || SPLITS[0];
  const range = Object.fromEntries(Object.entries(AMDR_2025).map(([m, [a, b]]) => [m, [gramsOf(k, m, a), gramsOf(k, m, b)]]));
  const pick = { carb: gramsOf(k, 'carb', sp.carb), protein: gramsOf(k, 'protein', sp.protein), fat: gramsOf(k, 'fat', sp.fat) };
  return { kcal: k, split: sp, range, pick, meal: { carb: Math.round(pick.carb / 3), protein: Math.round(pick.protein / 3), fat: Math.round(pick.fat / 3) } };
}
