/* dist/ 안의 내부 링크·자산 경로가 실제 파일로 존재하는지 검사 — node tools/check-links.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) files.push(p); } };
walk(OUT);
const exists = new Set();
for (const f of files) { let u = '/' + path.relative(OUT, f).split(path.sep).join('/'); if (u.endsWith('/index.html')) u = u.slice(0, -'index.html'.length); exists.add(u); }
const broken = {};
let checked = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const re = /(?:href|src)="(\/[^"#?]*)/g;
  let m;
  while ((m = re.exec(html))) {
    const u = m[1];
    checked++;
    if (/\.(css|js|svg|xml|txt|png|jpg)$/.test(u)) { if (!fs.existsSync(path.join(OUT, u))) broken[u] = (broken[u] || 0) + 1; continue; }
    const key = u.endsWith('/') ? u : u + '/';
    if (!exists.has(key)) broken[u] = (broken[u] || 0) + 1;
  }
}
console.log(`페이지 ${files.length}장 · 링크 ${checked}개 · 깨진 링크 ${Object.keys(broken).length}종`);
for (const [u, c] of Object.entries(broken).slice(0, 30)) console.log(' ', u, '×', c);
process.exit(Object.keys(broken).length ? 1 : 0);
