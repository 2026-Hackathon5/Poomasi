
import type { Mission, MissionReview } from '../types/mission';
import { mockMissions } from '../data/mockMissions';

const STORAGE_KEY = 'poomasi_missions';
const REVIEW_KEY = 'poomasi_reviews';

function getSavedMissions(): Mission[] {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(mockMissions)
    );

    return mockMissions;
  }

  return JSON.parse(saved) as Mission[];
}

function saveMissions(missions: Mission[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(missions)
  );
}

export const missionsApi = {
  async list(): Promise<Mission[]> {
    return getSavedMissions();
  },

  async accept(id: number): Promise<Mission[]> {
    const missions = getSavedMissions();

    const updated = missions.map((mission) =>
      mission.id === id
        ? { ...mission, accepted: true }
        : mission
    );

    saveMissions(updated);
    return updated;
  },

  async complete(id: number): Promise<Mission[]> {
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

  async remove(id: number): Promise<Mission[]> {
    const updated = getSavedMissions().filter(
      (mission) => mission.id !== id
    );

    saveMissions(updated);
    return updated;
  },

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
};
