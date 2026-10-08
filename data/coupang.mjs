/* 쿠팡 파트너스 링크 — 계산과 바로 이어지는 물건만, 검색 결과로 보내는 간편 링크(상품 품절·가격 변동에 덜 흔들림).
 * 2026-10-08 쿠팡 파트너스 '간편 링크 만들기'로 생성(채널: 기본값), 사이트 bodyzip.com 은 파트너스 '내 정보'에 등록함.
 * 링크가 붙는 페이지에는 공정위 지침에 따른 대가성 문구(DISCLOSURE)를 반드시 같이 보인다.
 * 건강 수치 페이지에는 효능을 말하지 않고 '집에서 잴 때'처럼 쓰임만 적는다. */

export const DISCLOSURE = '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

const L = {
  bp: { href: 'https://link.coupang.com/a/hF47vU0Y9s', label: '가정용 혈압계', note: '집에서 아침·저녁 재 볼 때' },
  scale: { href: 'https://link.coupang.com/a/hF49Lsy0DQ', label: '체지방 체중계', note: '몸무게와 체지방률을 함께 기록할 때' },
  tape: { href: 'https://link.coupang.com/a/hF49Zwg85Y', label: '신체 줄자', note: '허리·목 둘레를 잴 때' },
  formula: { href: 'https://link.coupang.com/a/hF5adOKqjs', label: '분유포트', note: '물 온도를 맞춰 분유를 탈 때' },
  dogFood: { href: 'https://link.coupang.com/a/hF5bHVRJnw', label: '강아지 사료', note: '나이·몸무게에 맞는 사료 고를 때' },
  seniorDog: { href: 'https://link.coupang.com/a/hF5bVTCClw', label: '노령견 사료', note: '7살이 넘은 강아지라면' },
  catFood: { href: 'https://link.coupang.com/a/hF5b9WUgMe', label: '고양이 사료', note: '나이·몸무게에 맞는 사료 고를 때' },
  glucose: { href: 'https://link.coupang.com/a/hF5cn9P72y', label: '혈당측정기', note: '집에서 공복·식후 혈당을 잴 때' },
  pedometer: { href: 'https://link.coupang.com/a/hF5dQWVmvY', label: '만보기', note: '하루 걸음 수를 세어 볼 때' },
  bottle: { href: 'https://link.coupang.com/a/hF5d44Cc2e', label: '1리터 물병', note: '하루 마신 물을 눈으로 셀 때' },
  height: { href: 'https://link.coupang.com/a/hF5elswfjU', label: '키재기 신장계', note: '아이 키를 집에서 잴 때' },
  decaf: { href: 'https://link.coupang.com/a/hF5ezTvOGy', label: '디카페인 커피', note: '카페인을 줄이고 싶을 때' },
};

/* 주소 앞부분 → 붙일 링크 (위에서부터 처음 맞는 줄 하나) */
const RULES = [
  [/^\/bp\//, ['bp']],
  [/^\/glucose\//, ['glucose']],
  [/^\/bodyfat\//, ['tape', 'scale']],
  [/^\/(bmi|weight|bmr|kcal-need|diet)\//, ['scale']],
  [/^\/baby\/formula\//, ['formula']],
  [/^\/pet\/dog-(age|food)\//, ['dogFood', 'seniorDog']],
  [/^\/pet\/cat-(age|food)\//, ['catFood']],
  [/^\/(steps|exercise)\//, ['pedometer']],
  [/^\/water\//, ['bottle']],
  [/^\/(kids|child-height)\//, ['height']],
  [/^\/caffeine\//, ['decaf']],
];

export function coupangFor(url) {
  const hit = RULES.find(([re]) => re.test(url || ''));
  return hit ? hit[1].map((k) => L[k]) : [];
}
