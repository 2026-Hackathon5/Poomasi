import { api } from './client';
import type { UserInfo } from '../types/user';

// GET /api/me 응답 모양 (백엔드 MeOut)
export interface Me {
  id: string;
  email: string | null;
  nickname: string;
  user_type: 'korean' | 'foreign_resident';
  nationality: string; // KR / JP / CN / US / OTHER
  xp: number;
  level: {
    level: number;
    title: string; // 예) 싹을 틔운 볍씨
    total_xp: number;
    current_level_xp: number; // 지금 레벨 시작 xp (경험치 바 왼쪽 끝)
    next_level_xp: number | null; // 최고 레벨이면 null
    xp_to_next: number;
  };
  created_at: string;
}

export function getMe(): Promise<Me> {
  return api<Me>('/api/me');
}

// 서버 정보 → 화면에서 쓰는 UserInfo 모양으로 바꾼다
export function toUserInfo(me: Me): UserInfo {
  return {
    email: me.email ?? '',
    nickname: me.nickname,
    userType: me.user_type === 'korean' ? 'korean' : 'foreign',
    country: me.nationality,
  };
}
