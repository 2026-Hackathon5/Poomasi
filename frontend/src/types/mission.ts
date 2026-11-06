
// 미션·완료 기록 화면용 타입
// 기존 프로필, 미션 인증, 메인 화면에서 사용

export type VerifyType = 'photo' | 'location' | 'none';

export interface Mission {
  id: number;
  title: string;
  description: string;
  country: string;
  category: string;
  verifyType: VerifyType;
  xp: number;
  acceptedAt: string;
  placeName?: string;
  address?: string;
}

export interface Review {
  text: string;
  writtenAt: string;
}

export interface CompletedMission extends Mission {
  completedAt: string;
  photoUrl?: string;
  review?: Review;
}

// 아직 수락하지 않은 미션
export interface CatalogMission extends Omit<Mission, 'acceptedAt'> {
  createdAt: string;
}


// ========================================
// 지도 전용 미션 타입
// 기존 Mission과 별도로 관리
// ========================================

export interface MapMission {
  id: number;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  experience: number;
  completed: boolean;
  accepted: boolean;
}

// 지도 미션 후기 타입
export interface MissionReview {
  missionId: number;
  text: string;
  writtenAt: string;
}
