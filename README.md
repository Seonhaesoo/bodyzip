# 몸자 (momja.com)

몸에 관한 숫자를 미리 계산해 표로 묶어 둔 사전. 돈표(donpyo.com)와 같은 구조 — 엔진(engine/*.mjs) → 생성기(tools/build.mjs) → dist/ 정적 사이트 → GitHub Pages.

- `engine/body.mjs` — BMI(대한비만학회 2022)·정상 체중·표준체중·기초대사량(Mifflin-St Jeor)·활동대사량·체지방률(미 해군)·물·단백질
- `engine/kcal.mjs` — MET 기반 운동 소모 칼로리, 밥 공기 환산
- `engine/dates.mjs` — 출산예정일·임신 주수·배란일·아기 개월수·예방접종 일정(질병관리청)
- `data/foods.mjs` — 음식 1인분 칼로리, `data/exercises.mjs` — 운동 MET
- 페이지: /bmi/{키}/{몸무게}/ (140~200cm × 40~120kg), /bmr/, /bodyfat/, /food/, /exercise/, /water/, /due-date/{MM-DD}/, /ovulation/{MM-DD}/, /baby/{YYYY-MM-DD}/ (최근 3년)

```bash
node tools/test.mjs && node tools/build.mjs && node server.js   # http://localhost:8327
```
도메인 연결 뒤 `tools/build.mjs`의 `DOMAIN_READY`를 true로 (CNAME 생성).
