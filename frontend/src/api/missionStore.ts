// 랜덤 미션(E) · 메인(B.1) · 프로필(I)이 같이 쓰는 미션 데이터를 서버에서 불러오는 부품
// 서버 모양(MissionOut / UserMissionOut) ↔ 화면 모양(CatalogMission / Mission) 변환도 여기서 한다
import { api } from './client';
import type { Me } from './me';
import type { CatalogMission, CompletedMission, Mission, VerifyType } from '../types/mission';

// ---------- 서버 응답 모양 ----------

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
  creator_id: string | null;
  created_at: string;
  my_status: 'in_progress' | 'reviewing' | 'completed' | null;
}

interface UserMissionOut {
  id: number; // 내 미션 id
  status: string;
  accepted_at: string;
  completed_at: string | null;
  photo_url: string | null;
  review: string | null;
  reviewed_at: string | null;
  mission: MissionOut;
}

// ---------- 코드 ↔ 한글 이름 ----------

const COUNTRY_NAME: Record<string, string> = { KR: '한국', JP: '일본', CN: '중국', US: '미국' };
const CATEGORY_NAME: Record<string, string> = { experience: '체험', food: '음식', place: '장소' };

const codeOf = (names: Record<string, string>, name: string) =>
  Object.keys(names).find((code) => names[code] === name) ?? name;

// 서버 시각(UTC) → 내 기기 날짜 'YYYY-MM-DD'
function toDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toCatalogMission(m: MissionOut): CatalogMission {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    country: COUNTRY_NAME[m.country] ?? m.country,
    category: CATEGORY_NAME[m.category] ?? m.category,
    verifyType: m.verify_type,
    xp: m.xp,
    placeName: m.place_name ?? undefined,
    address: m.address ?? undefined,
    createdAt: toDate(m.created_at),
  };
}

function toProgress(um: UserMissionOut): Mission {
  const { createdAt: _createdAt, ...rest } = toCatalogMission(um.mission);
  void _createdAt;
  return { ...rest, acceptedAt: toDate(um.accepted_at), userMissionId: um.id };
}

function toCompleted(um: UserMissionOut): CompletedMission {
  return {
    ...toProgress(um),
    completedAt: toDate(um.completed_at),
    photoUrl: um.photo_url ?? undefined,
    review: um.review ? { text: um.review, writtenAt: toDate(um.reviewed_at) } : undefined,
  };
}

// ---------- 불러오기 ----------

export interface MissionData {
  me: Me;
  catalog: (CatalogMission & { creatorId: string | null; myStatus: MissionOut['my_status'] })[];
  progress: Mission[];
  completed: CompletedMission[];
}

export async function loadMissionData(): Promise<MissionData> {
  const [me, missions, progress, completed] = await Promise.all([
    api<Me>('/api/me'),
    api<MissionOut[]>('/api/missions?limit=100'),
    api<UserMissionOut[]>('/api/me/missions?status=in_progress&limit=100'),
    api<UserMissionOut[]>('/api/me/missions?status=completed&limit=100'),
  ]);

  return {
    me,
    catalog: missions.map((m) => ({ ...toCatalogMission(m), creatorId: m.creator_id, myStatus: m.my_status })),
    progress: progress.map(toProgress),
    completed: completed.map(toCompleted),
  };
}

// ---------- 바꾸기 ----------

// E.4 미션 수락
export function acceptMission(missionId: number) {
  return api(`/api/missions/${missionId}/accept`, { method: 'POST' });
}

// E.3 미션 만들기 (위치 미션은 서버가 주소로 좌표를 찾고, 못 찾으면 400 문구)
export async function createMission(input: Omit<CatalogMission, 'id' | 'xp' | 'createdAt'>): Promise<CatalogMission> {
  const created = await api<MissionOut>('/api/missions', {
    method: 'POST',
    body: {
      title: input.title,
      description: input.description,
      country: codeOf(COUNTRY_NAME, input.country),
      category: codeOf(CATEGORY_NAME, input.category),
      verify_type: input.verifyType,
      place_name: input.placeName ?? null,
      address: input.address ?? null,
    },
  });
  return toCatalogMission(created);
}

// E.5 내가 만든 미션 삭제 (숨김)
export function deleteMission(missionId: number) {
  return api(`/api/missions/${missionId}`, { method: 'DELETE' });
}
