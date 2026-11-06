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
  // 아직 수락하지 않은 미션 (진행 중·완료한 미션은 빠져 있음). 내가 만든 미션도 보이지만 수락은 못 함
  available: CatalogMission[];
  // 뽑기 후보: available에서 내가 만든 미션까지 뺀 것
  drawable: CatalogMission[];
  // 내가 만든 미션인지 (만든 사람은 수락·뽑기 불가 → 스스로 인증해서 경험치 쌓는 것 방지)
  isMyMission: (id: number) => boolean;
  accept: (m: CatalogMission) => void;
  // E.5 내가 만든 미션 (최신순)
  mine: CatalogMission[];
  // E.3 미션 만들기 → 내가 만든 미션 · 전체 미션 맨 위에 추가
  createMission: (input: NewMission) => CatalogMission;
  // E.5 내가 만든 미션 삭제 → 목록·뽑기에서 빠짐 (이미 수락한 사람의 진행 중 미션은 그대로)
  deleteMine: (id: number) => void;
}

// 미션 만들기 폼에서 넘기는 값 (경험치 · id · 날짜는 저장할 때 붙는다)
export type NewMission = Omit<CatalogMission, 'id' | 'xp' | 'createdAt'>;

export const MissionStoreContext = createContext<MissionStore | null>(null);

export function useMissionStore(): MissionStore {
  const store = useContext(MissionStoreContext);
  if (!store) throw new Error('MissionStoreProvider 안에서만 쓸 수 있어요');
  return store;
}
