import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type {
  CatalogMission,
  CompletedMission,
  Mission,
} from '../types/mission';

export interface MissionStore {
  xp: number;
  setXp: Dispatch<SetStateAction<number>>;

  progress: Mission[];
  setProgress: Dispatch<SetStateAction<Mission[]>>;

  completed: CompletedMission[];
  setCompleted: Dispatch<SetStateAction<CompletedMission[]>>;

  // 전체 미션
  catalog: CatalogMission[];

  // 아직 수락하지 않은 미션
  available: CatalogMission[];

  // 뽑기 후보
  drawable: CatalogMission[];

  isMyMission: (id: number) => boolean;

  accept: (m: CatalogMission) => void;

  mine: CatalogMission[];

  createMission: (input: NewMission) => CatalogMission;

  deleteMine: (id: number) => void;

  // 지도에서 수락·완료 기록 삭제
  removeMissionRecord: (id: number) => void;
}

export type NewMission = Omit<
  CatalogMission,
  'id' | 'xp' | 'createdAt'
>;

export const MissionStoreContext =
  createContext<MissionStore | null>(null);

export function useMissionStore(): MissionStore {
  const store = useContext(MissionStoreContext);

  if (!store) {
    throw new Error(
      'MissionStoreProvider 안에서만 쓸 수 있어요'
    );
  }

  return store;
}