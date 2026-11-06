import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CatalogMission } from '../types/mission';
import { fmtLong } from '../utils/mission';
import { MISSION_COUNTRIES } from '../mocks/catalog';
import { useMissionStore } from '../mocks/missionStoreContext';
import { styles } from '../styles/poomasi';
import { rs } from '../styles/random';
import { Btn, LogoHeader, TabBar } from './ui';
import { ChevronDown, ChevronRight, MissionTags, Toast } from './missionParts';

/* ────────────────────────────────────────────────────────────────
 * 랜덤 미션 (E) — 전체 미션 화면 (/missions, 하단 탭 [랜덤미션])
 *
 * Figma 프로토타입 흐름
 *  - [관심있는 국가를 선택해보자!] → 국가 선택 시트 (뽑기에 쓰임)
 *  - [미션 뽑기] → 미션 뽑기 화면 (/missions/draw)
 *  - 미션 카드 [자세히 >] → 미션 자세히 팝업 → [닫기] / [수락하기]
 *  - [수락하기] → "미션 수락 완료!" 토스트 → 목록에서 빠짐 (메인·프로필 진행 중에 추가)
 *  - [내가 만든 미션] 탭 → 다음 작업(E.3 · E.5)에서 연결
 *
 * TODO(API): 목록 GET /api/missions, 수락 POST /api/missions/{id}/accept
 * ──────────────────────────────────────────────────────────────── */

const TOAST_MS = 1500;
const ALL = '전체';

export default function RandomMissionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { available, accept } = useMissionStore();

  // 뽑기 화면에서 수락하고 돌아오면 토스트를 띄운다
  const [toast, setToast] = useState(() => (location.state as { accepted?: boolean } | null)?.accepted === true);
  const [country, setCountry] = useState((location.state as { country?: string } | null)?.country ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detail, setDetail] = useState<CatalogMission | null>(null);

  useEffect(() => {
    if (!toast) return;
    // 새로고침·뒤로가기로 토스트가 다시 뜨지 않게 주소의 state를 지운다
    navigate('.', { replace: true, state: null });
    const t = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast, navigate]);

  const acceptMission = (m: CatalogMission) => {
    accept(m);
    setDetail(null);
    setToast(true);
  };

  return (
    <div style={{ ...styles.wrapper, ...rs.listWrapper }}>
      <style>{'.ps-scroll::-webkit-scrollbar{display:none}.ps-scroll{scrollbar-width:none}'}</style>

      <LogoHeader style={rs.header} logoStyle={rs.logo} />

      <main className="ps-scroll" style={{ ...styles.content, ...rs.listContent }}>
        {/* E.2.1 미션 뽑기 + E.1.1 국가 선택 */}
        <section style={rs.drawBox} aria-label="미션 뽑기">
          <button type="button" style={rs.countrySelect} onClick={() => setSheetOpen(true)}>
            <span style={country ? rs.countrySelected : undefined}>{country || '관심있는 국가를 선택해보자!'}</span>
            <ChevronDown />
          </button>
          <Btn style={rs.drawBtn} onClick={() => navigate('/missions/draw', { state: { country } })}>
            미션 뽑기
          </Btn>
        </section>

        {/* 미션 범위 탭 */}
        <div style={rs.scopeTabs} role="tablist">
          <button type="button" role="tab" aria-selected="true" style={{ ...rs.scopeTab, ...rs.scopeTabActive }}>
            전체 미션
          </button>
          {/* TODO(E.3 · E.5): 내가 만든 미션 화면이 붙으면 연결 */}
          <button type="button" role="tab" aria-selected="false" style={rs.scopeTab}>
            내가 만든 미션
          </button>
        </div>

        {/* E.4 미션 목록 (최신순, 진행 중·완료한 미션은 빠짐) */}
        <section style={rs.list} aria-label="전체 미션 목록">
          {available.length === 0 && <p style={rs.empty}>지금 도전할 수 있는 미션을 모두 수락했어요!</p>}
          {available.map((m) => (
            <article key={m.id} style={rs.card}>
              <div style={rs.cardTop}>
                <MissionTags m={m} />
                <button type="button" style={rs.moreBtn} onClick={() => setDetail(m)}>
                  자세히
                  <ChevronRight />
                </button>
              </div>
              <h2 style={rs.cardTitle}>{m.title}</h2>
              <div style={rs.cardFoot}>
                <span style={rs.date}>{fmtLong(m.createdAt)}</span>
                <div style={rs.footRight}>
                  <span style={rs.xp}>+{m.xp}XP</span>
                  <Btn style={rs.btn} onClick={() => acceptMission(m)}>
                    수락하기
                  </Btn>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      {toast && <Toast>미션 수락 완료!</Toast>}

      <TabBar active="랜덤미션" style={rs.tabBar} tabStyle={rs.tab} />

      {/* 미션 자세히 팝업: 바깥을 누르거나 [닫기]로 닫힘 */}
      {detail && (
        <div style={{ ...styles.overlay, ...rs.overlay }} onClick={() => setDetail(null)}>
          <div role="dialog" aria-modal="true" style={rs.detail} onClick={(e) => e.stopPropagation()}>
            <div style={rs.cardTop}>
              <MissionTags m={detail} />
              <span style={rs.date}>{fmtLong(detail.createdAt)}</span>
            </div>
            <h2 style={rs.cardTitle}>{detail.title}</h2>
            <p style={rs.desc}>{detail.description}</p>
            <p style={rs.xp}>+{detail.xp}XP</p>
            <div style={rs.btnRow}>
              <Btn style={{ ...rs.btn, ...rs.btnGray, flex: 1 }} onClick={() => setDetail(null)}>
                닫기
              </Btn>
              <Btn style={{ ...rs.btn, flex: 1 }} onClick={() => acceptMission(detail)}>
                수락하기
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* 국가 선택 시트 (프로필 국적 시트와 같은 모양) */}
      {sheetOpen && (
        <div style={{ ...styles.overlay, alignItems: 'flex-end' }} onClick={() => setSheetOpen(false)}>
          <div role="dialog" aria-modal="true" style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.sheetTitle}>관심있는 국가 선택</h3>
            <div style={styles.sheetList}>
              {[ALL, ...MISSION_COUNTRIES].map((c) => {
                const selected = (country || ALL) === c;
                return (
                  <button
                    key={c}
                    type="button"
                    style={styles.sheetItem}
                    onClick={() => {
                      setCountry(c === ALL ? '' : c);
                      setSheetOpen(false);
                    }}
                  >
                    <span style={{ fontWeight: selected ? 700 : 400 }}>{c}</span>
                    {selected && <span style={{ color: '#8A8A8A' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
