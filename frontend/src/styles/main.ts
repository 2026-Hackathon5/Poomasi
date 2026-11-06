// 메인 화면(B.1) 전용 스타일 — Figma B.1 메인 화면(144:2391) 수치 그대로 (390×844)
// 공용 헤더·탭·나의 활동 기본값은 poomasi.ts, 여기서는 메인에서 다른 값만 덮어쓴다
// 줄 높이는 Figma 글자 상자 높이 그대로 (px)
import type { CSSProperties } from 'react';

const BROWN = '#4C3D34';
const GREEN = '#14552A';
const MINT = '#DFF4DF';
const GRAY = '#6C6C6C';

export const ms: Record<string, CSSProperties> = {
  wrapper: { background: '#fff' },

  // 앱 바: 위 47px, 높이 44px
  header: { padding: '47px 0 0', height: '91px', alignItems: 'center' },
  logo: { height: '44px' },

  // 본문: x 20px, y 104px부터, 덩어리 사이 25px
  content: { padding: '13px 20px 118px', gap: '25px' },

  // 인사말: 28px Regular, 닉네임 Bold 초록, 안쪽 여백 10px
  greeting: { fontSize: '28px', fontWeight: 400, lineHeight: '34px', color: '#000', padding: '10px' },
  nickname: { color: GREEN, fontWeight: 700 },

  // B.1.1 레벨 카드: 패딩 16, 간격 15, 모서리 16
  levelCard: {
    border: `1.5px solid ${GREEN}`,
    borderRadius: '16px',
    padding: '16px',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    flexShrink: 0,
  },
  levelTop: { display: 'flex', alignItems: 'center', gap: '12px' },
  seedBox: { width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  levelText: { display: 'flex', flexDirection: 'column', gap: '2px' },
  levelLv: { fontSize: '13px', fontWeight: 400, lineHeight: '16px', color: '#000' },
  levelTitle: { fontSize: '18px', fontWeight: 500, lineHeight: '22px', color: '#000' },
  barTrack: { height: '10px', background: MINT, display: 'flex' },
  barFill: { height: '100%', borderRadius: '5px', background: GREEN, transition: 'width .5s ease' },
  levelFoot: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 400, lineHeight: '14px', color: '#000' },

  // B.1.2 진행 중인 미션 카드: 패딩 16, 간격 16, 모서리 16
  missionCard: {
    background: MINT,
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flexShrink: 0,
    cursor: 'pointer',
  },
  missionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  missionCount: { fontSize: '13px', fontWeight: 500, lineHeight: '16px', color: GRAY },
  allBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    border: 'none',
    background: 'transparent',
    color: GRAY,
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: '16px',
    cursor: 'pointer',
    padding: 0,
  },
  tagRow: { display: 'flex', gap: '6px' },
  // 태그(Category): 12px Medium, 위아래 4 · 좌우 10, 높이 24
  tag: {
    border: `1px solid ${GREEN}`,
    borderRadius: '100px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '14px',
    color: '#000',
    background: '#fff',
    whiteSpace: 'nowrap',
  },
  missionTitle: {
    fontSize: '24px',
    fontWeight: 500,
    lineHeight: '35px', // 글자 아래가 잘리지 않게 줄 높이는 넉넉히
    margin: '-3px 0', // 대신 위아래를 줄여 차지하는 높이는 Figma와 같은 29px
    color: '#000',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 0,
  },
  missionFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  accepted: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 400, lineHeight: '16px', color: '#000' },
  // 버튼: 높이 44, 좌우 20, 모서리 30, 15px Bold
  btn: { width: 'auto', height: '44px', padding: '0 20px', borderRadius: '30px', fontSize: '15px', fontWeight: 700, background: BROWN },
  emptyText: { fontSize: '15px', color: '#000', lineHeight: 1.5 },

  // B.1.3 나의 활동: 제목 16px Bold, 간격 8 / 카드 높이 98, 모서리 16
  stats: { display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 },
  statsTitle: { fontSize: '16px', fontWeight: 700, lineHeight: '19px', color: '#000' },
  stat: { height: '98px', borderRadius: '16px', gap: '2px', padding: '0 8px' },
  statNum: { fontSize: '24px', fontWeight: 700, lineHeight: '29px' },
  statLabel: { fontSize: '12px', fontWeight: 500, lineHeight: '14px' },

  // 하단 탭: x 20, 아래 34, 350×64, 모서리 30, 버튼 높이 44 · 14px Bold
  tabBar: {
    left: '20px',
    right: '20px',
    bottom: '34px',
    height: '64px',
    borderRadius: '30px',
    padding: '0 8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  tab: { height: '44px', borderRadius: '30px', fontSize: '14px' },

  // 미션 상세 팝업: 배경 50% 검정, 카드 x 20 · y 272, 350폭, 위아래 20 · 좌우 16, 간격 25
  overlay: { background: 'rgba(0,0,0,0.5)', alignItems: 'flex-start', paddingTop: '272px' },
  detail: {
    width: '350px',
    maxWidth: 'calc(100% - 40px)',
    background: '#fff',
    borderRadius: '16px',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
  },
  detailTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailDate: { fontSize: '13px', fontWeight: 400, lineHeight: '16px', color: '#000' },
  detailTitle: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '35px', // 글자 아래가 잘리지 않게 줄 높이는 넉넉히
    margin: '-3px 0', // 대신 위아래를 줄여 차지하는 높이는 Figma와 같은 29px
    color: GREEN,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 0,
  },
  detailDesc: { fontSize: '15px', fontWeight: 350, lineHeight: '18px', color: '#000' },
  detailInfo: { display: 'flex', alignItems: 'center', gap: '10px', color: BROWN, lineHeight: '19px' },
  detailKey: { fontSize: '16px', fontWeight: 700 },
  detailValue: { fontSize: '15px', fontWeight: 400 },
};
