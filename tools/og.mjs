/* OG 이미지(1200×630) 생성 — 카톡·인스타·쓰레드에 링크를 올릴 때 보이는 카드. Playwright로 한 번 그려 src/og/ 에 저장(정적 커밋)
 * node tools/og.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'og');
export const OG = [
  { key: 'home', title: '키 170에 몸무게 65면\n어디쯤일까', sub: 'BMI · 기초대사량 · 칼로리 · 출산예정일 · 아기 개월수 · 반려동물', kicker: '몸 계산 사전' },
  { key: 'bmi', title: '내 키의 정상 체중은\n몇 kg까지일까', sub: '키 140~200cm · 몸무게별 BMI 판정 · 대한비만학회 기준', kicker: 'BMI · 정상 체중' },
  { key: 'bmr', title: '가만히 있어도 쓰는\n하루 칼로리', sub: '기초대사량 · 활동량별 필요 칼로리 · 감량 섭취량', kicker: '기초대사량' },
  { key: 'food', title: '치킨 한 마리는\n밥 몇 공기일까', sub: '256가지 음식 칼로리 · 걷기·달리기로 환산', kicker: '음식 칼로리 사전' },
  { key: 'exercise', title: '30분 뛰면\n몇 칼로리 빠질까', sub: '걷기·달리기·자전거·수영·헬스 · 몸무게별', kicker: '운동 소모 칼로리' },
  { key: 'preg', title: '출산예정일과\n오늘 몇 주', sub: '마지막 생리일로 · 주차별 아기 크기 · 검사 일정 캘린더', kicker: '임신' },
  { key: 'baby', title: '우리 아기\n오늘 몇 개월', sub: '예방접종 날짜 · 성장 백분위 · 100일·돌 카드 · 캘린더 파일', kicker: '아기' },
  { key: 'pet', title: '강아지 5살은\n사람 나이로 몇 살', sub: '나이 환산 · 하루 사료량 · 예방접종 캘린더', kicker: '반려동물' },
  { key: 'guide', title: 'BMI 23이면\n과체중일까', sub: '계산 뒤의 기준을 풀어 쓴 글 · 서재', kicker: '서재' },
  { key: 'pregcard', title: '임신 디데이 카드\n만들기', sub: 'D-140 · 20주 3일 · 태명 · 카톡·인스타용 이미지', kicker: '임신 디데이 카드' },
  { key: 'babycard', title: '아기 100일·돌 카드\n만들기', sub: 'D+100 · 첫돌까지 D-30 · 이름 · 저장·공유', kicker: '아기 카드' },
  { key: 'steps', title: '만보 걸으면\n몇 칼로리일까', sub: '걸음 수 → 거리·시간·칼로리 · 몸무게·키별', kicker: '걸음 수' },
  { key: 'sleep', title: '몇 시에 자야\n개운할까', sub: '90분 수면 주기 · 기상 시각별 취침 시각', kicker: '수면' },
  { key: 'diet', title: '5kg 빼려면\n몇 주 걸릴까', sub: '하루 500kcal 줄이면 11주 · 목표 날짜', kicker: '다이어트 기간' },
  { key: 'alcohol', title: '소주 한 병,\n몇 시간 뒤 운전 가능', sub: '혈중알코올농도 · 위드마크 공식 · 소주·맥주·막걸리·와인', kicker: '혈중알코올농도' },
  { key: 'child', title: '아빠 175 엄마 162면\n아이 키는', sub: '중간 부모 키 공식 · 아들·딸 예상 키', kicker: '아이 키 예측' },
  { key: 'percentile', title: '우리 아기 몸무게\n또래 어디쯤', sub: '몸무게·키·머리둘레 백분위 · WHO·질병관리청 성장도표', kicker: '성장 백분위' },
  { key: 'caffeine', title: '오늘 카페인\n얼마나 마셨을까', sub: '커피·에너지드링크 잔 수 → 총량 · 잘 때 남는 양', kicker: '카페인' },
  { key: 'quit', title: '담배 끊은 지\n며칠', sub: '안 피운 담배 · 모은 돈 · 몸의 변화', kicker: '금연' },
  { key: 'water', title: '하루 물,\n내 몸무게로는 몇 잔', sub: '몸무게 × 33ml · 단백질 권장량', kicker: '물 · 단백질' },
];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
const html = (o) => `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
html,body{margin:0}
#og{width:1200px;height:630px;position:relative;background:#F6F1E8;color:#211C15;font-family:"Noto Sans KR",sans-serif;overflow:hidden}
.side{position:absolute;left:0;top:0;bottom:0;width:22px;background:#1F6F6B}
.kick{position:absolute;top:78px;left:90px;font-size:30px;color:#1F6F6B;font-weight:700;letter-spacing:.04em}
.title{position:absolute;top:150px;left:90px;right:90px;font-family:"Gowun Batang",serif;font-size:86px;line-height:1.22;font-weight:700}
.sub{position:absolute;top:420px;left:90px;right:90px;font-size:34px;line-height:1.5;color:#4A443C}
.brand{position:absolute;bottom:60px;left:90px;font-size:34px;font-weight:700;color:#1F6F6B}
.brand small{font-weight:500;color:#8A948E;font-size:26px;margin-left:14px}
.seal{position:absolute;right:90px;bottom:52px;width:84px;height:84px;border:3px solid #DED2BC;border-radius:18px;display:flex;align-items:center;justify-content:center}
.seal svg{width:56px;height:56px}
</style></head><body><div id="og"><div class="side"></div>
<div class="kick">${esc(o.kicker)}</div><div class="title">${esc(o.title)}</div><div class="sub">${esc(o.sub)}</div>
<div class="brand">momja.com<small>몸 계산 사전 · 숫자만 넣으면 바로</small></div>
<div class="seal"><svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="6.5" width="19" height="11" rx="2.5" stroke="#1F6F6B" stroke-width="1.6"></rect><path d="M6.5 6.5v4M10 6.5v6M13.5 6.5v4M17 6.5v6" stroke="#1F6F6B" stroke-width="1.6" stroke-linecap="round"></path></svg></div>
</div></body></html>`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const o of OG) {
    await page.setContent(html(o), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const png = await page.locator('#og').screenshot({ type: 'png' });
    fs.writeFileSync(path.join(OUT, `${o.key}.png`), png);
    console.log(`og/${o.key}.png`, Math.round(png.length / 1024), 'KB');
  }
  await browser.close();
}
