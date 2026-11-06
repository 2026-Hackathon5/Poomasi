import { useState } from 'react';
import type { ScreenType } from '../App';
import icon from '../assets/icon.png';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

export default function LoginScreen({ onNavigate }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (email === 'poomasi@gmail.com' && password === '123456') {
      onNavigate('PROFILE');
    } else {
      setError(true);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => onNavigate('START')}>←</button>
          <h2><img src={icon}></img>로그인</h2>
        </div>

        <div style={styles.formGroup}>
          <label>이메일</label>
          <input
            type="email"
            placeholder="이메일 주소를 입력하세요."
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(false); }}
            style={{ ...styles.input, borderColor: error ? 'red' : '#ccc' }}
          />

          <label>비밀번호</label>
          <input
            type="password"
            placeholder="비밀번호를 입력하세요."
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            style={{ ...styles.input, borderColor: error ? 'red' : '#ccc' }}
          />
          {error && <p style={styles.errorText}>이메일 또는 비밀번호가 일치하지 않습니다.</p>}
        </div>
      </div>

      <button style={styles.submitBtn} onClick={handleLogin}>
        로그인
      </button>
    </div>
  );
}

const styles = {
  wrapper: { padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px' },
  backBtn: { border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' },
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '12px', marginTop: '30px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' },
  errorText: { color: 'red', fontSize: '12px' },
  submitBtn: { padding: '16px', backgroundColor: '#3E3832', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
};