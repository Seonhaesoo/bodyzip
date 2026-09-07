/* 운동 소모 칼로리 — MET(Compendium of Physical Activities) × 3.5 × 몸무게(kg) ÷ 200 × 분 */
export const burn = (met, kg, minutes) => Math.round(met * 3.5 * kg / 200 * minutes);
/* 어떤 음식(kcal)을 태우는 데 걸리는 시간(분) */
export const minutesFor = (kcal, met, kg) => Math.round(kcal / (met * 3.5 * kg / 200));
/* 밥 한 공기(210g) 300kcal 환산 */
export const RICE_BOWL = 300;
export const bowls = (kcal) => Math.round(kcal / RICE_BOWL * 10) / 10;
