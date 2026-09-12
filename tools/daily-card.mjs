/* 오늘의 숫자 카드 — 엔진으로 계산한 사실 하나를 1080×1350 카드로 그려(Playwright) src/cards/ 에 저장하고 게시 글을 만든다
 * node tools/daily-card.mjs [--offset N] [--index N] · 출력: src/cards/latest.png, latest.json, latest.txt */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pick, facts } from './daily-facts.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'cards');
const SITE = 'https://bodyzip.com';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const offset = +arg('--offset', 0) || 0;
const kst = new Date(Date.now() + 9 * 3600 * 1000 + offset * 86400000);
const today = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
const forced = arg('--index', null);
const fact = forced != null ? { ...facts()[+forced], index: +forced, total: facts().length } : pick(today);
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const dateKor = `${today.getUTCFullYear()}년 ${today.getUTCMonth() + 1}월 ${today.getUTCDate()}일 (${WD[today.getUTCDay()]})`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function cardHtml(f) {
  const bigSize = f.big.length > 9 ? 120 : f.big.length > 6 ? 150 : 190;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Mono:wght@600&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
html,body{margin:0;background:#ddd}
#card{width:1080px;height:1350px;position:relative;background:#F6F1E8;color:#211C15;font-family:"Noto Sans KR",sans-serif;overflow:hidden}
.frame{position:absolute;inset:48px;border:3px solid #DED2BC;border-radius:28px}
.top{position:absolute;top:120px;left:0;right:0;text-align:center;font-size:36px;color:#6B6259;font-weight:500;letter-spacing:.02em}
.top b{color:#1F6F6B;font-family:"Gowun Batang",serif;font-size:40px;font-weight:700}
.label{position:absolute;top:330px;left:100px;right:100px;text-align:center;font-family:"Gowun Batang",serif;font-size:60px;line-height:1.35;font-weight:700;color:#211C15}
.big{position:absolute;top:560px;left:60px;right:60px;text-align:center;font-family:"IBM Plex Mono","Noto Sans KR",monospace;font-weight:600;font-size:${bigSize}px;line-height:1.1;color:#1F6F6B;letter-spacing:-.02em}
.sub{position:absolute;top:840px;left:110px;right:110px;text-align:center;font-size:38px;line-height:1.55;color:#4A443C}
.bar{position:absolute;top:1010px;left:150px;right:150px;height:4px;background:#DED2BC}
.url{position:absolute;top:1060px;left:0;right:0;text-align:center;font-size:34px;color:#1F6F6B;font-weight:700}
.url span{display:inline-block;padding:14px 28px;border:2px solid #1F6F6B;border-radius:999px;background:#fff}
.foot{position:absolute;bottom:90px;left:0;right:0;text-align:center;font-size:28px;color:#8A948E}
</style></head><body><div id="card">
<div class="frame"></div>
<div class="top"><b>바디집</b> · 오늘의 숫자 · ${esc(dateKor)}</div>
<div class="label">${esc(f.label)}</div>
<div class="big">${esc(f.big)}</div>
<div class="sub">${esc(f.sub)}</div>
<div class="bar"></div>
<div class="url"><span>bodyzip.com${esc(f.url)}</span></div>
<div class="foot">몸 계산 사전 — 숫자만 넣으면 바로 · 참고용</div>
</div></body></html>`;
}

const caption = [
  `${f_label(fact)} ${fact.big}`,
  fact.sub,
  '',
  `표로 보기 → bodyzip.com${fact.url}`,
  '',
  ['바디집', '몸계산사전', ...fact.tags].map((t) => `#${t.replace(/\s+/g, '')}`).join(' '),
].join('\n');
function f_label(f) { return f.label.endsWith('면') || f.label.endsWith('로') ? f.label : f.label; }

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify({ date: today.toISOString().slice(0, 10), dateKor, ...fact, site: SITE }, null, 2));
fs.writeFileSync(path.join(OUT, 'latest.txt'), caption + '\n');
fs.writeFileSync(path.join(OUT, 'latest.html'), cardHtml(fact));
console.log(`오늘의 숫자 #${fact.index + 1}/${fact.total}: ${fact.label} ${fact.big}`);

if (process.argv.includes('--no-image')) process.exit(0);
const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.setContent(cardHtml(fact), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const png = await page.locator('#card').screenshot({ type: 'png' });
await browser.close();
fs.writeFileSync(path.join(OUT, 'latest.png'), png);
console.log('src/cards/latest.png 저장 —', Math.round(png.length / 1024), 'KB');
