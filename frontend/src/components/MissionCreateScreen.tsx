import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { VerifyType } from '../types/mission';
import { MISSION_CATEGORIES, MISSION_COUNTRIES } from '../mocks/catalog';
import { useMissionStore } from '../mocks/missionStoreContext';
import { styles } from '../styles/poomasi';
import { rs } from '../styles/random';
import { cs } from '../styles/create';
import { LogoHeader } from './ui';
import { ChevronDown } from './icons';

/* ────────────────────────────────────────────────────────────────
 * 랜덤 미션 (E.3) — 미션 만들기 화면 (/missions/new)
 *
 *  - 제목 · 내용 · 나라 · 분야 · 인증 방식을 채우면 [미션 게시하기]가 켜진다
 *  - 인증 방식이 "위치"일 때만 장소명 · 위치 주소 칸이 생긴다 (Figma 메모)
 *  - 게시하면 내가 만든 미션 탭으로 돌아가 "미션 게시 완료!" 토스트
 *  - [<] → 내가 만든 미션
 *
 * 글자 수 제한은 백엔드 schemas/created_mission.py와 같게 (제목 100 · 내용 1000 · 장소명 100 · 주소 255)
 * TODO(API): POST /api/missions (위치 미션은 서버가 주소로 좌표를 찾고, 못 찾으면 400 → 안내)
 * ──────────────────────────────────────────────────────────────── */

const LIMIT = { title: 100, description: 1000, placeName: 100, address: 255 };

const VERIFY_OPTIONS: [VerifyType, string][] = [
  ['photo', '사진'],
  ['location', '위치'],
  ['none', '없음'],
];

const MINE_PATH = '/missions?tab=mine';

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T | '';
  onChange: (v: T) => void;
}) {
  return (
    <div style={cs.chipRow}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          style={{ ...cs.chip, ...(value === v ? cs.chipOn : null) }}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function MissionCreateScreen() {
  const navigate = useNavigate();
  const { createMission } = useMissionStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [verifyType, setVerifyType] = useState<VerifyType | ''>('');
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const isLocation = verifyType === 'location';
  const canSubmit =
    title.trim() !== '' &&
    description.trim() !== '' &&
    country !== '' &&
    category !== '' &&
    verifyType !== '' &&
    (!isLocation || (placeName.trim() !== '' && address.trim() !== ''));

  // 내용 칸은 글이 길어지면 높이가 늘어난다
  const onDescription = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const submit = () => {
    if (!canSubmit) return; // 여기서 verifyType은 '' 가 아님 (TypeScript가 알아서 좁혀 줌)
    createMission({
      title: title.trim(),
      description: description.trim(),
      country,
      category,
      verifyType,
      // 위치 미션이 아니면 장소 정보는 저장하지 않는다 (백엔드와 같음)
      placeName: isLocation ? placeName.trim() : undefined,
      address: isLocation ? address.trim() : undefined,
    });
    navigate(MINE_PATH, { state: { toast: '미션 게시 완료!' } });
  };

  return (
    <div style={{ ...styles.wrapper, ...rs.listWrapper }}>
      <style>{'.ps-scroll::-webkit-scrollbar{display:none}.ps-scroll{scrollbar-width:none}.cs-input::placeholder{color:#D9D9D9}'}</style>

      <LogoHeader style={rs.header} logoStyle={rs.logo} onBack={() => navigate(MINE_PATH)} />

      <main className="ps-scroll" style={{ ...styles.content, ...cs.content }}>
        <label style={cs.field}>
          <span style={cs.label}>미션 제목</span>
          <input
            className="cs-input"
            style={cs.input}
            value={title}
            maxLength={LIMIT.title}
            placeholder="미션명이 무엇인가요?"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label style={cs.field}>
          <span style={cs.label}>내용</span>
          <textarea
            className="cs-input"
            style={cs.textarea}
            rows={1}
            value={description}
            maxLength={LIMIT.description}
            placeholder="미션을 자세히 설명해주세요."
            onChange={onDescription}
          />
        </label>

        <div style={cs.field}>
          <span style={cs.label}>나라</span>
          <button type="button" style={{ ...cs.input, ...cs.select }} onClick={() => setSheetOpen(true)}>
            <span style={country ? undefined : cs.placeholder}>{country || '미션에 해당하는 나라를 선택해주세요.'}</span>
            <ChevronDown />
          </button>
        </div>

        <div style={cs.chipField}>
          <span style={cs.label}>분야</span>
          <Chips options={MISSION_CATEGORIES.map((c) => [c, c])} value={category} onChange={setCategory} />
        </div>

        <div style={cs.chipField}>
          <span style={cs.label}>인증 방식</span>
          <Chips options={VERIFY_OPTIONS} value={verifyType} onChange={setVerifyType} />
        </div>

        {/* 인증 방식이 "위치"일 때만 */}
        {isLocation && (
          <>
            <label style={cs.field}>
              <span style={cs.label}>장소명</span>
              <input
                className="cs-input"
                style={cs.input}
                value={placeName}
                maxLength={LIMIT.placeName}
                placeholder="장소 이름을 입력해주세요."
                onChange={(e) => setPlaceName(e.target.value)}
              />
            </label>
            <label style={cs.field}>
              <span style={cs.label}>위치 주소</span>
              <input
                className="cs-input"
                style={cs.input}
                value={address}
                maxLength={LIMIT.address}
                placeholder="도로명 주소를 입력해주세요."
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
          </>
        )}
      </main>

      <button
        type="button"
        disabled={!canSubmit}
        style={{ ...cs.submit, ...(canSubmit ? null : cs.submitOff) }}
        onClick={submit}
      >
        미션 게시하기
      </button>
      <div style={styles.homeBar} />

      {/* 나라 선택 시트 */}
      {sheetOpen && (
        <div style={{ ...styles.overlay, alignItems: 'flex-end' }} onClick={() => setSheetOpen(false)}>
          <div role="dialog" aria-modal="true" style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.sheetTitle}>나라 선택</h3>
            <div style={styles.sheetList}>
              {MISSION_COUNTRIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={styles.sheetItem}
                  onClick={() => {
                    setCountry(c);
                    setSheetOpen(false);
                  }}
                >
                  <span style={{ fontWeight: country === c ? 700 : 400 }}>{c}</span>
                  {country === c && <span style={{ color: '#8A8A8A' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
