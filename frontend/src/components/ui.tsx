// 버튼·태그·팝업·헤더·하단 탭 같은 공용 UI 조각 (프로필 I, 미션 인증 F, 메인 B.1에서 같이 씀)
import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mission } from '../types/mission';
import { styles } from '../styles/poomasi';
import logoHeader from '../assets/logo-header.png';

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
export function LogoHeader({ style, logoStyle }: { style?: CSSProperties; logoStyle?: CSSProperties }) {
  const navigate = useNavigate();
  return (
    <header style={{ ...styles.header, ...style }}>
      <button type="button" aria-label="메인 화면으로" style={styles.logoBtn} onClick={() => navigate('/home')}>
        <img src={logoHeader} alt="POOMASI" style={{ ...styles.logo, ...logoStyle }} />
      </button>
    </header>
  );
}

// 하단 탭. path가 없는 탭은 다른 팀원 화면이 붙으면 연결
const TABS: { label: string; path?: string }[] = [
  { label: '랜덤미션' },
  { label: '숨은 뜻' },
  { label: '지도' },
  { label: '프로필', path: '/profile' },
];

export function TabBar({
  active,
  style,
  tabStyle,
}: {
  active?: string;
  style?: CSSProperties;
  tabStyle?: CSSProperties;
}) {
  const navigate = useNavigate();
  return (
    <>
      <nav style={{ ...styles.tabBar, ...style }}>
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            style={{ ...styles.tab, ...tabStyle, ...(t.label === active ? styles.tabActive : null) }}
            aria-current={t.label === active ? 'page' : undefined}
            onClick={t.path ? () => navigate(t.path!) : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div style={styles.homeBar} />
    </>
  );
}
