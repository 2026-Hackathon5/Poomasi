import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { CatalogMission, CompletedMission, Mission } from '../types/mission';
import { todayISO } from '../utils/mission';
import { INITIAL_PROGRESS, INITIAL_XP, buildInitialCompleted } from './missions';
import { INITIAL_CATALOG, INITIAL_MINE, MISSION_XP } from './catalog';
import { MissionStoreContext } from './missionStoreContext';
import type { NewMission } from './missionStoreContext';

const byNewest = (a: CatalogMission, b: CatalogMission) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id;

export default function MissionStoreProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(INITIAL_XP);
  const [progress, setProgress] = useState<Mission[]>(INITIAL_PROGRESS);
  const [completed, setCompleted] = useState<CompletedMission[]>(buildInitialCompleted);
  // 전체 미션 = 시드 미션 + 내가 만든 미션 (최신순)
  const [catalog, setCatalog] = useState<CatalogMission[]>(() => [...INITIAL_CATALOG, ...INITIAL_MINE].sort(byNewest));
  const [mineIds, setMineIds] = useState<number[]>(() => INITIAL_MINE.map((m) => m.id));
  const nextId = useRef(1000); // 새로 만든 미션 id (목업)

  const store = useMemo(() => {
    // 백엔드 my_status처럼: 진행 중이거나 완료한 미션은 목록·뽑기에서 뺀다 (취소한 미션은 다시 나옴)
    const taken = new Set([...progress, ...completed].map((m) => m.id));
    const available = catalog.filter((m) => !taken.has(m.id));
    const mine = catalog.filter((m) => mineIds.includes(m.id));
    const isMyMission = (id: number) => mineIds.includes(id);
    const drawable = available.filter((m) => !isMyMission(m.id));

    // 수락 → 진행 중 미션 맨 뒤에 추가 (수락한 날 = 오늘). 내가 만든 미션은 수락 불가
    const accept = (m: CatalogMission) => {
      if (isMyMission(m.id)) return;
      const { createdAt: _createdAt, ...rest } = m;
      void _createdAt;
      setProgress((list) => (list.some((x) => x.id === m.id) ? list : [...list, { ...rest, acceptedAt: todayISO() }]));
    };

    const createMission = (input: NewMission) => {
      nextId.current += 1;
      const m: CatalogMission = { ...input, id: nextId.current, xp: MISSION_XP[input.verifyType], createdAt: todayISO() };
      setCatalog((list) => [m, ...list]);
      setMineIds((ids) => [m.id, ...ids]);
      return m;
    };

    const deleteMine = (id: number) => {
      setCatalog((list) => list.filter((m) => m.id !== id));
      setMineIds((ids) => ids.filter((x) => x !== id));
    };

    return {
      xp,
      setXp,
      progress,
      setProgress,
      completed,
      setCompleted,
      available,
      drawable,
      isMyMission,
      accept,
      mine,
      createMission,
      deleteMine,
    };
  }, [xp, progress, completed, catalog, mineIds]);

  return <MissionStoreContext.Provider value={store}>{children}</MissionStoreContext.Provider>;
}
