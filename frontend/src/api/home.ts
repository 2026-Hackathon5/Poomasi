// B.1 메인 화면 API — GET /api/home
import type { Mission, VerifyType } from '../types/mission';
import { apiFetch } from './client';
import { CATEGORY_LABEL, COUNTRY_LABEL } from './codes';

// ---------- 백엔드 응답 모양 (Swagger의 HomeOut 그대로) ----------

export interface LevelOut {
  level: number;
  title: string;
  total_xp: number;
  current_level_xp: number;
  next_level_xp: number | null; // 최고 레벨이면 null
  xp_to_next: number;
}

export interface MissionOut {
  id: number;
  title: string;
  description: string;
  country: string; // KR / JP / CN / US
  category: string; // experience / food / place
  verify_type: VerifyType;
  xp: number;
  place_name: string | null;
  address: string | null;
}

export interface UserMissionOut {
  id: number; // 내 미션 id → 인증 API 주소에 씀
  status: 'in_progress' | 'reviewing' | 'completed' | 'cancelled';
  accepted_at: string;
  mission: MissionOut;
}

export interface StatsOut {
  completed_missions: number;
  in_progress: number;
  reviews: number;
  posts: number;
  comments: number;
}

export interface HomeOut {
  nickname: string;
  level: LevelOut;
  recommended: UserMissionOut | null; // null이면 [미션 뽑으러 가기]
  stats: StatsOut;
}

// ---------- 요청 ----------

export const getHome = () => apiFetch<HomeOut>('/api/home');

// ---------- 화면 모양으로 바꾸기 ----------

// 내 미션(API) → 화면이 쓰던 Mission. id는 "내 미션 id"로 넣어서 인증할 때 그대로 쓴다
export function toScreenMission(um: UserMissionOut): Mission {
  const m = um.mission;
  return {
    id: um.id,
    title: m.title,
    description: m.description,
    country: COUNTRY_LABEL[m.country] ?? m.country,
    category: CATEGORY_LABEL[m.category] ?? m.category,
    verifyType: m.verify_type,
    xp: m.xp,
    acceptedAt: um.accepted_at.slice(0, 10), // "2026-11-04T10:00:00Z" → "2026-11-04"
    placeName: m.place_name ?? undefined,
    address: m.address ?? undefined,
  };
}