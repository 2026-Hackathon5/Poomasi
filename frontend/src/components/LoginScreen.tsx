import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ImageButton from './ImageButton';
import type { UserInfo } from '../types/user';
import icon from '../assets/icon.png';

interface Props {
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>;
}

export default function LoginScreen({ setUserInfo }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const isValid = email.trim() !== '' && password.trim() !== '';

  const handleLogin = () => {
    if (email === 'poomasi@gmail.com' && password === '123456') {
      setUserInfo({ email, nickname: '', userType: 'foreign', country: '' });
      navigate('/complete');
    } else {
      setError(true);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate('/')}>
            &lt;
          </button>
          <h2 style={styles.headerTitle}>
            <img src={icon} alt="icon" style={styles.headerIcon} />
            <span>로그인</span>
          </h2>
        </div>

        {/* 폼 그룹 */}
        <div style={styles.formGroup}>
          {/* 이메일 입력 그룹 */}
          <div style={styles.inputItem}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              placeholder="이메일 주소를 입력하세요."
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(false); }}
              style={styles.input} // 이메일은 정상 테두리 유지
            />
          </div>

          {/* 비밀번호 입력 그룹 (에러 시 비밀번호 칸만 빨간 테두리) */}
          <div style={styles.inputItem}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요."
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              style={{
                ...styles.input,
                borderColor: error ? '#FF4D4F' : '#E0E0E0', 
              }}
            />
            {error && <p style={styles.errorText}>이메일 또는 비밀번호가 맞지 않습니다.</p>}
          </div>
        </div>
      </div>

      <div style={styles.bottomContainer}>
        <p style={styles.signupText}>
          계정이 없으신가요?{' '}
          <span 
            style={styles.signupLink} 
            onClick={() => navigate('/signup')}
          >
            회원가입
          </span>
        </p>

        <ImageButton 
          text="로그인" 
          onClick={handleLogin} 
          disabled={!isValid} 
        />
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  },
  header: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '40px',
  },
  bottomContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  signupText: {
    textAlign: 'center' as const,
    fontSize: '13px',
    color: '#666',
  },
  signupLink: {      
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'underline',
    color: '#14552A',
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
    fontWeight: 'bold',
  },
  headerIcon: {
    width: '24px',
    height: '24px',
    objectFit: 'contain' as const,
  },
  formGroup: { 
    display: 'flex', 
    flexDirection: 'column' as const, 
    gap: '24px', 
    marginTop: '20px' 
  },
  inputItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px', // 라벨과 인풋 사이 간격
  },
  label: { 
    fontSize: '13px', 
    fontWeight: 'bold' as const, 
    color: '#3E3832' 
  },
  input: { 
    padding: '12px 16px', 
    borderRadius: '16px', 
    border: '1px solid #E0E0E0', 
    backgroundColor: '#FFFFFF',
    outline: 'none',
    fontSize: '14px',
  },
  errorText: { 
    color: '#FF4D4F', 
    fontSize: '11px', 
    marginLeft: '4px',
    fontWeight: 'bold' as const,
  },
  typeSelector: { display: 'flex', gap: '8px' },
  typeBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' },
  typeBtnActive: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#3E3832', color: '#fff' },
  submitBtn: { padding: '16px', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold' },
};