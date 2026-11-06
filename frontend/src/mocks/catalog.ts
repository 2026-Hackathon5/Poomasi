// 랜덤 미션(E) 목업
// TODO(API): GET /api/missions, GET /api/missions/random으로 교체

import type { CatalogMission, VerifyType } from '../types/mission';

// 백엔드 services/level.py MISSION_XP와 같은 값
export const MISSION_XP: Record<VerifyType, number> = {
  location: 30,
  photo: 20,
  none: 10,
};

// 국가 선택
export const MISSION_COUNTRIES = ['한국', '일본', '중국', '미국'];

type Seed = Omit<CatalogMission, 'id' | 'xp'>;

const SEEDS: Seed[] = [
  {
    title: '덕성여대 대강의동에서 품앗이 시작하기',
    description:
      '대강의동 앞에 도착해서 위치 인증을 해 보세요. 오늘 만난 친구에게 한국어로 "반가워요!"라고 인사도 건네 봐요.',
    country: '한국',
    category: '장소',
    verifyType: 'location',
    placeName: '덕성여자대학교 대강의동',
    address: '서울 도봉구 삼양로144길 33',
    latitude: 37.6520,
    longitude: 127.0164,
    createdAt: '2026-11-05',
  },
  {
    title: '땅콩버터잼 샌드위치 만들기',
    description:
      '미국 아이들의 단골 도시락이에요.\n식빵에 땅콩버터와 딸기잼을 바르면 끝!\n완성한 샌드위치를 찍어주세요',
    country: '미국',
    category: '음식',
    verifyType: 'photo',
    createdAt: '2026-11-03',
  },
  {
    title: '인천 차이나타운 걸어보기',
    description:
      '중국의 분위기를 느낄 수 있는 곳! 짜장면 박물관 근처에서 위치를 인증해주세요~',
    country: '중국',
    category: '장소',
    verifyType: 'location',
    placeName: '짜장면박물관',
    address: '인천 중구 차이나타운로 56-14',
    latitude: 37.4756,
    longitude: 126.6175,
    createdAt: '2026-11-01',
  },
  {
    title: '“수고하세요”는 언제 쓸까?',
    description:
      '가게를 나설 때 한국 사람들이 자주 하는 "수고하세요". 언제, 누구에게 쓰는 말인지 한국 친구에게 물어봐요.',
    country: '한국',
    category: '체험',
    verifyType: 'none',
    createdAt: '2026-10-30',
  },
  {
    title: '종이학 접기',
    description:
      '일본의 종이접기(오리가미)로 종이학을 하나 접어서 사진을 찍어요.',
    country: '일본',
    category: '체험',
    verifyType: 'photo',
    createdAt: '2026-10-29',
  },
  {
    title: '동부이촌동에서 일본 가정식 먹기',
    description:
      "일본 사람들이 많이 살아 '리틀 도쿄'라고도 불리는 동부이촌동에서 돈카츠나 일본식 정식을 먹어 봐요.",
    country: '일본',
    category: '음식',
    verifyType: 'location',
    placeName: '동부이촌동',
    address: '서울 용산구 이촌동 일대',
    latitude: 37.5215,
    longitude: 126.9705,
    createdAt: '2026-10-28',
  },
  {
    title: '광장시장에서 빈대떡 먹기',
    description:
      '100년 넘은 시장에서 갓 부친 빈대떡과 마약김밥을 맛봐요.',
    country: '한국',
    category: '음식',
    verifyType: 'location',
    placeName: '광장시장',
    address: '서울 종로구 창경궁로 88',
    latitude: 37.5701,
    longitude: 126.9997,
    createdAt: '2026-10-27',
  },
  {
    title: '중국어로 "니하오" 인사하기',
    description:
      '중국 친구에게 "你好(니하오)"로 인사하고, 중국어 인사말 하나를 더 배워 봐요.',
    country: '중국',
    category: '체험',
    verifyType: 'none',
    createdAt: '2026-10-26',
  },
  {
    title: '한복 입고 사진 찍기',
    description:
      '한복을 빌려 입고 마음에 드는 곳에서 사진을 남겨요.',
    country: '한국',
    category: '체험',
    verifyType: 'photo',
    createdAt: '2026-10-25',
  },
  {
    title: '이태원에서 미국식 수제버거 먹기',
    description:
      '여러 나라 문화가 섞인 이태원에서 미국식 수제버거를 먹어 보고 한국 버거와 비교해 봐요.',
    country: '미국',
    category: '음식',
    verifyType: 'location',
    placeName: '이태원',
    address: '서울 용산구 이태원동 일대',
    latitude: 37.5344,
    longitude: 126.9946,
    createdAt: '2026-10-24',
  },
];

// 최신순
export const INITIAL_CATALOG: CatalogMission[] = SEEDS.map((m, i) => ({
  ...m,
  id: 201 + i,
  xp: MISSION_XP[m.verifyType],
}));

// 내가 만든 미션
const MY_SEEDS: Seed[] = [
  {
    title: '불닭볶음면 물 없이 먹기',
    description:
      '매운 불닭볶음면을 물 없이 끝까지 먹어 보고 사진으로 인증해요. 매운 음식이 약하면 우유를 준비하세요!',
    country: '한국',
    category: '음식',
    verifyType: 'photo',
    createdAt: '2026-11-04',
  },
  {
    title: '편의점 삼각김밥 깔끔하게 뜯기',
    description:
      '1, 2, 3 순서대로 뜯어서 김이 찢어지지 않은 삼각김밥을 찍어 보세요.',
    country: '한국',
    category: '음식',
    verifyType: 'photo',
    createdAt: '2026-10-31',
  },
  {
    title: '“밥 한번 먹자” 진짜 뜻 알기',
    description:
      '한국 사람이 헤어질 때 하는 "언제 밥 한번 먹자"가 진짜 약속인지, 인사인지 한국 친구에게 물어봐요.',
    country: '한국',
    category: '체험',
    verifyType: 'none',
    createdAt: '2026-10-28',
  },
];

export const INITIAL_MINE: CatalogMission[] = MY_SEEDS.map((m, i) => ({
  ...m,
  id: 301 + i,
  xp: MISSION_XP[m.verifyType],
}));

// 미션 만들기 선택지
export const MISSION_CATEGORIES = ['체험', '음식', '장소'];