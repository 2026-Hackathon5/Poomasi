import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import type {
  CatalogMission,
  CompletedMission,
  Mission,
} from '../types/mission';

import { todayISO } from '../utils/mission';

import {
  INITIAL_PROGRESS,
  INITIAL_XP,
  buildInitialCompleted,
} from './missions';

import {
  INITIAL_CATALOG,
  INITIAL_MINE,
  MISSION_XP,
} from './catalog';

import { MissionStoreContext } from './missionStoreContext';
import type { NewMission } from './missionStoreContext';

const byNewest = (
  a: CatalogMission,
  b: CatalogMission
) =>
  b.createdAt.localeCompare(a.createdAt) ||
  b.id - a.id;

export default function MissionStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [xp, setXp] = useState(INITIAL_XP);

  const [progress, setProgress] =
    useState<Mission[]>(INITIAL_PROGRESS);

  const [completed, setCompleted] =
    useState<CompletedMission[]>(buildInitialCompleted);

  // 전체 미션
  const [catalog, setCatalog] =
    useState<CatalogMission[]>(() =>
      [...INITIAL_CATALOG, ...INITIAL_MINE].sort(byNewest)
    );

  const [mineIds, setMineIds] = useState<number[]>(
    () => INITIAL_MINE.map((m) => m.id)
  );

  const nextId = useRef(1000);

  const store = useMemo(() => {
    // 이미 수락했거나 완료한 미션
    const taken = new Set([
      ...progress.map((m) => m.id),
      ...completed.map((m) => m.id),
    ]);

    // 아직 수락하지 않은 미션
    const available = catalog.filter(
      (m) => !taken.has(m.id)
    );

    // 내가 만든 미션
    const mine = catalog.filter(
      (m) => mineIds.includes(m.id)
    );

    const isMyMission = (id: number) =>
      mineIds.includes(id);

    // 내가 만든 미션은 뽑기에서 제외
    const drawable = available.filter(
      (m) => !isMyMission(m.id)
    );

    // ========================================
    // 미션 수락
    // ========================================

    const accept = (m: CatalogMission) => {
      if (isMyMission(m.id)) return;

      setProgress((list) => {
        if (list.some((x) => x.id === m.id)) {
          return list;
        }

        if (completed.some((x) => x.id === m.id)) {
          return list;
        }

        const {
          createdAt: _createdAt,
          ...rest
        } = m;

        void _createdAt;

        return [
          ...list,
          {
            ...rest,
            acceptedAt: todayISO(),
          },
        ];
      });
    };

    // ========================================
    // 미션 생성
    // ========================================

    const createMission = (input: NewMission) => {
      nextId.current += 1;

      const m: CatalogMission = {
        ...input,
        id: nextId.current,
        xp: MISSION_XP[input.verifyType],
        createdAt: todayISO(),
      };

      setCatalog((list) => [m, ...list]);

      setMineIds((ids) => [m.id, ...ids]);

      return m;
    };

    // ========================================
    // 내가 만든 미션 삭제
    // ========================================

    const deleteMine = (id: number) => {
      setCatalog((list) =>
        list.filter((m) => m.id !== id)
      );

      setMineIds((ids) =>
        ids.filter((x) => x !== id)
      );
    };

    // ========================================
    // 지도에서 수락·완료 기록 삭제
    // ========================================

    const removeMissionRecord = (id: number) => {
      setProgress((list) =>
        list.filter((m) => m.id !== id)
      );

      setCompleted((list) =>
        list.filter((m) => m.id !== id)
      );
    };

    return {
      xp,
      setXp,

      progress,
      setProgress,

      completed,
      setCompleted,

      catalog,
      available,
      drawable,

      isMyMission,
      accept,

      mine,
      createMission,
      deleteMine,

      removeMissionRecord,
    };
  }, [
    xp,
    progress,
    completed,
    catalog,
    mineIds,
  ]);

  return (
    <MissionStoreContext.Provider value={store}>
      {children}
    </MissionStoreContext.Provider>
  );
}