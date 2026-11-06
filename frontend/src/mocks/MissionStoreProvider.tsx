import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CatalogMission, CompletedMission, Mission } from '../types/mission';
import { MissionStoreContext } from './missionStoreContext';
import type { NewMission } from './missionStoreContext';
import { supabase } from '../lib/supabase';
import {
  acceptMission,
  createMission as createMissionApi,
  deleteMission,
  loadMissionData,
} from '../api/missionStore';
import type { MissionData } from '../api/missionStore';

// 미션 데이터를 화면끼리 같이 쓰는 저장소 (메인 B.1 · 랜덤 미션 E · 프로필 I)
// 서버에서 불러오고, 수락·만들기·삭제 후에는 서버에서 다시 불러와 모든 화면이 같은 값을 보게 한다
export default function MissionStoreProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(0);
  const [progress, setProgress] = useState<Mission[]>([]);
  const [completed, setCompleted] = useState<CompletedMission[]>([]);
  const [catalog, setCatalog] = useState<MissionData['catalog']>([]);
  const [myId, setMyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      // 로그인 전: 비워 둔다 (로그인하면 아래 onAuthStateChange가 다시 부른다)
      setLoading(false);
      return;
    }

    try {
      const loaded = await loadMissionData();
      setXp(loaded.me.xp);
      setMyId(loaded.me.id);
      setCatalog(loaded.catalog);
      setProgress(loaded.progress);
      setCompleted(loaded.completed);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '미션을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 처음 열 때 + 로그인·로그아웃할 때마다 다시 불러온다
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCatalog([]);
        setProgress([]);
        setCompleted([]);
        setXp(0);
        setMyId('');
        return;
      }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        // supabase 콜백 안에서 바로 서버를 부르면 막힐 수 있어서 한 박자 뒤에 부른다
        setTimeout(() => void refresh(), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const store = useMemo(() => {
    const isMyMission = (id: number) => catalog.some((m) => m.id === id && m.creatorId === myId);

    // 서버의 my_status 기준: 진행 중이거나 완료한 미션은 목록·뽑기에서 뺀다 (취소한 미션은 다시 나옴)
    const available: CatalogMission[] = catalog.filter((m) => m.myStatus === null);
    const mine: CatalogMission[] = catalog.filter((m) => m.creatorId !== null && m.creatorId === myId);
    const drawable = available.filter((m) => !isMyMission(m.id));

    const accept = async (m: CatalogMission) => {
      await acceptMission(m.id);
      await refresh();
    };

    const createMission = async (input: NewMission) => {
      const created = await createMissionApi(input);
      await refresh();
      return created;
    };

    const deleteMine = async (id: number) => {
      await deleteMission(id);
      await refresh();
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
      loading,
      error,
      refresh,
    };
  }, [xp, progress, completed, catalog, myId, loading, error, refresh]);

  return <MissionStoreContext.Provider value={store}>{children}</MissionStoreContext.Provider>;
}
