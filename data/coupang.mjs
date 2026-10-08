/* 쿠팡 파트너스 링크 — 계산과 바로 이어지는 물건만, 검색 결과로 보내는 간편 링크(상품 품절·가격 변동에 덜 흔들림).
 * 2026-10-08 쿠팡 파트너스 '간편 링크 만들기'로 생성(채널: 기본값), 사이트 bodyzip.com 은 파트너스 '내 정보'에 등록함.
 * 같은 날 사진을 넣으며 '상품 링크'로 상품 하나씩 골라 바꿈(img 는 쿠팡 썸네일). 상품이 품절·단종되면 사진이 깨지니 석 달에 한 번 확인.
 * 혈압계·혈당측정기·임신테스트기 같은 의료기기는 파트너스 상품 목록에 없거나 광고 심의 대상이라 사진 없이 검색 링크로 둔다.
 * 링크가 붙는 페이지에는 공정위 지침에 따른 대가성 문구(DISCLOSURE)를 반드시 같이 보인다.
 * 건강 수치 페이지에는 효능을 말하지 않고 '집에서 잴 때'처럼 쓰임만 적는다. */

export const DISCLOSURE = '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

const L = {
  bp: { href: 'https://link.coupang.com/a/hF47vU0Y9s', label: '가정용 혈압계', note: '집에서 아침·저녁 재 볼 때' },
  scale: { href: 'https://link.coupang.com/a/hGdMrzfzr2', img: 'https://thumbnail9.coupangcdn.com/thumbnails/remote/212x212ex/image/vendor_inventory/4648/4cfff6daadefc36564afb347ad0a4ec6306457b38045478adf0e9bec2f80.jpg', label: '앳플리 T8 체성분 체중계', note: '몸무게와 체지방률을 함께 기록할 때' },
  tape: { href: 'https://link.coupang.com/a/hGdUU5J3sq', img: 'https://t4a.coupangcdn.com/thumbnails/remote/212x212ex/image/retail/images/2022/12/13/10/6/d06d19f7-ccc1-4ace-a831-7859dfeaf798.jpg', label: '아케이 리빙 원터치 줄자', note: '허리·목 둘레를 잴 때' },
  formula: { href: 'https://link.coupang.com/a/hGdWEMWSOa', img: 'https://t4c.coupangcdn.com/thumbnails/remote/212x212ex/image/retail/images/2424625360261656-9afc9037-44f9-40fd-9ddc-ffd7b57ffc7c.jpg', label: '보아르 아가맘마 분유포트', note: '물 온도를 맞춰 분유를 탈 때' },
  dogFood: { href: 'https://link.coupang.com/a/hGdXsNb5H2', img: 'https://t2c.coupangcdn.com/thumbnails/remote/212x212ex/image/1025_amir_coupang_oct_80k/8cd4/d4e2f2d5d255ecda1cb3f626d7b773e3f65d8740fcb6e14d2fbcdeca102c.jpg', label: '탐사 강아지 사료 연어 3kg', note: '나이·몸무게에 맞는 사료 고를 때' },
  seniorDog: { href: 'https://link.coupang.com/a/hGdYgugXK0', img: 'https://thumbnail14.coupangcdn.com/thumbnails/remote/212x212ex/image/retail/images/2020/03/02/13/8/fcd4bc36-8173-4d95-a53c-f50b5ee33155.jpg', label: '밥이보약 시니어 강아지 사료', note: '7살이 넘은 강아지라면' },
  catFood: { href: 'https://link.coupang.com/a/hGdY2Urb3s', img: 'https://thumbnail9.coupangcdn.com/thumbnails/remote/212x212ex/image/vendor_inventory/04ba/a1bc4959876d2fe0142a25ac955787be30d58a04be47ab729f487f46f708.jpg', label: '캐츠랑 전연령 고양이 사료 5kg', note: '나이·몸무게에 맞는 사료 고를 때' },
  glucose: { href: 'https://link.coupang.com/a/hF5cn9P72y', label: '혈당측정기', note: '집에서 공복·식후 혈당을 잴 때' },
  pedometer: { href: 'https://link.coupang.com/a/hGdZUsnVDg', img: 'https://thumbnail11.coupangcdn.com/thumbnails/remote/212x212ex/image/vendor_inventory/230e/feea8f5b1a9d54d48412599862c3d301ef609b10ae1fd31aebf1171cb9d7.png', label: '하네르 디지털 클립 만보기', note: '하루 걸음 수를 세어 볼 때' },
  bottle: { href: 'https://link.coupang.com/a/hGd0IVzzjg', img: 'https://t5a.coupangcdn.com/thumbnails/remote/212x212ex/image/retail/images/1136476493470109-65ce19d0-c8e7-4e7a-93a7-97572373828d.jpg', label: '락앤락 1L 물병', note: '하루 마신 물을 눈으로 셀 때' },
  height: { href: 'https://link.coupang.com/a/hGd1Gw3hJc', img: 'https://t2c.coupangcdn.com/thumbnails/remote/212x212ex/image/vendor_inventory/bed6/fec0da13a94da2ae8dc7babaf0a0a2e8d3fe4892f45e612a1b2951c470ad.jpg', label: '카스 키즈 미터 키재기', note: '아이 키를 집에서 잴 때' },
  decaf: { href: 'https://link.coupang.com/a/hGd2sLHHb2', img: 'https://thumbnail5.coupangcdn.com/thumbnails/remote/212x212ex/image/retail/images/986731722095208-2563dcf9-9465-4e76-936b-e5e136d1e108.jpg', label: '카누 미니 디카페인 30개입', note: '카페인을 줄이고 싶을 때' },
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
