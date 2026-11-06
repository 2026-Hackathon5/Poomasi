import { useEffect, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { UserInfo } from '../types/user';
import type { CompletedMission, Mission } from '../types/mission';
import { VERIFY_LABEL, fmtLong, fmtShort, todayISO } from '../utils/mission';
import { styles } from '../styles/poomasi';
import { Alert, Btn, Panel, Tags } from './ui';
import MissionVerify from './MissionVerify';
import logoHeader from '../assets/logo-header.png';
import samplePhoto from '../assets/profile-sample-photo.jpg';
import sampleMap from '../assets/profile-sample-map.png';

/* ────────────────────────────────────────────────────────────────
 * 내 프로필 (I) 화면 — 프로필 / 미션 / 미션 인증(F) / 후기
 *
 * 화면 흐름 (Figma)
 *  1. 접힌 메인 (My Profile / My Mission)
 *  2. My Profile 펼침 → [회원 정보 변경] → 수정 모드 → 국적 바텀시트 → 저장/취소
 *  3. My Mission 펼침 → 진행 중 미션 [상세정보]
 *       → 인증하기 → MissionVerify.tsx (미션 인증 F)
 *       → 미션 취소
 *  4. 완료된 미션 [상세정보] → 후기 작성 / 작성한 후기 열람 / 기록 삭제
 *  5. [더보기] → 전체 목록
 * ──────────────────────────────────────────────────────────────── */

type Modal =
  | { kind: 'none' }
  | { kind: 'country' }
  | { kind: 'detail'; id: number }
  | { kind: 'cancelDone' }
  | { kind: 'list'; section: 'progress' | 'completed' }
  | { kind: 'completedDetail'; id: number }
  | { kind: 'reviewView'; id: number }
  | { kind: 'reviewWrite'; id: number }
  | { kind: 'deleteDone' };

type Section = 'none' | 'profile' | 'mission';

/* ───────────────────────── 상수 / 목업 데이터 ───────────────────────── */

const COUNTRY_LIST = ['대한민국', '일본', '중국', '미국', '기타'];
const NICKNAME_RE = /^[A-Za-z0-9가-힣]{1,20}$/;
const MAX_VISIBLE = 4; // 각 목록 최대 4개 노출, 5개 이상은 더보기
const MIN_REVIEW_LENGTH = 2;

// 백엔드 services/level.py와 같은 칭호·기준 (API 연결 전 목업용)
const LEVELS = [
  { lv: 1, title: '땅에 심은 볍씨', min: 0 },
  { lv: 2, title: '싹을 틔운 볍씨', min: 50 },
  { lv: 3, title: '함께 심은 모', min: 150 },
  { lv: 4, title: '고개 숙인 벼', min: 300 },
  { lv: 5, title: '볍씨를 나누는 벼', min: 500 },
];

function getLevel(xp: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) idx = i;
  });
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1];
  return {
    lv: cur.lv,
    title: cur.title,
    nextXp: next ? next.min : null,
    percent: next ? Math.min(100, ((xp - cur.min) / (next.min - cur.min)) * 100) : 100,
  };
}

const INITIAL_PROGRESS: Mission[] = [
  {
    id: 1,
    title: '떡집에서 개떡 사먹기',
    description: '떡을 전문적으로 만드는 방앗간에 가서 개떡(쑥떡) 사먹기',
    country: '한국',
    category: '음식',
    verifyType: 'photo',
    xp: 20,
    acceptedAt: '2026-11-04',
  },
  {
    id: 2,
    title: 'Greeting the person next to you at the bus stop',
    description: '버스 정류장에서 옆에 있는 사람에게 한국어로 먼저 인사해 보기',
    country: '한국',
    category: '일상',
    verifyType: 'none',
    xp: 10,
    acceptedAt: '2026-11-05',
  },
  {
    id: 3,
    title: '도서관에 해리포터 시리즈가 있는지 물어보기',
    description: '동네 도서관 사서 선생님께 해리포터 시리즈가 있는지 한국어로 물어보기',
    country: '한국',
    category: '음식',
    verifyType: 'location',
    xp: 30,
    acceptedAt: '2026-11-06',
    placeName: '쌍문채움도서관',
  },
];

const KKUL_TTEOK: Mission = {
  id: 0,
  title: '떡집에서 꿀떡 사먹기',
  description: '떡집에서 알록달록한 꿀떡을 골라 사먹기',
  country: '한국',
  category: '음식',
  verifyType: 'photo',
  xp: 20,
  acceptedAt: '2026-11-04',
};

const REVIEWED = new Set([2, 3, 5, 6, 10]); // 목록에서 후기가 작성된 순번 (총 5개)

function buildInitialCompleted(): CompletedMission[] {
  return Array.from({ length: 12 }, (_, i): CompletedMission => {
    const n = i + 1;
    let base: CompletedMission = {
      ...KKUL_TTEOK,
      id: 100 + n,
      completedAt: '2026-11-04',
      photoUrl: samplePhoto,
    };
    if (n === 2) {
      base = {
        ...INITIAL_PROGRESS[1],
        id: 100 + n,
        completedAt: '2026-11-05',
      };
    } else if (n === 3) {
      base = {
        ...INITIAL_PROGRESS[2],
        id: 100 + n,
        completedAt: '2026-11-06',
      };
    }
    if (REVIEWED.has(n)) {
      base.review = {
        text:
          n === 5
            ? '떡이 너무 맛있고 색이 예쁘다.\n떡집 사장님과 떡 재료에 대해 대화 나누었다.'
            : '좋은 경험이었다. 다음에 또 해보고 싶다.',
        writtenAt: '2026-11-05',
      };
    }
    return base;
  });
}

/* ───────────────────────── 작은 UI 조각 ───────────────────────── */

function Triangle({ dir }: { dir: 'left' | 'down' }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      {dir === 'left' ? (
        <path d="M18 4 L18 20 L4 12 Z" fill="#4C3D34" strokeLinejoin="round" stroke="#4C3D34" strokeWidth="2" />
      ) : (
        <path d="M3 5 L21 5 L12 20 Z" fill="#4C3D34" strokeLinejoin="round" stroke="#4C3D34" strokeWidth="2" />
      )}
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="#fff" strokeWidth="1.3" />
      <path d="M4.8 8.3 L7 10.4 L11.2 5.8" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MissionRow({
  m,
  completed,
  onDetail,
}: {
  m: Mission | CompletedMission;
  completed?: boolean;
  onDetail: () => void;
}) {
  const done = completed ? (m as CompletedMission) : null;
  const reviewed = !!done?.review;
  return (
    <div style={styles.row}>
      <span style={styles.checkbox} aria-hidden="true">
        {reviewed && <span style={styles.redCheck}>✓</span>}
      </span>
      <span
        style={{
          ...styles.rowTitle,
          ...(completed
            ? { textDecoration: 'line-through', textDecorationColor: '#E53935', textDecorationThickness: '1.5px' }
            : null),
        }}
      >
        {m.title}
      </span>
      {done && <span style={styles.rowDate}>{fmtShort(done.completedAt)}</span>}
      <button type="button" style={styles.detailBtn} onClick={onDetail}>
        상세정보
      </button>
    </div>
  );
}

/* ───────────────────────── 메인 컴포넌트 ───────────────────────── */

interface Props {
  userInfo?: UserInfo;
  setUserInfo?: Dispatch<SetStateAction<UserInfo>>;
}

export default function ProfileScreen({ userInfo, setUserInfo }: Props) {
  // 어떤 섹션이 펼쳐져 있는지 (아코디언: 하나만 열림)
  const [open, setOpen] = useState<Section>('none');

  // 프로필
  const [profile, setProfile] = useState<UserInfo>({
    email: userInfo?.email || 'poomasi@gmail.com',
    nickname: userInfo?.nickname || '품앗이',
    userType: userInfo && (userInfo.email || userInfo.nickname) ? userInfo.userType : 'foreign',
    country: userInfo?.country || '일본',
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserInfo>(profile);
  const [countryKeyword, setCountryKeyword] = useState('');

  // 미션
  const [xp, setXp] = useState(30);
  const [progress, setProgress] = useState<Mission[]>(INITIAL_PROGRESS);
  const [completed, setCompleted] = useState<CompletedMission[]>(buildInitialCompleted);

  // 팝업 / 인증 / 토스트
  const [modal, setModal] = useState<Modal>({ kind: 'none' });
  const [verifying, setVerifying] = useState<Mission | null>(null); // 인증 중인 미션 → MissionVerify
  const [reviewText, setReviewText] = useState('');
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const level = getLevel(xp);
  const reviewCount = completed.filter((c) => c.review).length;
  const closeModal = () => setModal({ kind: 'none' });

  /* ── 프로필 ── */

  const toggleSection = (s: Exclude<Section, 'none'>) => {
    setOpen((cur) => (cur === s ? 'none' : s));
    setEditing(false); // 접으면 수정 중이던 내용은 버림
  };

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const nicknameError = !editing
    ? ''
    : draft.nickname.trim() === ''
      ? '닉네임을 입력해주세요.'
      : !NICKNAME_RE.test(draft.nickname)
        ? '한글, 영문, 숫자만 20자 이내로 입력 가능합니다.'
        : '';
  const canSave = editing && nicknameError === '' && draft.country !== '';

  const saveProfile = () => {
    if (!canSave) return;
    const next = { ...draft, nickname: draft.nickname.trim() };
    setProfile(next);
    setUserInfo?.(next);
    setEditing(false);
  };

  /* ── 인증 (F) ── */

  const findProgress = (id: number) => progress.find((m) => m.id === id);
  const findCompleted = (id: number) => completed.find((m) => m.id === id);

  // MissionVerify에서 인증에 성공하면 불림 → 진행 중에서 빼고 완료 맨 앞에 넣고 경험치 더하기
  const finishMission = (m: Mission, photoUrl?: string) => {
    setProgress((list) => list.filter((x) => x.id !== m.id));
    setCompleted((list) => [{ ...m, completedAt: todayISO(), photoUrl }, ...list]);
    setXp((v) => v + m.xp);
  };

  const startVerify = (m: Mission) => {
    closeModal();
    setVerifying(m);
  };

  const cancelMission = (id: number) => {
    setProgress((list) => list.filter((m) => m.id !== id));
    setModal({ kind: 'cancelDone' });
  };

  /* ── 완료 기록 / 후기 ── */

  const deleteRecord = (id: number) => {
    setCompleted((list) => list.filter((m) => m.id !== id));
    setModal({ kind: 'deleteDone' });
  };

  const openReviewWrite = (id: number) => {
    setReviewText('');
    setModal({ kind: 'reviewWrite', id });
  };

  const saveReview = (id: number) => {
    const text = reviewText.trim();
    if (text.length < MIN_REVIEW_LENGTH) return;
    setCompleted((list) => list.map((m) => (m.id === id ? { ...m, review: { text, writtenAt: todayISO() } } : m)));
    closeModal();
    setToast(true);
  };

  /* ───────── 렌더: 섹션 ───────── */

  const renderProfileBody = () => (
    <div style={styles.cardBody}>
      <label style={styles.label}>닉네임</label>
      <input
        type="text"
        value={editing ? draft.nickname : profile.nickname}
        readOnly={!editing}
        maxLength={20}
        onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
        style={{ ...styles.input, ...(nicknameError ? { borderColor: '#E53935' } : null) }}
      />
      {nicknameError && <span style={styles.errorText}>{nicknameError}</span>}

      <label style={styles.label}>나의 레벨·칭호</label>
      {editing ? (
        <div style={{ ...styles.input, ...styles.levelEdit }}>
          Lv.{level.lv} {level.title}
        </div>
      ) : (
        <div style={{ ...styles.input, ...styles.levelView }}>
          <div style={{ ...styles.levelFill, width: `${level.percent}%` }} />
          <span style={styles.levelText}>
            Lv.{level.lv} {level.title}
          </span>
          <span style={styles.levelXp}>{level.nextXp ? `${xp}/${level.nextXp} XP` : `${xp} XP`}</span>
        </div>
      )}

      <label style={styles.label}>이메일</label>
      <input type="email" value={profile.email} readOnly style={styles.input} />

      <label style={styles.label}>사용자 유형</label>
      <div style={styles.typeRow}>
        {(
          [
            ['foreign', '한국에 거주하는 외국인'],
            ['korean', '한국인'],
          ] as const
        ).map(([value, text]) => {
          const current = editing ? draft.userType : profile.userType;
          return (
            <button
              key={value}
              type="button"
              disabled={!editing}
              onClick={() => setDraft({ ...draft, userType: value })}
              style={{
                ...styles.typeBtn,
                ...(current === value ? styles.typeBtnActive : null),
                cursor: editing ? 'pointer' : 'default',
              }}
            >
              {text}
            </button>
          );
        })}
      </div>

      <label style={styles.label}>국적</label>
      {editing ? (
        <button
          type="button"
          style={{ ...styles.input, ...styles.selectBtn }}
          onClick={() => {
            setCountryKeyword('');
            setModal({ kind: 'country' });
          }}
        >
          <span>{draft.country || '국적을 선택해주세요.'}</span>
          <span style={styles.chevron}>⌄</span>
        </button>
      ) : (
        <input type="text" value={profile.country} readOnly style={styles.input} />
      )}

      <div style={styles.profileBtns}>
        {editing ? (
          <>
            <Btn onClick={saveProfile} disabled={!canSave} style={{ flex: 1 }}>
              저장
            </Btn>
            <Btn variant="taupe" onClick={() => setEditing(false)} style={{ flex: 1 }}>
              취소
            </Btn>
          </>
        ) : (
          <Btn onClick={startEdit} style={{ width: '100%' }}>
            회원 정보 변경
          </Btn>
        )}
      </div>
    </div>
  );

  const renderMissionBody = () => (
    <div style={styles.cardBody}>
      <div style={styles.sectionHead}>
        <h3 style={styles.sectionTitle}>진행 중인 미션</h3>
        {progress.length > MAX_VISIBLE && (
          <button type="button" style={styles.moreBtn} onClick={() => setModal({ kind: 'list', section: 'progress' })}>
            더보기
          </button>
        )}
      </div>
      <div style={styles.rows}>
        {progress.length === 0 && <p style={styles.empty}>아직 진행 중인 미션이 없어요</p>}
        {progress.slice(0, MAX_VISIBLE).map((m) => (
          <MissionRow key={m.id} m={m} onDetail={() => setModal({ kind: 'detail', id: m.id })} />
        ))}
      </div>

      <div style={{ ...styles.sectionHead, marginTop: '18px' }}>
        <h3 style={styles.sectionTitle}>완료된 미션</h3>
        {completed.length > MAX_VISIBLE && (
          <button type="button" style={styles.moreBtn} onClick={() => setModal({ kind: 'list', section: 'completed' })}>
            더보기
          </button>
        )}
      </div>
      <div style={styles.rows}>
        {completed.length === 0 && <p style={styles.empty}>완료한 미션이 아직 없어요. 첫 미션에 도전해 보세요!</p>}
        {completed.slice(0, MAX_VISIBLE).map((m) => (
          <MissionRow key={m.id} m={m} completed onDetail={() => setModal({ kind: 'completedDetail', id: m.id })} />
        ))}
      </div>

      <h3 style={{ ...styles.sectionTitle, marginTop: '18px' }}>나의 활동</h3>
      <div style={styles.stats}>
        {[
          [completed.length, '완료한 미션'],
          [progress.length, '진행 중'],
          [reviewCount, '작성한 후기'],
        ].map(([n, label]) => (
          <div key={label} style={styles.stat}>
            <strong style={styles.statNum}>{n}</strong>
            <span style={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ───────── 렌더: 팝업 ───────── */

  const renderModal = (): ReactNode => {
    switch (modal.kind) {
      case 'none':
        return null;

      case 'country': {
        const list = COUNTRY_LIST.filter((c) => c.includes(countryKeyword));
        return (
          <div style={{ ...styles.overlay, alignItems: 'flex-end' }} onClick={closeModal}>
            <div role="dialog" aria-modal="true" style={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.sheetTitle}>국적 선택</h3>
              <input
                type="text"
                placeholder="국가 검색"
                value={countryKeyword}
                onChange={(e) => setCountryKeyword(e.target.value)}
                style={styles.sheetSearch}
              />
              <div style={styles.sheetList}>
                {list.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={styles.sheetItem}
                    onClick={() => {
                      setDraft({ ...draft, country: c });
                      closeModal();
                    }}
                  >
                    <span style={{ fontWeight: draft.country === c ? 700 : 400 }}>{c}</span>
                    {draft.country === c && <span style={{ color: '#8A8A8A' }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'detail': {
        const m = findProgress(modal.id);
        if (!m) return null;
        return (
          <Panel tall>
            <h2 style={styles.modalTitle}>{m.title}</h2>
            <div style={styles.metaRow}>
              <Tags m={m} />
              <span style={styles.metaText}>{fmtLong(m.acceptedAt)}</span>
            </div>
            <p style={styles.desc}>{m.description}</p>
            <div style={styles.infoBlock}>
              <p>
                <b style={styles.infoKey}>인증 방식</b> {VERIFY_LABEL[m.verifyType]}
              </p>
              <p>
                <b style={styles.infoKey}>완료시 획득 경험치</b> +{m.xp}XP
              </p>
            </div>
            <div style={styles.spacer} />
            <Btn onClick={() => startVerify(m)}>{m.verifyType === 'none' ? '완료하기' : '인증하기'}</Btn>
            <div style={styles.btnRow}>
              <Btn variant="taupe" onClick={() => cancelMission(m.id)}>
                미션 취소
              </Btn>
              <Btn variant="taupe" onClick={closeModal}>
                닫기
              </Btn>
            </div>
          </Panel>
        );
      }

      case 'cancelDone':
        return <Alert title="미션이 취소되었습니다" button="확인" onClick={closeModal} />;

      case 'deleteDone':
        return <Alert title="기록이 삭제되었습니다" button="확인" onClick={closeModal} />;

      case 'list': {
        const isCompleted = modal.section === 'completed';
        return (
          <Panel tall>
            <div style={styles.listScroll} className="ps-scroll">
              {isCompleted
                ? completed.map((m) => (
                    <MissionRow key={m.id} m={m} completed onDetail={() => setModal({ kind: 'completedDetail', id: m.id })} />
                  ))
                : progress.map((m) => (
                    <MissionRow key={m.id} m={m} onDetail={() => setModal({ kind: 'detail', id: m.id })} />
                  ))}
            </div>
            <button type="button" aria-label="닫기" style={styles.closeX} onClick={closeModal}>
              ✕
            </button>
          </Panel>
        );
      }

      case 'completedDetail': {
        const m = findCompleted(modal.id);
        if (!m) return null;
        return (
          <Panel tall>
            <h2 style={styles.modalTitle}>{m.title}</h2>
            <div style={styles.resultArea}>
              {m.verifyType === 'photo' && (
                <>
                  <img src={m.photoUrl || samplePhoto} alt="인증 사진" style={styles.resultImg} />
                  <p style={styles.resultXp}>사진 인증 +{m.xp} XP</p>
                </>
              )}
              {m.verifyType === 'location' && (
                <>
                  {/* TODO(H.1): 실제 지도(카카오맵 등)로 교체 */}
                  <img src={sampleMap} alt={m.placeName ? `${m.placeName} 지도` : '인증 위치 지도'} style={styles.resultImg} />
                  <p style={styles.resultXp}>위치 인증 +{m.xp} XP</p>
                </>
              )}
              {m.verifyType === 'none' && (
                <>
                  <p style={styles.doneBig}>미션 완료!</p>
                  <p style={styles.resultXp}>+{m.xp} XP</p>
                </>
              )}
            </div>
            <Btn onClick={() => (m.review ? setModal({ kind: 'reviewView', id: m.id }) : openReviewWrite(m.id))}>
              {m.review ? '작성한 후기 열람' : '후기 작성'}
            </Btn>
            <div style={styles.btnRow}>
              <Btn variant="taupe" onClick={() => deleteRecord(m.id)}>
                기록 삭제
              </Btn>
              <Btn variant="taupe" onClick={closeModal}>
                닫기
              </Btn>
            </div>
          </Panel>
        );
      }

      case 'reviewView': {
        const m = findCompleted(modal.id);
        if (!m || !m.review) return null;
        return (
          <Panel tall>
            <h2 style={styles.modalTitle}>{m.title}</h2>
            <div style={styles.metaRow}>
              <Tags m={m} />
              <span style={{ ...styles.metaText, textAlign: 'right' }}>
                인증 날짜: {fmtLong(m.completedAt)}
                <br />
                작성 날짜: {fmtLong(m.review.writtenAt)}
              </span>
            </div>
            <p style={{ ...styles.desc, whiteSpace: 'pre-wrap' }}>{m.review.text}</p>
            <div style={styles.spacer} />
            <Btn onClick={closeModal} style={styles.centerBtn}>
              확인
            </Btn>
          </Panel>
        );
      }

      case 'reviewWrite': {
        const m = findCompleted(modal.id);
        if (!m) return null;
        const valid = reviewText.trim().length >= MIN_REVIEW_LENGTH;
        return (
          <Panel tall>
            <h2 style={styles.modalTitle}>{m.title}</h2>
            <div style={styles.metaRow}>
              <Tags m={m} />
              <span style={styles.metaText}>인증 날짜: {fmtLong(m.completedAt)}</span>
            </div>
            <textarea
              value={reviewText}
              maxLength={300}
              placeholder="후기를 작성해 주세요!"
              onChange={(e) => setReviewText(e.target.value)}
              style={styles.textarea}
            />
            <Btn onClick={() => saveReview(m.id)} disabled={!valid} style={styles.centerBtn}>
              저장
            </Btn>
          </Panel>
        );
      }
    }
  };

  /* ───────── 최종 렌더 ───────── */

  const tabs = ['랜덤미션', '숨은 뜻', '지도', '프로필'];

  return (
    <div style={styles.wrapper}>
      <style>{'.ps-scroll::-webkit-scrollbar{display:none}.ps-scroll{scrollbar-width:none}'}</style>

      <header style={styles.header}>
        <img src={logoHeader} alt="POOMASI" style={styles.logo} />
      </header>

      <main
        className="ps-scroll"
        style={{ ...styles.content, justifyContent: open === 'none' ? 'center' : 'flex-start' }}
      >
        <section style={styles.card}>
          <button
            type="button"
            style={styles.accHeader}
            aria-expanded={open === 'profile'}
            onClick={() => toggleSection('profile')}
          >
            <span className="font-anton" style={styles.accTitle}>
              My Profile
            </span>
            <Triangle dir={open === 'profile' ? 'down' : 'left'} />
          </button>
          {open === 'profile' && renderProfileBody()}
        </section>

        <section style={styles.card}>
          <button
            type="button"
            style={styles.accHeader}
            aria-expanded={open === 'mission'}
            onClick={() => toggleSection('mission')}
          >
            <span className="font-anton" style={styles.accTitle}>
              My Mission
            </span>
            <Triangle dir={open === 'mission' ? 'down' : 'left'} />
          </button>
          {open === 'mission' && renderMissionBody()}
        </section>
      </main>

      {toast && (
        <div style={styles.toast} role="status">
          <CheckCircle />
          <span>후기 작성 완료!</span>
        </div>
      )}

      <nav style={styles.tabBar}>
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            style={{ ...styles.tab, ...(t === '프로필' ? styles.tabActive : null) }}
            aria-current={t === '프로필' ? 'page' : undefined}
          >
            {t}
          </button>
        ))}
      </nav>
      <div style={styles.homeBar} />

      {renderModal()}

      {verifying && (
        <MissionVerify mission={verifying} onVerified={finishMission} onClose={() => setVerifying(null)} />
      )}
    </div>
  );
}
