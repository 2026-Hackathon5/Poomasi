
import type { ScreenType } from '../App';

interface Props {
  onNavigate: (screen: ScreenType) => void;
}

export default function ProfileScreen({ onNavigate }: Props) {
  return (
    <div style={{ padding: 30 }}>
      <h2>프로필</h2>
      <p>프로필 화면은 준비 중입니다.</p>

      <button onClick={() => onNavigate('START')}>
        돌아가기
      </button>
    </div>
  );
}
