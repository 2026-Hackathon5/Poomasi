import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ImageButton from './ImageButton';
import type { UserInfo } from '../types/user';
import icon from '../assets/icon.png';

interface Props {
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>;
}

const COUNTRY_LIST = ['대한민국', '일본', '중국', '미국', '기타'];
const KOREA = '대한민국'; // 한국인은 국적이 대한민국으로 고정 (백엔드도 korean이면 KR로 저장)

export default function SignUpScreen({ setUserInfo }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [userType, setUserType] = useState<'foreign' | 'korean'>('foreign');

  // 국적 선택 상태 및 바텀시트 열림 상태
  const [country, setCountry] = useState('');
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [passwordError, setPasswordError] = useState(false);
  const [nicknameError, setNicknameError] = useState(false);
  const [nicknameErrorMsg, setNicknameErrorMsg] = useState('');

  // 모든 필드가 올바르게 입력되었을 때만 버튼 활성화
  const isValid =
    email.includes('@') &&
    password.length >= 6 &&
    nickname.trim().length > 0 &&
    country !== '' &&
    !passwordError &&
    !nicknameError; 

  // 필터링된 국적 목록
  const filteredCountries = COUNTRY_LIST.filter((c) =>
    c.includes(searchKeyword)
  );

  // 사용자 유형 선택: 한국인이면 국적을 대한민국으로 고정, 외국인으로 바꾸면 다시 직접 고르게 비움
  const selectUserType = (type: 'foreign' | 'korean') => {
    if (type === 'korean') setCountry(KOREA);
    else if (userType === 'korean') setCountry('');
    setUserType(type);
  };
  const countryLocked = userType === 'korean';

  const handleSignUp = () => {
    // 1. App.tsx의 상태에 사용자 정보 저장
    setUserInfo({
      email,
      nickname,
      userType,
      country,
    });

    // 2. 메인 화면(B.1)으로 이동
    navigate('/home');
  };

  return (
    <div style={styles.wrapper}>
      <div>
        {/* 헤더 */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate('/')}>
            &lt;
          </button>
          <h2 style={styles.headerTitle}>
            <img src={icon} alt="icon" style={styles.headerIcon} />
            <span>회원가입</span>
          </h2>
        </div>

        {/* 폼 입력 영역 */}
        <div style={styles.formGroup}>
          {/* 이메일 */}
          <div style={styles.inputItem}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              placeholder="이메일 주소를 입력하세요."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* 비밀번호 */}
          <div style={styles.inputItem}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.length > 0 && e.target.value.length < 6) {
                  setPasswordError(true);
                } else {
                  setPasswordError(false);
                }
              }}
              style={{
                ...styles.input,
                borderColor: passwordError ? '#FF4D4F' : '#E0E0E0', 
              }}
            />
            {passwordError ? (
              <span style={styles.errorText}>영문, 숫자를 포함하여 6자리 이상 입력해주세요.</span>
            ) : (
              <span style={styles.helperText}>영문, 숫자를 포함하여 6자리 이상 입력</span>
            )}
          </div>

          {/* 닉네임 */}
          <div style={styles.inputItem}>
            <label style={styles.label}>닉네임</label>
            <input
              type="text"
              placeholder="사용하실 닉네임을 입력하세요."
              value={nickname}
              onChange={(e) => {
                const val = e.target.value;
                setNickname(val);
                if (e.target.value === '중복닉네임') {
                  setNicknameError(true);
                  setNicknameErrorMsg('중복되는 닉네임입니다.');
                } else {
                  setNicknameError(false);
                }

                const invalidRegex = /[^A-Za-z0-9가-힣]/;
                if (val.length > 0 && invalidRegex.test(val)) {
                  setNicknameError(true);
                  setNicknameErrorMsg('한글, 영문, 숫자만 입력 가능합니다.');
                } else {
                  setNicknameError(false);
                  setNicknameErrorMsg('');
                }
              }}
              style={{
                ...styles.input,
                borderColor: nicknameError ? '#FF4D4F' : '#E0E0E0', 
              }}
            />
            {nicknameError && <span style={styles.errorText}>{nicknameErrorMsg}</span>}
          </div>

          {/* 사용자 유형 */}
          <div style={styles.inputItem}>
            <label style={styles.label}>사용자 유형</label>
            <div style={styles.typeSelector}>
              <button
                style={userType === 'foreign' ? styles.typeBtnActive : styles.typeBtn}
                onClick={() => selectUserType('foreign')}
              >
                한국에 거주하는 외국인
              </button>
              <button
                style={userType === 'korean' ? styles.typeBtnActive : styles.typeBtn}
                onClick={() => selectUserType('korean')}
              >
                한국인
              </button>
            </div>
          </div>

          {/* 국적 */}
          <div style={styles.inputItem}>
            <label style={styles.label}>국적</label>
            <div
              style={{ ...styles.selectInput, ...(countryLocked ? styles.selectLocked : null) }}
              onClick={() => !countryLocked && setIsCountryModalOpen(true)}
              aria-disabled={countryLocked}
            >
              <span style={{ color: country ? '#3E3832' : '#A8A8A8' }}>
                {country || '국적을 선택해주세요.'}
              </span>
              {!countryLocked && <span style={styles.arrowIcon}>∨</span>}
            </div>
            {countryLocked && <span style={styles.lockedHint}>한국인은 국적이 대한민국으로 정해져요</span>}
          </div>
        </div>
      </div>

      {/* 회원가입 제출 버튼 */}
      <ImageButton
        text="회원가입"
        disabled={!isValid}
        onClick={handleSignUp}
      />

      {/* 국적 선택 바텀시트 모달 */}
      {isCountryModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsCountryModalOpen(false)}>
          <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>국적 선택</h3>
            <input
              type="text"
              placeholder="국가 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={styles.searchInput}
            />

            <div style={styles.countryList}>
              {filteredCountries.map((item) => (
                <div
                  key={item}
                  style={styles.countryItem}
                  onClick={() => {
                    setCountry(item);
                    setIsCountryModalOpen(false);
                  }}
                >
                  <span style={{ fontWeight: country === item ? 'bold' : 'normal' }}>
                    {item}
                  </span>
                  {country === item && <span style={styles.checkIcon}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    padding: '24px',
    // 홈 화면 앱으로 열면 상태 표시줄 뒤까지 화면이 올라가서, 노치 높이만큼 위를 띄운다
    paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
    paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
    height: '100%',
    overflowY: 'auto' as const, // 짧은 화면에서 버튼이 잘리지 않게
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    position: 'relative' as const,
  },
  header: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '40px',
  },
  backBtn: {
    position: 'absolute' as const,
    left: 0,
    border: 'none',
    background: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    padding: 0,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  headerIcon: {
    width: '24px',
    height: '24px',
    objectFit: 'contain' as const,
  },
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '24px', marginTop: '12px' },
  label: { fontSize: '13px', fontWeight: 'bold' as const, color: '#3E3832', marginTop: '6px' },
  input: {
    padding: '12px 16px',
    borderRadius: '16px',
    border: '1px solid #E0E0E0',
    backgroundColor: '#FFFFFF',
    outline: 'none',
    fontSize: '14px',
  },
  inputItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px', // 라벨과 인풋 사이 간격
  },
  errorText: { fontSize: '11px', color: '#FF4D4F', marginLeft: '4px', fontWeight: 'bold' }, 
  helperText: { fontSize: '11px', color: '#888', marginTop: '-4px', marginLeft: '4px' },
  typeSelector: { display: 'flex', gap: '8px' },
  typeBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '16px',
    border: '1px solid #E0E0E0',
    background: '#FFFFFF',
    color: '#3E3832',
    fontSize: '13px',
    cursor: 'pointer',
  },
  typeBtnActive: {
    flex: 1,
    padding: '12px',
    borderRadius: '16px',
    border: 'none',
    background: '#3E3832',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
  },
  selectInput: {
    padding: '12px 16px',
    borderRadius: '16px',
    border: '1px solid #E0E0E0',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px',
  },
  // 한국인을 고르면 국적 칸은 바꿀 수 없음
  selectLocked: {
    backgroundColor: '#F2F2F2',
    cursor: 'default',
  },
  lockedHint: {
    fontSize: '11px',
    color: '#8A8A8A',
    marginTop: '4px',
    marginLeft: '8px',
  },
  arrowIcon: { fontSize: '12px', color: '#888' },
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  modalSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    maxHeight: '60%',
  },
  modalTitle: { fontSize: '16px', fontWeight: 'bold', color: '#2C2C2C' },
  searchInput: {
    padding: '12px 16px',
    borderRadius: '16px',
    border: '1px solid #E0E0E0',
    outline: 'none',
    fontSize: '14px',
  },
  countryList: {
    display: 'flex',
    flexDirection: 'column' as const,
    overflowY: 'auto' as const,
    maxHeight: '200px',
  },
  countryItem: {
    padding: '14px 4px',
    borderBottom: '1px solid #F0F0F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    cursor: 'pointer',
  },
  checkIcon: { color: '#14552A', fontWeight: 'bold' },
};
