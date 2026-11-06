import { useNavigate } from 'react-router-dom';
//import React from 'react';
import { useState } from 'react';
import ImageButton from './ImageButton';
import logo from '../assets/logo.png';
import langKO from '../assets/Lang=KO.png';
import langEN from '../assets/Lang=EN.png';



export default function StartScreen() {
  const navigate = useNavigate();

  //true면 KO, false면 EN
  const [isKo, setIsKo] = useState(true);

  //버튼 클릭 시 언어를 토글
  const toggleLanguage = () => {
    setIsKo(!isKo);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.topHeader}>
        <button style={styles.langBtn} onClick={toggleLanguage}>
          <img 
            src={isKo ? langKO : langEN} 
            alt="언어 선택" 
            style={styles.langImg} 
          />
        </button>
      </div>

      <div style={styles.centerContent}>
        <div style={styles.logoIcon}>
          <img src={logo}/>
        </div>
      </div>

      <div style={styles.bottomButtons}>
        <ImageButton text="회원가입하기" onClick={() => navigate('/signup')}/>
        <ImageButton text="로그인하기" onClick={() => navigate('/login')}/>
      </div>
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
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  },
  topHeader: { display: 'flex', justifyContent: 'flex-end' },
  langBtn: {
    background: 'transparent', 
    border: 'none',          
    outline: 'none',           
    padding: 0,             
    cursor: 'pointer',
  },
  langImg: {
    display: 'block',
    height: '28px',            
    width: 'auto',
  },
  centerContent: { textAlign: 'center' as const, marginTop: '120px' },
  logoIcon: { marginBottom: '16px' },
  logoImg: {
    width: '80px',           
    height: 'auto',
  },
  title: { fontSize: '32px', fontWeight: 'bold', color: '#3E3832' },
  subtitle: { fontSize: '14px', color: '#666', marginTop: '8px' },
  bottomButtons: { display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '24px' }
};