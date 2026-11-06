// 미션·완료 기록 화면용 타입 (프로필 I, 미션 인증 F, 메인 B에서 같이 씀)

export type VerifyType = 'photo' | 'location' | 'none';

export interface Mission {
  id: number;
  title: string;
  description: string;
  country: string;
  category: string;
  verifyType: VerifyType;
  xp: number;
  acceptedAt: string; // YYYY-MM-DD
  placeName?: string;
}

export interface Review {
  text: string;
  writtenAt: string; // YYYY-MM-DD
}

export interface CompletedMission extends Mission {
  completedAt: string; // YYYY-MM-DD
  photoUrl?: string;
  review?: Review;
}

// 아직 수락하지 않은 미션 (E. 랜덤 미션 목록·뽑기). 수락하면 acceptedAt이 붙어 Mission이 된다
export interface CatalogMission extends Omit<Mission, 'acceptedAt'> {
  createdAt: string; // YYYY-MM-DD (미션이 만들어진 날)
}
