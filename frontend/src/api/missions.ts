
import type {
  MapMission,
  MissionReview,
} from '../types/mission';

import { mockMissions } from '../data/mockMissions';

const STORAGE_KEY = 'poomasi_missions';
const REVIEW_KEY = 'poomasi_reviews';

// 저장된 지도 미션 불러오기
function getSavedMissions(): MapMission[] {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(mockMissions)
    );

    return mockMissions;
  }

  return JSON.parse(saved) as MapMission[];
}

// 지도 미션 저장
function saveMissions(missions: MapMission[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(missions)
  );
}

export const missionsApi = {

  // 전체 지도 미션 조회
  async list(): Promise<MapMission[]> {
    return getSavedMissions();
  },

  // 미션 수락
  async accept(id: number): Promise<MapMission[]> {
    const missions = getSavedMissions();

    const updated = missions.map((mission) =>
      mission.id === id
        ? { ...mission, accepted: true }
        : mission
    );

    saveMissions(updated);

    return updated;
  },

  // 미션 완료
  async complete(id: number): Promise<MapMission[]> {
    const missions = getSavedMissions();

    const updated = missions.map((mission) =>
      mission.id === id
        ? {
            ...mission,
            accepted: true,
            completed: true,
          }
        : mission
    );

    saveMissions(updated);

    return updated;
  },

  // 미션 삭제
  async remove(id: number): Promise<MapMission[]> {
    const updated = getSavedMissions().filter(
      (mission) => mission.id !== id
    );

    saveMissions(updated);

    return updated;
  },

  // 후기 저장
  async saveReview(
    review: MissionReview
  ): Promise<void> {
    const saved = localStorage.getItem(REVIEW_KEY);

    const reviews: MissionReview[] = saved
      ? JSON.parse(saved)
      : [];

    reviews.push(review);

    localStorage.setItem(
      REVIEW_KEY,
      JSON.stringify(reviews)
    );
  },

  // 특정 미션 후기 조회
  async getReview(
    missionId: number
  ): Promise<MissionReview | undefined> {
    const saved = localStorage.getItem(REVIEW_KEY);

    const reviews: MissionReview[] = saved
      ? JSON.parse(saved)
      : [];

    return reviews.find(
      (review) => review.missionId === missionId
    );
  },

  // 특정 미션 후기 삭제
  async removeReview(
    missionId: number
  ): Promise<void> {
    const saved = localStorage.getItem(REVIEW_KEY);

    const reviews: MissionReview[] = saved
      ? JSON.parse(saved)
      : [];

    const updated = reviews.filter(
      (review) => review.missionId !== missionId
    );

    localStorage.setItem(
      REVIEW_KEY,
      JSON.stringify(updated)
    );
  },
};
