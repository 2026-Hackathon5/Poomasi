import { useState } from 'react';
import type { ScreenType } from '../App';
import bar from '../assets/회원가입 bar.png';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

export default function SignUpScreen({ onNavigate }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [userType, setUserType] = useState('foreign');

  const isValid = email.includes('@') && password.length >= 6 && nickname.length > 0;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => onNavigate('START')}>←</button>
        <h2><img src={bar}></img></h2>
      </div>

      <div style={styles.formGroup}>
        <label>이메일</label>
        <input
          type="email"
          placeholder="이메일 주소를 입력하세요."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label>비밀번호</label>
        <input
          type="password"
          placeholder="영문, 숫자 포함 6자리 이상 입력"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <label>닉네임</label>
        <input
          type="text"
          placeholder="사용하실 닉네임을 입력하세요."
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={styles.input}
        />

        <label>사용자 유형</label>
        <div style={styles.typeSelector}>
          <button
            style={userType === 'foreign' ? styles.typeBtnActive : styles.typeBtn}
            onClick={() => setUserType('foreign')}
          >
            한국에 거주하는 외국인
          </button>
          <button
            style={userType === 'korean' ? styles.typeBtnActive : styles.typeBtn}
            onClick={() => setUserType('korean')}
          >
            한국인
          </button>
        </div>
      </div>

      <button
        style={{
          ...styles.submitBtn,
          backgroundColor: isValid ? '#3E3832' : '#A8BBA8',
          cursor: isValid ? 'pointer' : 'not-allowed',
        }}
        disabled={!isValid}
        onClick={() => onNavigate('PROFILE')}
      >
        회원가입
      </button>
    </div>
  );
}

const styles = {
  wrapper: { padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px' },
  backBtn: { border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' },
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '12px', marginTop: '20px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' },
  typeSelector: { display: 'flex', gap: '8px' },
  typeBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' },
  typeBtnActive: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#3E3832', color: '#fff' },
  submitBtn: { padding: '16px', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold' },
};