// 버튼·태그·팝업·헤더·하단 탭 같은 공용 UI 조각 (프로필 I, 미션 인증 F, 메인 B.1에서 같이 씀)
import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mission } from '../types/mission';
import { styles } from '../styles/poomasi';
import logoHeader from '../assets/logo-header.png';
import { BackIcon } from './icons';
import BottomNav from './BottomNav';

export function Btn({
  variant = 'brown',
  disabled,
  onClick,
  children,
  style,
}: {
  variant?: 'brown' | 'taupe';
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const base = variant === 'brown' ? styles.btnBrown : styles.btnTaupe;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...(disabled ? styles.btnDisabled : null), ...style }}
    >
      {children}
    </button>
  );
}

export function Tags({ m }: { m: Mission }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <span style={styles.tag}>{m.country}</span>
      <span style={styles.tag}>{m.category}</span>
    </div>
  );
}

export function Panel({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return (
    <div style={styles.overlay}>
      <div role="dialog" aria-modal="true" style={{ ...styles.panel, ...(tall ? styles.panelTall : null) }}>
        {children}
      </div>
    </div>
  );
}

// 제목 + 부제 + 확인/다시 시도 버튼으로 이루어진 작은 알림 팝업
export function Alert({
  title,
  sub,
  button,
  onClick,
}: {
  title: string;
  sub?: string;
  button?: string;
  onClick?: () => void;
}) {
  return (
    <Panel>
      <div style={styles.alertBody}>
        <p style={styles.alertTitle}>{title}</p>
        {sub && <p style={styles.alertSub}>{sub}</p>}
        {button && (
          <Btn onClick={onClick} style={styles.alertBtn}>
            {button}
          </Btn>
        )}
      </div>
    </Panel>
  );
}

// 상단 로고. 누르면 메인 화면(B.1)으로
export function LogoHeader({
  style,
  logoStyle,
  onBack,
}: {
  style?: CSSProperties;
  logoStyle?: CSSProperties;
  onBack?: () => void; // 있으면 왼쪽에 뒤로가기(<) 버튼
}) {
  const navigate = useNavigate();
  return (
    <header style={{ ...styles.header, ...style, position: 'relative' }}>
      {onBack && (
        <button type="button" aria-label="뒤로가기" style={styles.backBtn} onClick={onBack}>
          <BackIcon />
        </button>
      )}
      <button type="button" aria-label="메인 화면으로" style={styles.logoBtn} onClick={() => navigate('/home')}>
        <img src={logoHeader} alt="POOMASI" style={{ ...styles.logo, ...logoStyle }} />
      </button>
    </header>
  );
}

// 하단 탭: 지도 · 숨은 뜻 화면과 똑같은 BottomNav를 그린다 (모든 화면 탭 통일)
// 예전 화면 코드에서 넘기던 active · style · tabStyle은 이제 쓰지 않는다
// (지금 주소를 보고 BottomNav가 선택된 탭을 알아서 표시)
export function TabBar(props: {
  active?: string;
  style?: CSSProperties;
  tabStyle?: CSSProperties;
}) {
  void props;
  return <BottomNav />;
}
