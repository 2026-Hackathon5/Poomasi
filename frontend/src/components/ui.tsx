// 버튼·태그·팝업 같은 공용 UI 조각 (프로필 I, 미션 인증 F에서 같이 씀)
import type { CSSProperties, ReactNode } from 'react';
import type { Mission } from '../types/mission';
import { styles } from '../styles/poomasi';

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
