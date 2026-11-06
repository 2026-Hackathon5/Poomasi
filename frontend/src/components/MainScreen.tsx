import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserInfo } from '../types/user';
import type { Mission } from '../types/mission';
import { VERIFY_LABEL, VERIFY_TAG, fmtLong, todayISO } from '../utils/mission';
import { getLevel } from '../utils/level';
import { useMissionStore } from '../mocks/missionStoreContext';
import { styles } from '../styles/poomasi';
import { ms } from '../styles/main';
import { Btn, LogoHeader, TabBar } from './ui';
import MissionVerify from './MissionVerify';

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

// 아이콘: Figma 아이콘(energy-icons:seed-20 / akar-icons:clock / chevron-right-small)과 같은 크기로 그림
function SeedIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#DFF4DF" />
      <ellipse cx="20" cy="20" rx="7.5" ry="11" fill="none" stroke="#000" strokeWidth="1.8" />
      <path d="M20 11 C16.5 16 16.5 24 20 29" fill="none" stroke="#000" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="5.8" fill="none" stroke="#000" strokeWidth="1.2" />
      <path d="M7 4 V7 L9 8.3" fill="none" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M5.5 3.8 L8.7 7 L5.5 10.2" fill="none" stroke="#6C6C6C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={ms.tag}>{children}</span>;
}

interface Props {
  userInfo?: UserInfo;
}

export default function MainScreen({ userInfo }: Props) {
  const navigate = useNavigate();
  const nickname = userInfo?.nickname || '품앗이';

  // 목업 미션 상태는 화면끼리 같이 씀 (랜덤 미션에서 수락하면 여기에도 보임)
  const { xp, setXp, progress, setProgress, completed, setCompleted } = useMissionStore();
  const [detailOpen, setDetailOpen] = useState(false);
  const [verifying, setVerifying] = useState<Mission | null>(null);

  const level = getLevel(xp);
  // B.1.2 추천 미션: 진행 중 미션 중 가장 오래전에 수락한 것 (백엔드 home.py와 같은 기준)
  const recommended = [...progress].sort((a, b) => a.acceptedAt.localeCompare(b.acceptedAt))[0] ?? null;
  const reviewCount = completed.filter((c) => c.review).length;

  const startVerify = () => {
    if (!recommended) return;
    setDetailOpen(false);
    setVerifying(recommended);
  };

  // MissionVerify에서 인증 성공 → 진행 중에서 빼고 완료에 넣고 경험치 더하기 → 다음 추천 미션이 카드에 뜬다
  const finishMission = (m: Mission, photoUrl?: string) => {
    setProgress((list) => list.filter((x) => x.id !== m.id));
    setCompleted((list) => [{ ...m, completedAt: todayISO(), photoUrl }, ...list]);
    setXp((v) => v + m.xp);
  };

  const btnLabel = recommended?.verifyType === 'none' ? '완료하기' : '인증하기';

  return (
    <div style={{ ...styles.wrapper, ...ms.wrapper }}>
      <style>{'.ps-scroll::-webkit-scrollbar{display:none}.ps-scroll{scrollbar-width:none}'}</style>

      <LogoHeader style={ms.header} logoStyle={ms.logo} />

      <main className="ps-scroll" style={{ ...styles.content, ...ms.content }}>
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
              <p style={ms.levelLv}>Lv.{level.lv}</p>
              <p style={ms.levelTitle}>{level.title}</p>
            </div>
          </div>
          <div
            style={ms.barTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(level.percent)}
          >
            <div style={{ ...ms.barFill, width: `${level.percent}%` }} />
          </div>
          <div style={ms.levelFoot}>
            <span>{level.nextXp ? `${xp}/${level.nextXp} XP` : `${xp} XP`}</span>
            <span>{level.nextXp ? `다음 레벨까지 ${level.remain} XP` : '최고 레벨이에요!'}</span>
          </div>
        </section>

        {/* B.1.2 진행 중인 미션 */}
        {recommended ? (
          <section style={ms.missionCard} aria-label="진행 중인 미션" onClick={() => setDetailOpen(true)}>
            <div style={ms.missionHead}>
              <span style={ms.missionCount}>진행 중인 미션 {progress.length}개</span>
              <button
                type="button"
                style={ms.allBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/profile', { state: { open: 'mission' } });
                }}
              >
                전체보기
                <ChevronIcon />
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
                [completed.length, '완료한 미션'],
                [progress.length, '진행 중'],
                [reviewCount, '작성한 후기'],
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
