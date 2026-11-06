// 목업 미션 상태를 화면끼리 같이 쓰기 위한 컨텍스트 (메인 B.1 · 랜덤 미션 E · 프로필 I)
// 랜덤 미션에서 수락하면 메인·프로필의 진행 중 미션에도 바로 보인다
// 데이터는 서버(api/missionStore.ts)에서 불러온다
import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { CatalogMission, CompletedMission, Mission } from '../types/mission';

export interface MissionStore {
  xp: number;
  setXp: Dispatch<SetStateAction<number>>;
  progress: Mission[];
  setProgress: Dispatch<SetStateAction<Mission[]>>;
  completed: CompletedMission[];
  setCompleted: Dispatch<SetStateAction<CompletedMission[]>>;
  // 아직 수락하지 않은 미션 (진행 중·완료한 미션은 빠져 있음). 내가 만든 미션도 보이지만 수락은 못 함
  available: CatalogMission[];
  // 뽑기 후보: available에서 내가 만든 미션까지 뺀 것
  drawable: CatalogMission[];
  // 내가 만든 미션인지 (만든 사람은 수락·뽑기 불가 → 스스로 인증해서 경험치 쌓는 것 방지)
  isMyMission: (id: number) => boolean;
  // 서버에 수락 요청 → 성공하면 목록을 다시 불러온다 (실패하면 서버 문구로 에러)
  accept: (m: CatalogMission) => Promise<void>;
  // E.5 내가 만든 미션 (최신순)
  mine: CatalogMission[];
  // E.3 미션 만들기 → 내가 만든 미션 · 전체 미션 맨 위에 추가
  createMission: (input: NewMission) => Promise<CatalogMission>;
  // E.5 내가 만든 미션 삭제 → 목록·뽑기에서 빠짐 (이미 수락한 사람의 진행 중 미션은 그대로)
  deleteMine: (id: number) => Promise<void>;
  // 서버에서 불러오는 중 / 불러오기 실패 문구 / 다시 불러오기
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

// 미션 만들기 폼에서 넘기는 값 (경험치 · id · 날짜는 저장할 때 붙는다)
export type NewMission = Omit<CatalogMission, 'id' | 'xp' | 'createdAt'>;

export const MissionStoreContext = createContext<MissionStore | null>(null);

export function useMissionStore(): MissionStore {
  const store = useContext(MissionStoreContext);
  if (!store) throw new Error('MissionStoreProvider 안에서만 쓸 수 있어요');
  return store;
}
