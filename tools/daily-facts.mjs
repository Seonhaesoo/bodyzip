/* 오늘의 숫자 — 카드 봇·블로그 초안이 함께 쓰는 사실 목록. 모두 엔진으로 계산해 숫자가 페이지와 같다 */
import * as B from '../engine/body.mjs';
import * as K from '../engine/kcal.mjs';
import * as X from '../engine/extra.mjs';
import * as P from '../engine/pet.mjs';
import * as G from '../engine/growth.mjs';
import { num } from '../engine/fmt.mjs';
import { FOODS } from '../data/foods.mjs';
import { EXERCISES } from '../data/exercises.mjs';
import { WEEKS } from '../data/pregnancy-weeks.mjs';
import { MONTHS as BM } from '../data/baby-months.mjs';

const F = Object.fromEntries(FOODS.map((f) => [f.slug, f]));
const EX = Object.fromEntries(EXERCISES.map((e) => [e.slug, e]));
const hm = (min) => min >= 60 ? `${Math.floor(min / 60)}시간 ${min % 60 ? `${min % 60}분` : ''}`.trim() : `${min}분`;
const food = (slug) => F[slug] || FOODS[0];

export function facts() {
  const st = X.steps(10000, 60, 170), chicken = food('fried-chicken'), ramen = food('ramen'), sam = food('samgyeopsal'), pizza = food('pizza') || food('pizza-slice'), latte = food('latte') || food('americano');
  const soju = X.bac(X.alcoholGrams(360, 0.165), 70, 'm'), beer2 = X.bac(X.alcoholGrams(1000, 0.045), 70, 'm'), sojuF = X.bac(X.alcoholGrams(360, 0.165), 55, 'f');
  const w20 = WEEKS[19], w12 = WEEKS[11], w30 = WEEKS[29], m6 = BM.find((x) => x.m === 6), m12 = BM.find((x) => x.m === 12);
  const r170 = B.normalRange(170), r160 = B.normalRange(160), bmr = B.bmr('m', 170, 65, 30), bmrF = B.bmr('f', 160, 55, 30);
  const diet5 = X.dietPlan(5, 0, 500), diet10 = X.dietPlan(10, 0, 500), quit30 = X.quitStats(30), quit365 = X.quitStats(365);
  const bed7 = X.bedtimes(7, 0)[1].time, wake23 = X.waketimes(23, 0)[1].time, ch = X.childHeight(175, 162);
  return [
    { big: `${num(st.kcal)}kcal`, label: '만보 걸으면', sub: `${st.km}km · ${st.minutes}분 · 60kg 기준 · 밥 ${K.bowls(st.kcal)}공기`, url: '/steps/10000/', tags: ['만보', '걷기', '칼로리'] },
    { big: hm(K.minutesFor(chicken.kcal, EX.walking.met, 60)), label: '치킨 한 마리를 걸어서 태우면', sub: `${num(chicken.kcal)}kcal · 60kg · 보통 걷기 · 달리기로는 ${hm(K.minutesFor(chicken.kcal, EX['running-8'].met, 60))}`, url: '/food/fried-chicken/', tags: ['치킨', '칼로리', '운동'] },
    { big: w20.size, label: '임신 20주, 아기 크기는', sub: `${w20.len} · ${w20.wt} · 정밀 초음파를 받는 주`, url: '/pregnancy/week/20/', tags: ['임신20주', '임신', '출산'] },
    { big: `${soju.driveHours}시간`, label: '소주 1병, 0.03% 아래로 내려오려면', sub: `70kg 남성 최고 ${soju.peak}% · 마지막 잔 뒤 기준 · 55kg 여성은 ${sojuF.driveHours}시간`, url: '/alcohol/soju/1/', tags: ['음주운전', '혈중알코올농도', '소주'] },
    { big: `${P.dogAge(5, 'small')}세`, label: '강아지 5살은 사람 나이로', sub: `소형견 기준 · 대형견은 ${P.dogAge(5, 'large')}세 · 1살 15세, 2살 24세`, url: '/pet/dog-age/5/', tags: ['강아지나이', '반려견', '강아지'] },
    { big: bed7, label: '7시에 일어나려면 이 시각에 눕기', sub: '90분 수면 주기 5번 · 잠드는 15분 포함 · 6주기면 21:45', url: '/sleep/07-00/', tags: ['수면', '취침시간', '잠'] },
    { big: `${r170.min}~${r170.max}kg`, label: '키 170cm 정상 체중', sub: `BMI 18.5~22.9 · 대한비만학회 기준 · 표준체중 남 ${B.standardWeight(170, 'm')}kg`, url: '/bmi/170/', tags: ['정상체중', 'BMI', '키170'] },
    { big: `${diet5.weeks}주`, label: '5kg 빼는 데 걸리는 시간', sub: `하루 500kcal 줄이면 · ${diet5.days}일 · 10kg은 ${diet10.weeks}주`, url: '/diet/5/', tags: ['다이어트', '감량', '5kg'] },
    { big: '300mg', label: '아메리카노 2잔의 카페인', sub: `성인 하루 기준 400mg의 75% · 오후 2시에 마시면 밤 11시에 ${X.caffeineLeft(300, 9)}mg 남음`, url: '/caffeine/americano/2/', tags: ['카페인', '커피', '아메리카노'] },
    { big: `${num(quit30.money)}원`, label: '담배 끊고 30일이면 모이는 돈', sub: `하루 한 갑 · ${num(quit30.cigs)}개비 · 1년이면 ${num(quit365.money)}원`, url: '/quit-smoking/30/', tags: ['금연', '담배', '절약'] },
    { big: `${num(B.water(65).ml)}ml`, label: '65kg의 하루 물 권장량', sub: `${B.water(65).cups}잔 · 몸무게 × 33ml · 운동하면 땀 1L당 1L 더`, url: '/water/65/', tags: ['물섭취량', '수분', '건강'] },
    { big: `${m6.w}kg`, label: '6개월 아기 평균 몸무게', sub: `남아 50백분위 · 키 ${m6.h}cm · 이유식과 첫니가 시작되는 때`, url: '/baby/month/6/', tags: ['아기6개월', '육아', '성장'] },
    { big: hm(K.minutesFor(ramen.kcal, EX['running-8'].met, 60)), label: '라면 한 봉지를 달려서 태우면', sub: `${num(ramen.kcal)}kcal · 시속 8km · 60kg · 걷기로는 ${hm(K.minutesFor(ramen.kcal, EX.walking.met, 60))}`, url: '/food/ramen/', tags: ['라면', '칼로리', '달리기'] },
    { big: `${beer2.peak}%`, label: '맥주 500ml 두 잔 마시면', sub: `70kg 남성 최고 농도 · ${X.bacLevel(beer2.peak).split(' (')[0]} · 0.03% 아래까지 ${beer2.driveHours}시간`, url: '/alcohol/beer/2/', tags: ['맥주', '혈중알코올농도', '회식'] },
    { big: `${ch.boy}cm`, label: '아빠 175 · 엄마 162면 아들 예상 키', sub: `딸은 ${ch.girl}cm · 중간 부모 키 공식 · ±8.5cm 안에 95%`, url: '/child-height/175-162/', tags: ['아이키예측', '키', '육아'] },
    { big: hm(K.minutesFor(sam.kcal, EX.stairs.met, 60)), label: '삼겹살 1인분을 계단으로 태우면', sub: `${num(sam.kcal)}kcal · 계단 오르기 MET 8 · 60kg`, url: '/food/samgyeopsal/', tags: ['삼겹살', '칼로리', '계단'] },
    { big: `${G.round('weight', G.valueAt('weight', 'm', 12, 0))}kg`, label: '남아 첫돌 무렵 평균 몸무게', sub: `50백분위 · 키 ${G.round('length', G.valueAt('length', 'm', 12, 0))}cm · 3~97백분위면 정상`, url: '/baby/percentile/boy/12/', tags: ['아기몸무게', '백분위', '첫돌'] },
    { big: `${P.petFood('dog', 5, 'neutered').grams}g`, label: '5kg 강아지의 하루 사료', sub: `중성화 성견 · ${num(P.petFood('dog', 5, 'neutered').der)}kcal · 봉지 급여표보다 보통 적습니다`, url: '/pet/dog-food/5/', tags: ['강아지사료량', '반려견', '급여량'] },
    { big: `${num(bmr)}kcal`, label: '남 30세 170cm 65kg 기초대사량', sub: `가만히 있어도 쓰는 에너지 · 하루 필요량은 ${num(B.tdee(bmr, 'light'))}kcal · 여 30세 160/55는 ${num(bmrF)}`, url: '/bmr/', tags: ['기초대사량', '다이어트', '칼로리'] },
    { big: w12.size, label: '임신 12주, 아기 크기는', sub: `${w12.len} · ${w12.wt} · 유산 위험이 크게 줄어드는 주`, url: '/pregnancy/week/12/', tags: ['임신12주', '임신초기', '출산'] },
    { big: '생후 99일', label: '100일은 태어난 날을 1일로 세어', sub: '태어난 날 + 99일 · 돌은 달력상 같은 날짜 · 카드로 남기기', url: '/baby/card/', tags: ['100일', '아기', '기념일'] },
    { big: '5가지', label: '생후 2개월 예방접종', sub: 'DTaP · IPV · Hib · 폐렴구균 · 로타 · 같은 날 맞아도 안전 · 캘린더로 받기', url: '/baby/', tags: ['예방접종', '육아', '아기'] },
    { big: wake23, label: '밤 11시에 누우면 이 시각에 일어나기', sub: '90분 주기 5번 · 7.5시간 · 6주기면 08:15', url: '/sleep/', tags: ['수면', '기상시간', '잠'] },
    { big: '0.45kg', label: '하루 500kcal 덜 먹으면 한 주에', sub: '체지방 1kg = 7,700kcal · 한 달 2kg · 석 달 6kg', url: '/diet/', tags: ['다이어트', '감량', '500kcal'] },
    { big: '2,600kcal', label: '남성 19~29세 하루 권장 칼로리', sub: '여성은 2,000kcal · 한국인 영양소 섭취기준 2020 · 30~49세는 2,500', url: '/kcal-need/', tags: ['권장칼로리', '식단', '영양'] },
    { big: w30.wt, label: '임신 30주, 아기 몸무게는', sub: `${w30.size} 크기 · ${w30.len} · 체중이 가장 빨리 느는 시기`, url: '/pregnancy/week/30/', tags: ['임신30주', '임신후기', '출산'] },
    { big: `${m12.h}cm`, label: '첫돌 아기 평균 키', sub: `남아 50백분위 · 몸무게 ${m12.w}kg · 첫걸음은 9~15개월 사이 정상`, url: '/baby/month/12/', tags: ['첫돌', '아기키', '육아'] },
    { big: `${P.catAge(5)}세`, label: '고양이 5살은 사람 나이로', sub: '1살 15세 · 2살 24세 · 이후 해마다 4세 · 11살부터 노령묘', url: '/pet/cat-age/5/', tags: ['고양이나이', '반려묘', '고양이'] },
    { big: `${r160.min}~${r160.max}kg`, label: '키 160cm 정상 체중', sub: `BMI 18.5~22.9 · 표준체중 여 ${B.standardWeight(160, 'f')}kg`, url: '/bmi/160/', tags: ['정상체중', 'BMI', '키160'] },
    { big: `${num(X.steps(30000, 60, 170).kcal)}kcal`, label: '3만보 걸으면', sub: `${X.steps(30000, 60, 170).km}km · ${hm(X.steps(30000, 60, 170).minutes)} · 60kg`, url: '/steps/30000/', tags: ['3만보', '걷기', '칼로리'] },
    { big: `${num(pizza.kcal)}kcal`, label: `${pizza.name} 칼로리`, sub: `밥 ${K.bowls(pizza.kcal)}공기 · 걷기 ${hm(K.minutesFor(pizza.kcal, EX.walking.met, 60))}`, url: `/food/${pizza.slug}/`, tags: ['피자', '칼로리', '야식'] },
    { big: '6주 · 8주 · 10주', label: '강아지 종합백신 시작', sub: '2주 간격 5회 · 광견병 16주 · 심장사상충은 8주부터 매달', url: '/pet/dog-vaccine/', tags: ['강아지예방접종', '반려견', '백신'] },
    { big: `${num(latte.kcal)}kcal`, label: `${latte.name} 한 잔`, sub: `아메리카노는 ${num(food('americano').kcal)}kcal · 하루 두 잔이면 밥 ${K.bowls(latte.kcal * 2)}공기`, url: `/food/${latte.slug}/`, tags: ['라떼', '커피칼로리', '다이어트'] },
    { big: '±3~4%p', label: '줄자로 잰 체지방률의 오차', sub: '허리·목둘레 미 해군 공식 · 인바디 없이 · 아침 공복에 재기', url: '/bodyfat/', tags: ['체지방률', '인바디', '다이어트'] },
    { big: '4~6개월', label: '이유식 시작 시기', sub: '고개를 가누고 음식에 관심 · 쌀미음부터 · 새 재료는 3일 간격', url: '/guide/baby-food/', tags: ['이유식', '육아', '아기'] },
    { big: '20분', label: '담배 한 개비가 줄이는 수명', sub: 'UCL 2024 · 하루 한 갑이면 하루 6시간 40분 · 끊은 날부터 계산', url: '/quit-smoking/', tags: ['금연', '담배', '건강'] },
  ];
}

export function pick(date = new Date()) {
  const list = facts();
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const doy = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000);
  return { ...list[doy % list.length], index: doy % list.length, total: list.length };
}
