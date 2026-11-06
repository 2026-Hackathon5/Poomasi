import { useLocation, useNavigate } from 'react-router-dom';

// 하단 탭 메뉴 (지도는 아직 화면이 없어서 비활성화)
export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tab = (path: string) => ({
    className: pathname.startsWith(path) ? 'active' : undefined,
    onClick: () => navigate(path),
  });

  return (
    <>
      <nav className="pm-bottom-nav">
        <button type="button" {...tab('/missions')}>
          랜덤미션
        </button>

        <button type="button" {...tab('/posts')}>
          숨은 뜻
        </button>

        <button type="button" disabled>
          지도
        </button>

        <button type="button" {...tab('/profile')}>
          프로필
        </button>
      </nav>

      <div className="pm-home-indicator" />
    </>
  );
}
