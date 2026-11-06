//import React from 'react';
import type { ScreenType } from '../App';
import logo from '../assets/logo.png';
import langKO from '../assets/lang=KO.png';


interface Props {
  onNavigate: (screen: ScreenType) => void;
}

export default function StartScreen({ onNavigate }: Props) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.topHeader}>
        <button style={styles.langBtn}>
          <img src={langKO} alt="언어 선택" style={styles.langImg} />
        </button>
      </div>

      <div style={styles.centerContent}>
        <div style={styles.logoIcon}>
          <img src={logo}/>
        </div>
      </div>

      <div style={styles.bottomButtons}>
        <button style={styles.mainBtn} onClick={() => onNavigate('SIGNUP')}>
          회원가입하기
        </button>
        <button style={styles.subBtn} onClick={() => onNavigate('LOGIN')}>
          로그인하기
        </button>
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
  bottomButtons: { display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '24px' },
  mainBtn: {
    padding: '16px',
    backgroundColor: '#3E3832',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  subBtn: {
    padding: '16px',
    backgroundColor: '#3E3832',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};