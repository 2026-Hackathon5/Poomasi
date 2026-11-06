import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 아이폰 Safari는 상태 표시줄(시계·배터리) 뒤를 페이지 바깥 배경색(html·body)으로 칠한다.
// 화면마다 배경색이 달라서(흰색 / 초록 회색 / 민트), 화면이 바뀔 때마다
// 지금 화면의 배경색을 html·body에도 똑같이 칠해 위쪽에 다른 색 띠가 생기지 않게 한다.
// 컴퓨터(넓은 화면)에서는 폰 모양 틀 바깥 회색을 그대로 둔다.

const TRANSPARENT = /^(transparent|rgba\(0, 0, 0, 0\))$/;

// 화면 맨 위쪽 요소부터 내려가며 처음 나오는 배경색을 찾는다
function screenBackground(): string | null {
  let el = document.querySelector('.app-container')?.firstElementChild ?? null;
  for (let depth = 0; el && depth < 3; depth += 1) {
    const color = getComputedStyle(el).backgroundColor;
    if (color && !TRANSPARENT.test(color)) return color;
    el = el.firstElementChild;
  }
  const container = document.querySelector('.app-container');
  return container ? getComputedStyle(container).backgroundColor : null;
}

export function useStatusBarColor() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 화면이 다 그려진 다음 색을 읽는다
    const timer = window.setTimeout(() => {
      const isPhone = window.matchMedia('(max-width: 599px)').matches;
      const color = isPhone ? screenBackground() : null;

      document.documentElement.style.backgroundColor = color ?? '';
      document.body.style.backgroundColor = color ?? '';

      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = color ?? '#f0f0f0';
    }, 50);
    return () => window.clearTimeout(timer);
  }, [pathname]);
}
