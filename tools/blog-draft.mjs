/* 네이버 블로그 초안 — 매주 한 편, 엔진 숫자로 표를 채운 글을 drafts/ 에 만든다. 사용자가 복사해 올리기만 하면 되도록 제목·본문·해시태그까지
 * node tools/blog-draft.mjs [--week N] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as B from '../engine/body.mjs';
import * as K from '../engine/kcal.mjs';
import * as X from '../engine/extra.mjs';
import * as P from '../engine/pet.mjs';
import * as G from '../engine/growth.mjs';
import { num } from '../engine/fmt.mjs';
import { FOODS } from '../data/foods.mjs';
import { EXERCISES } from '../data/exercises.mjs';
import { WEEKS } from '../data/pregnancy-weeks.mjs';
import { GUIDES } from '../data/guides.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'drafts');
const SITE = 'https://momja.com';
const EX = Object.fromEntries(EXERCISES.map((e) => [e.slug, e]));
const F = Object.fromEntries(FOODS.map((f) => [f.slug, f]));
const kst = new Date(Date.now() + 9 * 3600 * 1000);
const today = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
const iso = today.toISOString().slice(0, 10);
const md = (head, rows) => `| ${head.join(' | ')} |\n| ${head.map(() => '---').join(' | ')} |\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}`;
const plain = (html) => html.replace(/<table[\s\S]*?<\/table>/g, (t) => {
  const rows = [...t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<t[hd]>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/<[^>]+>/g, '').trim()));
  return rows.length ? `\n${md(rows[0], rows.slice(1))}\n` : '';
}).replace(/<h2>(.*?)<\/h2>/g, '\n## $1\n').replace(/<li>(.*?)<\/li>/g, '- $1').replace(/<\/p>/g, '\n').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();

const TOPICS = [
  { slug: 'bmi-normal-weight', title: '키별 정상 체중표 — 160·165·170·175·180cm는 몇 kg까지 정상일까', body: () => `건강검진 결과표의 "비만 전단계"는 대한비만학회 기준 BMI 23부터입니다. 키별로 정상 범위(BMI 18.5~22.9)와 표준체중을 표로 정리했습니다.\n\n${md(['키', '정상 체중', '표준체중 남', '표준체중 여', '비만 전단계부터'], [155, 160, 165, 170, 175, 180, 185].map((h) => { const r = B.normalRange(h); return [`${h}cm`, `${r.min}~${r.max}kg`, `${B.standardWeight(h, 'm')}kg`, `${B.standardWeight(h, 'f')}kg`, `${Math.round(23 * (h / 100) ** 2 * 10) / 10}kg`]; }))}\n\n근육이 많으면 BMI가 높아도 비만이 아닐 수 있고, 허리둘레(남 90cm·여 85cm)를 함께 봅니다. 내 키와 몸무게를 넣으면 판정과 감량 목표까지 바로 나옵니다.\n\n👉 ${SITE}/bmi/`, tags: ['정상체중', 'BMI', '키별체중', '다이어트', '건강검진'] },
  { slug: 'food-calories-walk', title: '자주 먹는 음식 칼로리와 태우는 데 걸리는 걷기 시간 (치킨·라면·삼겹살·피자)', body: () => `음식 칼로리는 숫자만 보면 감이 안 옵니다. 60kg 성인이 보통 속도로 걸을 때 몇 분인지로 바꿔 봤습니다.\n\n${md(['음식', '칼로리', '밥 공기', '걷기', '달리기(8km/h)'], ['fried-chicken', 'ramen', 'samgyeopsal', 'pizza', 'jajangmyeon', 'bigmac', 'tteokbokki', 'americano'].filter((s) => F[s]).map((s) => { const f = F[s]; return [f.name, `${num(f.kcal)}kcal`, `${K.bowls(f.kcal)}공기`, `${K.minutesFor(f.kcal, EX.walking.met, 60)}분`, `${K.minutesFor(f.kcal, EX['running-8'].met, 60)}분`]; }))}\n\n256가지 음식을 같은 방식으로 정리해 두었습니다. 이름을 검색창에 치면 바로 나옵니다.\n\n👉 ${SITE}/food/`, tags: ['음식칼로리', '치킨칼로리', '라면칼로리', '다이어트', '걷기'] },
  { slug: 'due-date-weeks', title: '출산예정일 계산법과 임신 주수 세는 법 — 왜 4주인데 아기는 2주일까', body: () => `${plain(GUIDES.find((g) => g.slug === 'pregnancy-weeks').body)}\n\n${md(['주차', '아기 크기', '길이·몸무게', '이 무렵'], [8, 12, 16, 20, 24, 28, 32, 36, 40].map((w) => { const x = WEEKS[w - 1]; return [`${w}주`, x.size, [x.len, x.wt].filter(Boolean).join(' · '), x.check || x.baby.slice(0, 30)]; }))}\n\n마지막 생리일을 넣으면 예정일과 오늘 주수, 검사 일정을 캘린더 파일로도 받을 수 있습니다.\n\n👉 ${SITE}/due-date/`, tags: ['출산예정일', '임신주수', '임신초기', '산부인과', '임신'] },
  { slug: 'baby-vaccine-schedule', title: '아기 예방접종 일정표 총정리 — 개월별로 무엇을 맞나, 캘린더에 넣는 법', body: () => `${plain(GUIDES.find((g) => g.slug === 'baby-vaccines').body)}\n\n생년월일을 넣으면 접종 날짜가 계산되고, 아이폰·구글 캘린더에 한 번에 넣는 파일(.ics)로 받을 수 있습니다. 하루 전 오전 9시에 알림이 옵니다.\n\n👉 ${SITE}/baby/`, tags: ['예방접종', '예방접종일정표', '육아', '신생아', '아기'] },
  { slug: 'steps-calories', title: '만보 걸으면 몇 칼로리일까 — 걸음 수별 거리·시간·칼로리표', body: () => `${md(['걸음', '거리', '시간', '칼로리(60kg)', '밥 공기'], [3000, 5000, 7000, 8000, 10000, 15000, 20000].map((s) => { const r = X.steps(s, 60, 170); return [`${num(s)}보`, `${r.km}km`, `${r.minutes}분`, `${num(r.kcal)}kcal`, `${K.bowls(r.kcal)}공기`]; }))}\n\n만보는 1960년대 일본 만보계 이름에서 나온 숫자이고, 최근 연구는 하루 7,000~8,000보부터 효과가 뚜렷하다고 봅니다. 지금보다 2,000보 늘리는 것부터 시작해 보세요. 몸무게와 키를 넣으면 내 숫자로 바뀝니다.\n\n👉 ${SITE}/steps/`, tags: ['만보', '걷기운동', '걷기칼로리', '다이어트', '건강'] },
  { slug: 'alcohol-driving', title: '소주 한 병 마시면 몇 시간 뒤에 운전할 수 있을까 — 혈중알코올농도 계산', body: () => `${plain(GUIDES.find((g) => g.slug === 'alcohol-bac').body)}\n\n${md(['술', '70kg 남 최고 농도', '0.03% 아래로', '55kg 여 최고 농도', '0.03% 아래로'], [['소주 1병', 360, 0.165], ['소주 2병', 720, 0.165], ['맥주 500ml 2잔', 1000, 0.045], ['막걸리 1병', 750, 0.06], ['와인 3잔', 450, 0.13]].map(([n, ml, abv]) => { const g = X.alcoholGrams(ml, abv), m = X.bac(g, 70, 'm'), f = X.bac(g, 55, 'f'); return [n, `${m.peak}%`, `${m.driveHours}시간`, `${f.peak}%`, `${f.driveHours}시간`]; }))}\n\n계산은 참고용이며 음주운전 가능 여부를 보증하지 않습니다. 마셨으면 운전하지 마세요.\n\n👉 ${SITE}/alcohol/`, tags: ['혈중알코올농도', '음주운전', '숙취운전', '회식', '소주'] },
  { slug: 'sleep-cycle', title: '몇 시에 자야 개운할까 — 기상 시각별 취침 시각표 (90분 수면 주기)', body: () => `${plain(GUIDES.find((g) => g.slug === 'sleep-cycle').body)}\n\n${md(['기상', '5주기(7.5시간)', '6주기(9시간)', '4주기(6시간)'], [[6, 0], [6, 30], [7, 0], [7, 30], [8, 0], [9, 0]].map(([h, m]) => { const b = X.bedtimes(h, m); return [`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, b[1].time, b[0].time, b[2].time]; }))}\n\n👉 ${SITE}/sleep/`, tags: ['수면시간', '수면주기', '취침시간', '불면증', '건강'] },
  { slug: 'dog-age-food', title: '강아지 나이 사람 나이로 환산표와 몸무게별 하루 사료량', body: () => `"1년 = 7살"은 틀린 공식입니다. 강아지는 첫 두 해에 성장을 거의 끝내 1살이 사람 15세, 2살이 24세이고, 그 뒤로 소형견 4세·중형견 5세·대형견 6세씩 더합니다.\n\n${md(['강아지 나이', '소형견', '중형견', '대형견'], [1, 2, 3, 5, 7, 10, 12, 15].map((y) => [`${y}살`, `${P.dogAge(y, 'small')}세`, `${P.dogAge(y, 'medium')}세`, `${P.dogAge(y, 'large')}세`]))}\n\n사료량은 기초 열량(RER = 70 × 몸무게^0.75)에 상태 계수를 곱해 계산합니다. 봉지 급여표는 활동량 많은 개 기준이라 실내견은 보통 이보다 적게 먹어야 합니다.\n\n${md(['몸무게', '중성화 성견 하루 열량', '사료(100g당 370kcal)'], [3, 5, 8, 10, 15, 20, 30].map((k) => { const r = P.petFood('dog', k, 'neutered'); return [`${k}kg`, `${num(r.der)}kcal`, `${r.grams}g`]; }))}\n\n생일을 넣으면 예방접종 날짜도 캘린더 파일로 받을 수 있습니다.\n\n👉 ${SITE}/pet/`, tags: ['강아지나이', '강아지사료량', '반려견', '강아지', '사료급여량'] },
  { slug: 'baby-percentile', title: '아기 몸무게·키 백분위 보는 법 — 개월별 남아·여아 평균표 (WHO·질병관리청)', body: () => `백분위는 같은 성별·개월의 아기 100명을 작은 순으로 세웠을 때 몇 번째인지입니다. 50이 한가운데, 3~97 사이면 정상 범위이고, 숫자보다 자기 곡선을 따라 자라는지가 중요합니다.\n\n${md(['개월', '남아 몸무게', '남아 키', '여아 몸무게', '여아 키'], [0, 1, 3, 6, 9, 12, 18, 24, 36].map((m) => [`${m}개월`, `${G.round('weight', G.valueAt('weight', 'm', m, 0))}kg`, `${G.round('length', G.valueAt('length', 'm', m, 0))}cm`, `${G.round('weight', G.valueAt('weight', 'f', m, 0))}kg`, `${G.round('length', G.valueAt('length', 'f', m, 0))}cm`]))}\n\n(50백분위 · WHO 아동 성장 표준, 질병관리청 2017 성장도표 0~35개월 기준)\n\n내 아기 몸무게·키·머리둘레를 넣으면 정확한 백분위와 판정이 나옵니다.\n\n👉 ${SITE}/baby/percentile/`, tags: ['아기몸무게', '아기백분위', '성장도표', '육아', '영유아검진'] },
  { slug: 'bmr-diet', title: '기초대사량 계산법과 다이어트 섭취 칼로리 — 왜 적게 먹어도 안 빠질까', body: () => `${plain(GUIDES.find((g) => g.slug === 'bmr-diet').body)}\n\n${md(['조건', '기초대사량', '하루 필요(가벼운 활동)', '감량 섭취(−500)'], [['남 30세 170cm 65kg', 'm', 170, 65], ['남 40세 175cm 80kg', 'm', 175, 80], ['여 30세 160cm 55kg', 'f', 160, 55], ['여 40세 165cm 62kg', 'f', 165, 62]].map(([l, s, h, w]) => { const b = B.bmr(s, h, w, +l.match(/(\d+)세/)[1]); return [l, `${num(b)}kcal`, `${num(B.tdee(b, 'light'))}kcal`, `${num(Math.max(b, B.tdee(b, 'light') - 500))}kcal`]; }))}\n\n👉 ${SITE}/bmr/`, tags: ['기초대사량', '다이어트', '섭취칼로리', '체중감량', '식단'] },
  { slug: 'caffeine-limit', title: '하루 카페인 얼마까지 괜찮을까 — 커피·에너지드링크 카페인표와 잘 때 남는 양', body: () => `식약처 하루 최대 섭취 권고량은 성인 400mg, 임산부 300mg, 청소년은 몸무게 1kg당 2.5mg입니다. 카페인은 5시간마다 절반씩 줄어 오후 2시 아메리카노 두 잔(300mg)은 밤 11시에도 ${X.caffeineLeft(300, 9)}mg이 남습니다.\n\n${md(['음료', '카페인', '400mg까지'], X.CAFFEINE.map((c) => [c.label, `${c.mg}mg`, `${Math.floor(400 / c.mg)}잔`]))}\n\n오늘 마신 잔 수를 넣으면 총량과 잘 때 남는 양이 바로 나옵니다.\n\n👉 ${SITE}/caffeine/`, tags: ['카페인', '커피카페인', '에너지드링크', '불면', '건강'] },
  { slug: 'quit-smoking-money', title: '금연하면 얼마가 모일까 — 날짜별 모은 돈과 몸의 변화', body: () => `${md(['금연', '안 피운 담배', '모은 돈(4,500원)', '몸의 변화'], [1, 3, 7, 30, 90, 365, 1825].map((d) => { const q = X.quitStats(d, 20, 4500); return [`${d}일`, `${num(q.cigs)}개비`, `${num(q.money)}원`, X.quitStage(d).text.replace(/\.$/, '')]; }))}\n\n가장 힘든 때는 3일째와 2주째입니다. 보건소 금연클리닉은 무료이고 금연상담전화는 1544-9030입니다. 끊은 날짜를 넣으면 오늘까지의 숫자가 나옵니다.\n\n👉 ${SITE}/quit-smoking/`, tags: ['금연', '금연효과', '담배값', '건강', '새해다짐'] },
  { slug: 'child-height', title: '부모 키로 아이 키 예측하는 법 — 공식과 한계', body: () => `${plain(GUIDES.find((g) => g.slug === 'child-height').body)}\n\n${md(['아빠 \\ 엄마', '155cm', '160cm', '165cm', '170cm'], [165, 170, 175, 180, 185].map((f) => [`${f}cm`, ...[155, 160, 165, 170].map((m) => { const c = X.childHeight(f, m); return `아들 ${c.boy} · 딸 ${c.girl}`; })]))}\n\n👉 ${SITE}/child-height/`, tags: ['아이키예측', '키크는법', '성장', '육아', '키'] },
];

const week = Math.floor((today - Date.UTC(2026, 0, 5)) / (7 * 86400000));
const forced = process.argv.indexOf('--week') > 0 ? +process.argv[process.argv.indexOf('--week') + 1] : null;
const t = TOPICS[((forced != null ? forced : week) % TOPICS.length + TOPICS.length) % TOPICS.length];
fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, `${iso}-${t.slug}.md`);
const text = `# ${t.title}\n\n_${iso} 초안 · 몸자(momja.com) 계산 결과를 그대로 옮긴 글입니다. 네이버 블로그에 붙여 넣기 전에 제목과 첫 문단만 손보세요._\n\n${t.body()}\n\n---\n모든 수치는 공개된 공식과 기준(대한비만학회·질병관리청·식약처·WHO)으로 계산한 참고용이며 진단이나 치료를 대신하지 않습니다.\n\n${t.tags.map((x) => `#${x}`).join(' ')} #몸자 #몸계산사전\n`;
fs.writeFileSync(file, text);
const list = fs.readdirSync(OUT).filter((f) => f.endsWith('.md') && f !== 'README.md').sort().reverse();
fs.writeFileSync(path.join(OUT, 'README.md'), `# 블로그 초안\n\n매주 월요일 아침 자동으로 한 편씩 생깁니다. 파일을 열어 네이버 블로그에 붙여 넣고 제목·첫 문단만 다듬으세요.\n\n${list.map((f) => `- [${f.replace('.md', '')}](${f})`).join('\n')}\n`);
console.log('초안 저장:', path.relative(ROOT, file), '—', t.title);
