/* 오늘의 숫자 카드 게시 — 쓰레드(이미지+글)와 인스타 스토리. 사주첩 봇과 같은 시크릿 이름을 쓴다
 * 환경변수: THREADS_USER_ID, THREADS_ACCESS_TOKEN, IG_USER_ID, IG_ACCESS_TOKEN, IMAGE_URL(공개 카드 주소), IMAGE_VER
 * node tools/publish.mjs threads | ig */
import fs from 'node:fs';

const mode = process.argv[2] || 'threads';
const text = fs.readFileSync('src/cards/latest.txt', 'utf8').trim();
const imageUrl = process.env.IMAGE_URL ? `${process.env.IMAGE_URL}?v=${process.env.IMAGE_VER || Date.now()}` : null;
const call = async (url, params, token) => (await fetch(url, { method: 'POST', body: new URLSearchParams({ ...params, access_token: token }) })).json();

if (mode === 'threads') {
  const uid = process.env.THREADS_USER_ID, token = process.env.THREADS_ACCESS_TOKEN;
  if (!uid || !token) { console.log('THREADS 시크릿이 없어 게시를 건너뜁니다.'); process.exit(0); }
  const base = `https://graph.threads.net/v1.0/${uid}`;
  let j1 = null;
  if (imageUrl) { j1 = await call(`${base}/threads`, { media_type: 'IMAGE', image_url: imageUrl, text }, token); if (!j1.id) console.warn('이미지 컨테이너 실패, 텍스트로 재시도:', JSON.stringify(j1).slice(0, 200)); }
  if (!j1 || !j1.id) j1 = await call(`${base}/threads`, { media_type: 'TEXT', text }, token);
  if (!j1.id) { console.error('컨테이너 생성 실패:', JSON.stringify(j1).slice(0, 300)); process.exit(1); }
  await new Promise((r) => setTimeout(r, imageUrl ? 8000 : 5000));
  const j2 = await call(`${base}/threads_publish`, { creation_id: j1.id }, token);
  if (!j2.id) { console.error('게시 실패:', JSON.stringify(j2).slice(0, 300)); process.exit(1); }
  console.log('쓰레드 게시 완료:', j2.id);
} else if (mode === 'ig') {
  const uid = process.env.IG_USER_ID, token = process.env.IG_ACCESS_TOKEN;
  if (!uid || !token) { console.log('IG 시크릿이 없어 게시를 건너뜁니다.'); process.exit(0); }
  if (!imageUrl) { console.log('IMAGE_URL 없음 — 인스타 게시 건너뜀'); process.exit(0); }
  const host = token.startsWith('IG') ? 'graph.instagram.com' : 'graph.facebook.com';
  const base = `https://${host}/v21.0/${uid}`;
  const j1 = await (await fetch(`${base}/media?media_type=STORIES&image_url=${encodeURIComponent(imageUrl)}&access_token=${token}`, { method: 'POST' })).json();
  if (!j1.id) { console.error('미디어 컨테이너 생성 실패:', JSON.stringify(j1)); process.exit(1); }
  await new Promise((r) => setTimeout(r, 8000));
  const j2 = await (await fetch(`${base}/media_publish?creation_id=${j1.id}&access_token=${token}`, { method: 'POST' })).json();
  if (!j2.id) { console.error('스토리 게시 실패:', JSON.stringify(j2)); process.exit(1); }
  console.log('스토리 게시 완료:', j2.id);
}
