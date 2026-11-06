// I 내 미션 관리 API (프로필에서 사용)
// 주소의 id는 "내 미션 id"(user_mission id). 미션 id가 아님에 주의
import { api } from './client';

// I.2 진행 중 미션 취소 → 그 미션은 다시 목록·뽑기에 나온다
export function cancelMyMission(userMissionId: number) {
  return api(`/api/me/missions/${userMissionId}/cancel`, { method: 'POST' });
}

// I.3 완료 기록 삭제 (받은 경험치는 그대로 유지)
export function deleteMyRecord(userMissionId: number) {
  return api(`/api/me/missions/${userMissionId}`, { method: 'DELETE' });
}

// I.3 후기 작성·수정 (1~300자)
export function writeReview(userMissionId: number, review: string) {
  return api(`/api/me/missions/${userMissionId}/review`, {
    method: 'PATCH',
    body: { review },
  });
}
