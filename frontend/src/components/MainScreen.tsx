import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserInfo } from '../types/user';
import type { Mission } from '../types/mission';
import { VERIFY_LABEL, VERIFY_TAG, fmtLong, todayISO } from '../utils/mission';
import { getHome, toScreenMission } from '../api/home';
import type { HomeOut } from '../api/home';
import { styles } from '../styles/poomasi';
import { ms } from '../styles/main';
import { Btn, LogoHeader, TabBar } from './ui';
import MissionVerify from './MissionVerify';
import { ChevronRight, ClockIcon, SeedIcon } from './icons';

/* ────────────────────────────────────────────────────────────────
 * 메인 화면 (B.1)
 *
 *  - 인사말 "오늘도 한 걸음, OO 님의 품앗이에요!"
 *  - B.1.1 레벨 카드: 레벨 · 칭호 · 경험치 바 · 다음 레벨까지 남은 XP
 *  - B.1.2 진행 중인 미션 카드: 가장 오래전에 수락한 1개
 *      카드 / [인증하기] → 미션 상세 팝업 → [인증하기] → MissionVerify (F)
 *      진행 중 미션이 없으면 [미션 뽑으러 가기] → 랜덤 미션(E)
 *      [전체보기] → 프로필의 My Mission
 *  - B.1.3 나의 활동: 완료한 미션 · 진행 중 · 작성한 후기
 *
 * TODO(API): GET /api/home 응답(nickname, level, recommended, stats)으로 교체
 * ──────────────────────────────────────────────────────────────── */


// 수락한 날부터 오늘까지 며칠 지났는지 → "오늘 수락" / "2일전 수락"
function acceptedLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const [ty, tm, td] = todayISO().split('-').map(Number);
  const days = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000);
  return days <= 0 ? '오늘 수락' : `${days}일전 수락`;
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={ms.tag}>{children}</span>;
}

interface Props {
  userInfo?: UserInfo;
}

export default function MainScreen({ userInfo }: Props) {
  const navigate = useNavigate();

  // 목업 미션 상태는 화면끼리 같이 씀 (랜덤 미션에서 수락하면 여기에도 보임)
   // GET /api/home 응답. 불러오기 전에는 null
  const [home, setHome] = useState<HomeOut | null>(null);
  const nickname = home?.nickname || userInfo?.nickname || '품앗이'; 
  const [error, setError] = useState('');

  // 화면에 들어오면 한 번 불러온다
  useEffect(() => {
    getHome()
      .then(setHome)
      .catch((e: Error) => setError(e.message));
  }, []);

  // 인증 후처럼 다시 불러올 때 쓰는 함수
  const reload = () => {
    setError('');
    getHome()
      .then(setHome)
      .catch((e: Error) => setError(e.message));
  };
  const [detailOpen, setDetailOpen] = useState(false);
  const [verifying, setVerifying] = useState<Mission | null>(null);

    // 레벨 · 추천 미션 · 활동 수는 서버가 계산해서 준다
  const level = home?.level;
  const recommended = home?.recommended ? toScreenMission(home.recommended) : null;
  const stats = home?.stats;
  // 경험치 바 %: (지금 xp - 이번 레벨 시작 xp) / (다음 레벨 xp - 이번 레벨 시작 xp)
  const percent =
    level && level.next_level_xp
      ? ((level.total_xp - level.current_level_xp) / (level.next_level_xp - level.current_level_xp)) * 100
      : 100;
  const startVerify = () => {
    if (!recommended) return;
    setDetailOpen(false);
    setVerifying(recommended);
  };

  // MissionVerify에서 인증 성공 → 진행 중에서 빼고 완료에 넣고 경험치 더하기 → 다음 추천 미션이 카드에 뜬다
  const finishMission = () => {
    reload();
  };

  const btnLabel = recommended?.verifyType === 'none' ? '완료하기' : '인증하기';

  return (
    <div style={{ ...styles.wrapper, ...ms.wrapper }}>
      <style>{'.ps-scroll::-webkit-scrollbar{display:none}.ps-scroll{scrollbar-width:none}'}</style>

      <LogoHeader style={ms.header} logoStyle={ms.logo} />

      <main className="ps-scroll" style={{ ...styles.content, ...ms.content }}>
        {/* 불러오는 중 / 실패했을 때 */}
        {!home && !error && <p style={{ padding: '10px', color: '#5E5E5E' }}>불러오는 중이에요...</p>}
        {error && (
          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: '#E53935' }}>{error}</p>
            <Btn onClick={reload}>다시 시도</Btn>
          </div>
        )}
        <h1 style={ms.greeting}>
          오늘도 한 걸음,
          <br />
          <span style={ms.nickname}>{nickname}</span> 님의 품앗이에요!
        </h1>

        {/* B.1.1 레벨 카드 */}
        <section style={ms.levelCard} aria-label="나의 레벨">
          <div style={ms.levelTop}>
            <span style={ms.seedBox}>
              <SeedIcon />
            </span>
            <div style={ms.levelText}>
              <p style={ms.levelLv}>Lv.{level?.level}</p>
              <p style={ms.levelTitle}>{level?.title}</p>
            </div>
          </div>
          <div
            style={ms.barTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
          >
            <div style={{ ...ms.barFill, width: `${percent}%` }} />
          </div>
          <div style={ms.levelFoot}>
            <span>{level?.next_level_xp ? `${level.total_xp}/${level.next_level_xp} XP` : `${level?.total_xp ?? 0} XP`}</span>
            <span>{level?.next_level_xp ? `다음 레벨까지 ${level.xp_to_next} XP` : '최고 레벨이에요!'}</span>
          </div>
        </section>

        {/* B.1.2 진행 중인 미션 */}
        {recommended ? (
          <section style={ms.missionCard} aria-label="진행 중인 미션" onClick={() => setDetailOpen(true)}>
            <div style={ms.missionHead}>
              <span style={ms.missionCount}>진행 중인 미션 {stats?.in_progress ?? 0}개</span>
              <button
                type="button"
                style={ms.allBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/profile', { state: { open: 'mission' } });
                }}
              >
                전체보기
                <ChevronRight size={14} />
              </button>
            </div>
            <div style={ms.tagRow}>
              <Tag>{recommended.country}</Tag>
              <Tag>{recommended.category}</Tag>
              <Tag>{VERIFY_TAG[recommended.verifyType]}</Tag>
            </div>
            <h2 style={ms.missionTitle}>{recommended.title}</h2>
            <div style={ms.missionFoot}>
              <span style={ms.accepted}>
                <ClockIcon />
                {acceptedLabel(recommended.acceptedAt)}
              </span>
              {/* 누르면 카드와 같이 상세 팝업이 열림 (클릭이 카드로 전달됨) */}
              <Btn style={ms.btn}>{btnLabel}</Btn>
            </div>
          </section>
        ) : (
          <section style={{ ...ms.missionCard, cursor: 'default' }} aria-label="진행 중인 미션">
            <div style={ms.missionHead}>
              <span style={ms.missionCount}>진행 중인 미션 0개</span>
            </div>
            <p style={ms.emptyText}>
              진행 중인 미션이 없어요.
              <br />
              새로운 미션을 뽑아 볼까요?
            </p>
            <Btn style={{ ...ms.btn, width: '100%' }} onClick={() => navigate('/missions')}>
              미션 뽑으러 가기
            </Btn>
          </section>
        )}

        {/* B.1.3 나의 활동 */}
        <section style={ms.stats} aria-label="나의 활동">
          <h3 style={ms.statsTitle}>나의 활동</h3>
          <div style={styles.stats}>
            {(
              [
                [stats?.completed_missions ?? 0, '완료한 미션'],
                [stats?.in_progress ?? 0, '진행 중'],
                [stats?.reviews ?? 0, '작성한 후기'],
              ] as const
            ).map(([n, label]) => (
              <div key={label} style={{ ...styles.stat, ...ms.stat }}>
                <strong style={{ ...styles.statNum, ...ms.statNum }}>{n}</strong>
                <span style={{ ...styles.statLabel, ...ms.statLabel }}>{label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <TabBar style={ms.tabBar} tabStyle={ms.tab} />

      {/* 미션 상세 팝업: 바깥을 누르면 닫힘 */}
      {detailOpen && recommended && (
        <div style={{ ...styles.overlay, ...ms.overlay }} onClick={() => setDetailOpen(false)}>
          <div role="dialog" aria-modal="true" style={ms.detail} onClick={(e) => e.stopPropagation()}>
            <div style={ms.detailTop}>
              <div style={ms.tagRow}>
                <Tag>{recommended.country}</Tag>
                <Tag>{recommended.category}</Tag>
              </div>
              <span style={ms.detailDate}>{fmtLong(recommended.acceptedAt)}</span>
            </div>
            <h2 style={ms.detailTitle}>{recommended.title}</h2>
            <p style={ms.detailDesc}>{recommended.description}</p>
            <p style={ms.detailInfo}>
              <b style={ms.detailKey}>인증 방식</b>
              <span style={ms.detailValue}>{VERIFY_LABEL[recommended.verifyType]}</span>
            </p>
            <p style={ms.detailInfo}>
              <b style={ms.detailKey}>완료시 획득 경험치</b>
              <span style={ms.detailValue}>+{recommended.xp}XP</span>
            </p>
            <Btn style={{ ...ms.btn, width: '100%' }} onClick={startVerify}>
              {btnLabel}
            </Btn>
          </div>
        </div>
      )}

      {verifying && (
        <MissionVerify mission={verifying} onVerified={finishMission} onClose={() => setVerifying(null)} />
      )}
    </div>
  );
}
