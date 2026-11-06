// 목업 미션 상태를 화면끼리 같이 쓰기 위한 컨텍스트 (메인 B.1 · 랜덤 미션 E · 프로필 I)
// 랜덤 미션에서 수락하면 메인·프로필의 진행 중 미션에도 바로 보인다
// TODO(API): 서버 데이터로 바꾸면 이 컨텍스트는 API 호출로 대체
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
  // 아직 수락하지 않은 미션 (진행 중·완료한 미션은 빠져 있음)
  available: CatalogMission[];
  accept: (m: CatalogMission) => void;
}

export const MissionStoreContext = createContext<MissionStore | null>(null);

export function useMissionStore(): MissionStore {
  const store = useContext(MissionStoreContext);
  if (!store) throw new Error('MissionStoreProvider 안에서만 쓸 수 있어요');
  return store;
}
