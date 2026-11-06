// API 연결 전 목업 데이터 (프로필 I, 메인 B.1에서 같이 씀)
// TODO(API): GET /api/home, GET /api/me/missions 응답으로 교체
import type { CompletedMission, Mission } from '../types/mission';
import samplePhoto from '../assets/profile-sample-photo.jpg';

export const INITIAL_XP = 30;

export const INITIAL_PROGRESS: Mission[] = [
  {
    id: 1,
    title: '떡집에서 개떡 사먹기',
    description: '떡을 전문적으로 만드는 방앗간에 가서 개떡(쑥떡) 사먹기',
    country: '한국',
    category: '음식',
    verifyType: 'photo',
    xp: 20,
    acceptedAt: '2026-11-04',
  },
  {
    id: 2,
    title: 'Greeting the person next to you at the bus stop',
    description: '버스 정류장에서 옆에 있는 사람에게 한국어로 먼저 인사해 보기',
    country: '한국',
    category: '일상',
    verifyType: 'none',
    xp: 10,
    acceptedAt: '2026-11-05',
  },
  {
    id: 3,
    title: '도서관에 해리포터 시리즈가 있는지 물어보기',
    description: '동네 도서관 사서 선생님께 해리포터 시리즈가 있는지 한국어로 물어보기',
    country: '한국',
    category: '음식',
    verifyType: 'location',
    xp: 30,
    acceptedAt: '2026-11-06',
    placeName: '쌍문채움도서관',
  },
];

const KKUL_TTEOK: Mission = {
  id: 0,
  title: '떡집에서 꿀떡 사먹기',
  description: '떡집에서 알록달록한 꿀떡을 골라 사먹기',
  country: '한국',
  category: '음식',
  verifyType: 'photo',
  xp: 20,
  acceptedAt: '2026-11-04',
};

const REVIEWED = new Set([2, 3, 5, 6, 10]); // 목록에서 후기가 작성된 순번 (총 5개)

export function buildInitialCompleted(): CompletedMission[] {
  return Array.from({ length: 12 }, (_, i): CompletedMission => {
    const n = i + 1;
    let base: CompletedMission = {
      ...KKUL_TTEOK,
      id: 100 + n,
      completedAt: '2026-11-04',
      photoUrl: samplePhoto,
    };
    if (n === 2) {
      base = {
        ...INITIAL_PROGRESS[1],
        id: 100 + n,
        completedAt: '2026-11-05',
      };
    } else if (n === 3) {
      base = {
        ...INITIAL_PROGRESS[2],
        id: 100 + n,
        completedAt: '2026-11-06',
      };
    }
    if (REVIEWED.has(n)) {
      base.review = {
        text:
          n === 5
            ? '떡이 너무 맛있고 색이 예쁘다.\n떡집 사장님과 떡 재료에 대해 대화 나누었다.'
            : '좋은 경험이었다. 다음에 또 해보고 싶다.',
        writtenAt: '2026-11-05',
      };
    }
    return base;
  });
}
