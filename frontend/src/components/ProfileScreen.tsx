import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { UserInfo } from '../types/user';
import type { CompletedMission, Mission } from '../types/mission';
import { VERIFY_LABEL, fmtLong, fmtShort } from '../utils/mission';
import { styles } from '../styles/poomasi';
import { Alert, Btn, LogoHeader, Panel, TabBar, Tags } from './ui';
import MissionVerify from './MissionVerify';
import { cancelMyMission, deleteMyRecord, writeReview } from '../api/myMissions';
import { getLevel } from '../utils/level';
import { useMissionStore } from '../mocks/missionStoreContext';
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
const KOREA = '대한민국'; // 한국인은 국적이 대한민국으로 고정 (회원가입 · 백엔드와 같은 규칙)
const NICKNAME_RE = /^[A-Za-z0-9가-힣]{1,20}$/;
const MAX_VISIBLE = 4; // 각 목록 최대 4개 노출, 5개 이상은 더보기
const MIN_REVIEW_LENGTH = 2;

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
  // 메인(B.1)의 [전체보기]로 들어오면 My Mission을 펼친 채로 시작
  const location = useLocation();
  const [open, setOpen] = useState<Section>(
    (location.state as { open?: Section } | null)?.open ?? 'none',
  );

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
  // 목업 미션 상태는 화면끼리 같이 씀 (랜덤 미션에서 수락하면 여기에도 보임)
  const { xp, progress, completed, refresh } = useMissionStore();

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

  // MissionVerify에서 인증에 성공하면 불림 → 서버에서 진행 중 · 완료 · 경험치를 다시 불러온다
  const finishMission = () => {
    void refresh();
  };

  const startVerify = (m: Mission) => {
    closeModal();
    setVerifying(m);
  };

  // 서버에 쓰는 "내 미션 id" (화면의 id는 미션 id)
  const userMissionIdOf = (m: Mission | undefined) => m?.userMissionId ?? m?.id ?? 0;

  // 실패하면 서버가 보낸 한국어 안내를 그대로 보여준다
  const showFail = (err: unknown, fallback: string) => {
    window.alert(err instanceof Error ? err.message : fallback);
  };

  const cancelMission = async (id: number) => {
    try {
      await cancelMyMission(userMissionIdOf(findProgress(id)));
      await refresh(); // 진행 중 목록 · 전체 미션 목록을 서버에서 다시 불러온다
      setModal({ kind: 'cancelDone' });
    } catch (err) {
      showFail(err, '미션을 취소하지 못했어요.');
    }
  };

  /* ── 완료 기록 / 후기 ── */

  const deleteRecord = async (id: number) => {
    try {
      await deleteMyRecord(userMissionIdOf(findCompleted(id)));
      await refresh();
      setModal({ kind: 'deleteDone' });
    } catch (err) {
      showFail(err, '기록을 삭제하지 못했어요.');
    }
  };

  const openReviewWrite = (id: number) => {
    setReviewText('');
    setModal({ kind: 'reviewWrite', id });
  };

  const [savingReview, setSavingReview] = useState(false);

  const saveReview = async (id: number) => {
    const text = reviewText.trim();
    if (text.length < MIN_REVIEW_LENGTH || savingReview) return;
    setSavingReview(true);
    try {
      await writeReview(userMissionIdOf(findCompleted(id)), text);
      await refresh(); // 후기 · 작성 날짜를 서버 값으로 다시 불러온다
      closeModal();
      setToast(true);
    } catch (err) {
      showFail(err, '후기를 저장하지 못했어요.');
    } finally {
      setSavingReview(false);
    }
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
              onClick={() =>
                // 한국인이면 국적을 대한민국으로 고정, 외국인으로 바꾸면 다시 직접 고르게 비움
                setDraft({
                  ...draft,
                  userType: value,
                  country: value === 'korean' ? KOREA : draft.userType === 'korean' ? '' : draft.country,
                })
              }
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
      {editing && draft.userType === 'korean' ? (
        // 한국인은 국적을 바꿀 수 없음
        <input type="text" value={KOREA} readOnly style={{ ...styles.input, ...styles.inputLocked }} />
      ) : editing ? (
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
              <Btn variant="taupe" onClick={() => void cancelMission(m.id)}>
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
              <Btn variant="taupe" onClick={() => void deleteRecord(m.id)}>
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
            <Btn onClick={() => void saveReview(m.id)} disabled={!valid || savingReview} style={styles.centerBtn}>
              {savingReview ? '저장 중...' : '저장'}
            </Btn>
          </Panel>
        );
      }
    }
  };

  /* ───────── 최종 렌더 ───────── */

  return (
    <div style={styles.wrapper}>
      <style>{'.ps-scroll::-webkit-scrollbar{display:none}.ps-scroll{scrollbar-width:none}'}</style>

      <LogoHeader />

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

      <TabBar active="프로필" />

      {renderModal()}

      {verifying && (
        <MissionVerify mission={verifying} onVerified={finishMission} onClose={() => setVerifying(null)} />
      )}
    </div>
  );
}
