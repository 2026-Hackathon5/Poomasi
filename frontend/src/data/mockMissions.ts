import type { Mission } from '../types/mission';

export const mockMissions: Mission[] = [
  {
    id: 1,
    title: '북촌한옥마을 구경하기',
    description:
      '한국 특유의 분위기를 느낄 수 있는 북촌한옥마을을 구경하고 분위기 좋은 카페까지 방문해 보세요!',
    address: '서울 종로구 북촌로 53',
    latitude: 37.5826,
    longitude: 126.983,
    category: '장소',
    experience: 50,
    completed: false,
    accepted: false,
  },
  {
    id: 2,
    title: '투썸 카페에서 과제하기',
    description:
      '한국의 유명한 프랜차이즈 카페에서 공부하며 한국 카페 문화를 경험해 보세요!',
    address: '서울 중구 명동 일대',
    latitude: 37.5636,
    longitude: 126.985,
    category: '장소',
    experience: 50,
    completed: false,
    accepted: false,
  },
  {
    id: 3,
    title: '경복궁 산책하기',
    description:
      '한국의 전통 건축과 아름다운 궁궐 풍경을 감상해 보세요!',
    address: '서울 종로구 사직로 161',
    latitude: 37.5796,
    longitude: 126.977,
    category: '장소',
    experience: 50,
    completed: false,
    accepted: false,
  },
];
