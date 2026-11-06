// 아이콘 — Figma에서 내보낸 SVG 원본 그대로 (메인 B.1 · 랜덤 미션 E · 상단 바)
// 경로(path) 값은 Figma 노드에서 Export → SVG 한 값과 같다. 크기도 Figma와 같게 고정

// 메인 레벨 카드 볍씨 (energy-icons:seed-20, Figma 144:2399)
export function SeedIcon() {
  return (
    <svg width="41" height="41" viewBox="0 0 41 41" fill="none" aria-hidden="true">
      <rect x="0.0459825" width="40" height="40" rx="20" transform="rotate(0.0658652 0.0459825 0)" fill="#DFF4DF" />
      <path
        d="M19.5793 5.80035C19.7463 5.71372 19.9343 5.67595 20.1218 5.69138C20.3093 5.70681 20.4886 5.77481 20.6392 5.88757C27.4673 11.0194 29.3516 19.4976 26.2276 26.472L25.9088 27.1416C24.5417 29.8661 22.3739 31.4396 20.0099 31.4369C17.7939 31.4343 15.7514 30.048 14.3842 27.6264L14.1208 27.1261C10.579 20.028 12.3791 11.1701 19.4392 5.88819L19.5793 5.80035ZM20.0368 7.95888C14.2574 12.6982 12.9028 20.2007 15.9098 26.2341L16.1294 26.6444C17.2411 28.6217 18.7122 29.4354 20.0122 29.4369C21.3982 29.4385 22.9812 28.5163 24.1218 26.2436L24.4025 25.6539C27.0533 19.735 25.6176 12.5573 20.0368 7.95888Z"
        fill="black"
      />
      <path
        d="M19.14 10.408C19.1988 10.2905 19.2802 10.1858 19.3795 10.0998C19.4789 10.0138 19.5941 9.94817 19.7188 9.90672C19.8435 9.86526 19.9751 9.84876 20.1061 9.85817C20.2371 9.86757 20.365 9.9027 20.4825 9.96153C20.6 10.0204 20.7047 10.1018 20.7907 10.2011C20.8767 10.3004 20.9423 10.4157 20.9838 10.5403C21.0252 10.665 21.0417 10.7966 21.0323 10.9276C21.0229 11.0587 20.9878 11.1866 20.929 11.304C19.7621 13.6204 19.1529 16.1774 19.1499 18.771C19.147 21.3646 19.7503 23.923 20.9118 26.242C21.0301 26.4795 21.0492 26.7543 20.9649 27.0059C20.8806 27.2575 20.6998 27.4652 20.4623 27.5835C20.2248 27.7018 19.95 27.7209 19.6984 27.6366C19.4468 27.5523 19.2391 27.3715 19.1208 27.134C17.8209 24.5372 17.1457 21.6727 17.149 18.7687C17.1524 15.8648 17.8341 13.0018 19.14 10.408Z"
        fill="black"
      />
    </svg>
  );
}

// 메인 "2일전 수락" 시계 (akar-icons:clock, Figma 144:2424)
export function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7.00008 12.8334C10.2217 12.8334 12.8334 10.2217 12.8334 7.00008C12.8334 3.77842 10.2217 1.16675 7.00008 1.16675C3.77842 1.16675 1.16675 3.77842 1.16675 7.00008C1.16675 10.2217 3.77842 12.8334 7.00008 12.8334Z"
        stroke="black"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.75 9.33333L7.34183 7.92517C7.12303 7.70643 7.00007 7.40973 7 7.10033V3.5"
        stroke="black"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 오른쪽 화살표: 14px = 메인 "전체보기 >" (Figma 144:2415) / 24px = 랜덤 미션 "자세히 >" (Figma 84:2925)
export function ChevronRight({ size = 24 }: { size?: 14 | 24 }) {
  return size === 14 ? (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="#6C6C6C" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6L15 12L9 18" stroke="#6C6C6C" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 아래 화살표: 국가 선택 · 미션 만들기 나라 칸 (akar-icons:chevron-down-small, Figma 84:2905)
export function ChevronDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 8.3335L10 13.3335L15 8.3335" stroke="black" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 토스트 체크 (akar-icons:circle-check, Figma 162:3112)
export function CircleCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6 9.375L8.25 11.625L12 7.125" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z"
        stroke="black"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// 상단 바 뒤로가기 < (Figma App bar 뒤로가기)
export function BackIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M31 13L13 22L31 31" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
