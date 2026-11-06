import React from 'react';
import btnDefault from '../assets/Size=Large, Type=Primary, State=Default.png';
import btnDisabled from '../assets/Size=Large, Type=Primary, State=Disabled.png';

interface ImageButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function ImageButton({
  text,
  onClick,
  disabled = false,
  style,
}: ImageButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...styles.container,
        backgroundImage: `url(${disabled ? btnDisabled : btnDefault})`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      <span style={styles.text}>{text}</span>
    </button>
  );
}

const styles = {
  container: {
    position: 'relative' as const,
    width: '100%',
    height: '56px',
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  text: {
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 'bold',
    pointerEvents: 'none' as const, // 텍스트 클릭 시 이벤트 방해 금지
  },
};