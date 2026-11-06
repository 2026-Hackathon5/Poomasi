// F 미션 인증 API (사진 · 위치 · 인증 없음)
// 주소의 id는 "내 미션 id"(user_mission id). 미션 id가 아님에 주의
import { api } from './client';

// 서버 응답 (백엔드 VerifyResultOut)
export interface VerifyResult {
  success: boolean; // false면 진행 중 그대로 → 다시 시도
  message: string; // 화면에 그대로 보여줄 문구. 예) 미션 완료! 20 경험치를 얻었어요 🎉 Lv.2 싹을 틔운 볍씨가 되었어요
  distance_m: number | null; // 위치 인증일 때 미션 장소까지 거리(m)
  xp_gained: number | null;
  leveled_up: boolean | null; // true면 레벨업
  level: number | null;
  title: string | null; // 칭호
}

// F.2 사진 인증: 사진 파일을 보내면 AI가 미션과 관련 있는지 판정 (보통 5초 안팎)
export function verifyPhoto(userMissionId: number, photo: Blob): Promise<VerifyResult> {
  const form = new FormData();
  form.append('photo', photo, 'photo.jpg');
  return api<VerifyResult>(`/api/me/missions/${userMissionId}/verify/photo`, {
    method: 'POST',
    body: form,
  });
}

// 브라우저에서 지금 내 위치 가져오기 (아이폰은 https 주소에서만 동작)
function currentPosition(): Promise<{ lat: number; lng: number }> {
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

// F.1 위치 인증: 지금 위치가 미션 장소 반경 안이면 성공
export async function verifyLocation(userMissionId: number): Promise<VerifyResult> {
  const body = await currentPosition();
  return api<VerifyResult>(`/api/me/missions/${userMissionId}/verify/location`, {
    method: 'POST',
    body,
  });
}

// F.3 인증 없음: 바로 완료
export function verifyNone(userMissionId: number): Promise<VerifyResult> {
  return api<VerifyResult>(`/api/me/missions/${userMissionId}/verify/none`, { method: 'POST' });
}
