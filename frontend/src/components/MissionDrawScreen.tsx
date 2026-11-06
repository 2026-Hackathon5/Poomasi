import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CatalogMission, VerifyType } from '../types/mission';
import { fmtLong } from '../utils/mission';
import { useMissionStore } from '../mocks/missionStoreContext';
import { styles } from '../styles/poomasi';
import { rs } from '../styles/random';
import { Btn, LogoHeader, TabBar } from './ui';
import { MissionTags, Toast } from './missionParts';

/* ────────────────────────────────────────────────────────────────
 * 랜덤 미션 (E.2) — 미션 뽑기 화면 (/missions/draw)
 *
 *  - 들어오면 바로 1개를 뽑는다 (전체 미션에서 고른 국가 안에서, 진행 중·완료한 미션 · 내가 만든 미션 제외)
 *  - [다시 뽑기] → 직전 미션을 빼고 다시 뽑기. 다른 미션이 없으면 안내 후 지금 미션 유지
 *  - [수락하기] → 전체 미션으로 돌아가 "미션 수락 완료!" 토스트
 *  - [<] → 전체 미션
 *
 * TODO(API): GET /api/missions/random?country=&exclude_id= (백엔드와 같은 규칙)
 * ──────────────────────────────────────────────────────────────── */

// Figma 뽑기 카드의 인증 방식 표기
const DRAW_VERIFY_LABEL: Record<VerifyType, string> = {
  photo: '사진 찍기',
  location: '위치 전송',
  none: '없음',
};

const NOTICE_MS = 1800;

function pickRandom(list: CatalogMission[]) {
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

export default function MissionDrawScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { drawable, accept } = useMissionStore();
  const country = (location.state as { country?: string } | null)?.country ?? '';
  const candidates = country ? drawable.filter((m) => m.country === country) : drawable;

  const [mission, setMission] = useState<CatalogMission | null>(() => pickRandom(candidates));
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);

  const backToList = () => navigate('/missions', { state: { country } });

  const redraw = () => {
    const next = pickRandom(candidates.filter((m) => m.id !== mission?.id));
    if (next) setMission(next);
    else setNotice('다른 미션이 없어요. 지금 미션에 도전해 보세요');
  };

  const acceptMission = () => {
    if (!mission) return;
    accept(mission);
    navigate('/missions', { state: { toast: '미션 수락 완료!', country } });
  };

  return (
    <div style={{ ...styles.wrapper, ...rs.drawWrapper }}>
      <LogoHeader style={rs.header} logoStyle={rs.logo} onBack={backToList} />

      <div style={rs.circle}>
        <p style={rs.circleTitle}>{mission ? '뽑기 완료!' : '앗!'}</p>
        <p style={rs.circleSub}>{mission ? '새로운 미션에 도전해볼까요?' : '뽑을 수 있는 미션이 없어요'}</p>
      </div>

      {mission ? (
        <section style={rs.drawCard} aria-label="뽑은 미션">
          <div style={rs.cardTop}>
            <MissionTags m={mission} withVerify={false} />
            <span style={rs.date}>{fmtLong(mission.createdAt)}</span>
          </div>
          <h2 style={rs.drawTitle}>{mission.title}</h2>
          <p style={rs.desc}>{mission.description}</p>
          <p style={rs.info}>
            <b style={rs.infoKey}>인증 방식</b>
            <span style={rs.infoValue}>{DRAW_VERIFY_LABEL[mission.verifyType]}</span>
          </p>
          <p style={rs.info}>
            <b style={rs.infoKey}>완료시 획득 경험치</b>
            <span style={rs.infoValue}>+{mission.xp}XP</span>
          </p>
          <div style={rs.btnRow}>
            <Btn style={{ ...rs.btn, ...rs.btnGray, flex: 1 }} onClick={redraw}>
              다시 뽑기
            </Btn>
            <Btn style={{ ...rs.btn, flex: 1 }} onClick={acceptMission}>
              수락하기
            </Btn>
          </div>
        </section>
      ) : (
        <section style={{ ...rs.drawCard, alignItems: 'center' }} aria-label="뽑을 미션 없음">
          <p style={rs.drawEmptyText}>
            {country ? `${country} 미션은 모두 수락했어요.` : '모든 미션을 수락했어요.'}
            <br />
            다른 국가를 골라 보거나 진행 중인 미션을 먼저 완료해 보세요.
          </p>
          <Btn style={{ ...rs.btn, width: '100%' }} onClick={backToList}>
            전체 미션으로 가기
          </Btn>
        </section>
      )}

      {notice && <Toast>{notice}</Toast>}

      <TabBar active="랜덤미션" style={rs.tabBar} tabStyle={rs.tab} />
    </div>
  );
}
