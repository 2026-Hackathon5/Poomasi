import type {
  MapMission,
  MissionReview,
} from '../types/mission';

import { api } from './client';
import { CATEGORY_NAME } from './missionStore';

// ========================================
// 서버 응답 모양 (백엔드 MissionOut / UserMissionOut / VerifyResultOut)
// ========================================

interface MissionOut {
  id: number;
  title: string;
  description: string;
  category: string;
  verify_type: 'location' | 'photo' | 'none';
  xp: number;
  place_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  my_status: 'in_progress' | 'reviewing' | 'completed' | null;
}

interface UserMissionOut {
  id: number; // 내 미션 id
  status: string;
  completed_at: string | null;
  review: string | null;
  mission: MissionOut;
}

interface VerifyResultOut {
  success: boolean;
  message: string; // 화면에 그대로 보여줄 문구 (레벨업 문구 포함)
  leveled_up: boolean | null;
}

// ========================================
// 지도 데이터 만들기
// H.2 장소 미션 핀 (GET /api/missions?verify_type=location)
// + 진행 중 미션 (GET /api/me/missions?status=in_progress) → 미션 완료(위치 인증)에 필요한 id
// + H.1 내 완료 장소 깃발 (GET /api/map/flags) → 후기·기록 삭제
// ========================================

function toMapMission(m: MissionOut): MapMission {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    address: m.address ?? m.place_name ?? '',
    latitude: m.lat ?? 0,
    longitude: m.lng ?? 0,
    category: CATEGORY_NAME[m.category] ?? m.category, // place → 장소 등 한글로
    experience: m.xp,
    accepted: false,
    completed: false,
  };
}

async function loadMapMissions(): Promise<MapMission[]> {
  const [missions, inProgress, flags] = await Promise.all([
    api<MissionOut[]>('/api/missions?verify_type=location&limit=100'),
    api<UserMissionOut[]>('/api/me/missions?status=in_progress&limit=100'),
    api<UserMissionOut[]>('/api/map/flags'),
  ]);

  const progressByMission = new Map(inProgress.map((um) => [um.mission.id, um]));
  const result: MapMission[] = [];

  // 1. 아직 완료하지 않은 장소 미션 (수락 전 / 진행 중)
  for (const m of missions) {
    if (m.lat === null || m.lng === null) continue; // 좌표 없는 미션은 지도에 못 그림
    if (m.my_status === 'completed') continue; // 완료한 건 아래 깃발로 따로 넣는다

    const progress = progressByMission.get(m.id);
    result.push({
      ...toMapMission(m),
      accepted: Boolean(progress),
      userMissionId: progress?.id,
    });
  }

  // 2. 내가 완료한 장소 (기록을 삭제하면 서버가 빼고 준다)
  for (const flag of flags) {
    if (flag.mission.lat === null || flag.mission.lng === null) continue;

    result.push({
      ...toMapMission(flag.mission),
      accepted: true,
      completed: true,
      userMissionId: flag.id,
      review: flag.review,
      completedAt: flag.completed_at,
    });
  }

  lastMissions = result;
  return result;
}

// 마지막으로 불러온 목록 (미션 id → 내 미션 id 찾기용)
let lastMissions: MapMission[] = [];

function userMissionIdOf(missionId: number): number {
  const id = lastMissions.find((m) => m.id === missionId)?.userMissionId;
  if (!id) throw new Error('먼저 미션을 수락해 주세요.');
  return id;
}

// 브라우저에서 지금 내 위치 가져오기 (아이폰은 https 주소에서만 동작)
function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 기기에서는 위치를 확인할 수 없어요.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('위치 권한을 허용해 주세요.')),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export const missionsApi = {

  // 지도에 그릴 미션 전체 조회
  async list(): Promise<MapMission[]> {
    return loadMapMissions();
  },

  // 미션 수락 (E.4)
  async accept(id: number): Promise<MapMission[]> {
    await api(`/api/missions/${id}/accept`, { method: 'POST' });
    return loadMapMissions();
  },

  // 미션 완료 = 위치 인증 (F.1). 현재 위치가 미션 장소 반경 안이면 성공
  async complete(id: number): Promise<{ missions: MapMission[]; message: string }> {
    const userMissionId = userMissionIdOf(id);
    const position = await getCurrentPosition();

    const result = await api<VerifyResultOut>(
      `/api/me/missions/${userMissionId}/verify/location`,
      { method: 'POST', body: position },
    );

    if (!result.success) {
      throw new Error(result.message); // 예) 미션 장소에서 1.2km 떨어져 있어요
    }

    return { missions: await loadMapMissions(), message: result.message };
  },

  // 완료 기록 삭제 (I.3) → 깃발도 사라짐
  async remove(id: number): Promise<MapMission[]> {
    await api(`/api/me/missions/${userMissionIdOf(id)}`, { method: 'DELETE' });
    return loadMapMissions();
  },

  // 후기 저장 (I.3, 300자 이하)
  async saveReview(
    review: MissionReview
  ): Promise<void> {
    await api(`/api/me/missions/${userMissionIdOf(review.missionId)}/review`, {
      method: 'PATCH',
      body: { review: review.text },
    });
    await loadMapMissions();
  },

  // 특정 미션 후기 조회 (깃발 목록에 같이 들어 있음)
  async getReview(
    missionId: number
  ): Promise<MissionReview | undefined> {
    const text = lastMissions.find((m) => m.id === missionId)?.review;
    if (!text) return undefined;

    return { missionId, text, writtenAt: '' };
  },
};
