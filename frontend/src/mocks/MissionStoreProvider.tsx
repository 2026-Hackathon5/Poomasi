import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CatalogMission, CompletedMission, Mission } from '../types/mission';
import { todayISO } from '../utils/mission';
import { INITIAL_PROGRESS, INITIAL_XP, buildInitialCompleted } from './missions';
import { INITIAL_CATALOG } from './catalog';
import { MissionStoreContext } from './missionStoreContext';

export default function MissionStoreProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(INITIAL_XP);
  const [progress, setProgress] = useState<Mission[]>(INITIAL_PROGRESS);
  const [completed, setCompleted] = useState<CompletedMission[]>(buildInitialCompleted);
  const [catalog] = useState<CatalogMission[]>(INITIAL_CATALOG);

  const store = useMemo(() => {
    // 백엔드 my_status처럼: 진행 중이거나 완료한 미션은 목록·뽑기에서 뺀다 (취소한 미션은 다시 나옴)
    const taken = new Set([...progress, ...completed].map((m) => m.id));
    const available = catalog.filter((m) => !taken.has(m.id));

    // 수락 → 진행 중 미션 맨 뒤에 추가 (수락한 날 = 오늘)
    const accept = (m: CatalogMission) => {
      const { createdAt: _createdAt, ...rest } = m;
      void _createdAt;
      setProgress((list) => (list.some((x) => x.id === m.id) ? list : [...list, { ...rest, acceptedAt: todayISO() }]));
    };

    return { xp, setXp, progress, setProgress, completed, setCompleted, available, accept };
  }, [xp, progress, completed, catalog]);

  return <MissionStoreContext.Provider value={store}>{children}</MissionStoreContext.Provider>;
}
