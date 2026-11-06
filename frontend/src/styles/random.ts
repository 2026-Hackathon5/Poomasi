// 랜덤 미션(E) 화면 스타일 — Figma E. 전체미션(84:2897) · 미션 자세히(115:1400) · 미션 뽑기(84:2547) 수치 그대로 (390×844)
// 줄 높이는 Figma 글자 상자 높이 그대로 (px)
import type { CSSProperties } from 'react';

const BROWN = '#4C3D34';
const GREEN = '#14552A';
const SAGE = '#87A987';
const MINT = '#DFF4DF';
const GRAY_BG = '#D9D9D9';
const GRAY_TEXT = '#6C6C6C';

export const rs: Record<string, CSSProperties> = {
  // 공통: 앱 바 위 47px, 높이 44px, 로고 44px
  header: { padding: '47px 0 0', height: '91px', alignItems: 'center' },
  logo: { height: '44px' },
  // 하단 탭 (Figma Tab bar): x 20, 아래 34, 350×64, 모서리 30, 버튼 높이 44 · 14px Bold
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

  // ── E. 전체미션 ──
  listWrapper: { background: SAGE },
  // 본문 y 116부터, 덩어리 사이 12
  listContent: { padding: '25px 20px 144px', gap: '12px' },

  // E.2.1 미션 뽑기 상자
  drawBox: {
    background: GRAY_BG,
    borderRadius: '16px',
    padding: '15px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    flexShrink: 0,
  },
  countrySelect: {
    height: '40px',
    borderRadius: '16px',
    background: '#fff',
    border: 'none',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '23px',
    color: '#5E5E5E',
    cursor: 'pointer',
    width: '100%',
  },
  countrySelected: { color: '#000' },
  drawBtn: { height: '52px', borderRadius: '30px', fontSize: '20px', fontWeight: 700 },

  // 미션 범위 탭 (전체 미션 / 내가 만든 미션)
  scopeTabs: { display: 'flex', height: '40px', flexShrink: 0 },
  scopeTab: {
    flex: 1,
    border: 'none',
    // 밑줄 (활성 탭에서 색만 바꾸려고 한 줄 표기 대신 나눠 씀)
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#fff',
    background: 'transparent',
    padding: '10px 0',
    fontSize: '18px',
    fontWeight: 500,
    lineHeight: '20px',
    color: '#fff',
    cursor: 'pointer',
  },
  scopeTabActive: { color: BROWN, borderBottomColor: BROWN, cursor: 'default' },

  // E.5 [미션 만들기]: 민트 + 갈색 테두리 1.5, 높이 52, 20px Bold 초록
  createBtn: {
    height: '52px',
    borderRadius: '30px',
    border: `1.5px solid ${BROWN}`,
    background: MINT,
    color: GREEN,
    fontSize: '20px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },

  // E.4 미션 목록: 카드 사이 5
  list: { display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 },
  card: {
    height: '157px',
    background: MINT,
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flexShrink: 0,
  },
  // 카드 높이(157)가 내용 합(161)보다 작아서 눌리지 않게 flexShrink 0 (Figma도 아래 여백으로 4px 넘침)
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  tagRow: { display: 'flex', gap: '6px' },
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
  moreBtn: {
    display: 'flex',
    alignItems: 'center',
    border: 'none',
    background: 'transparent',
    padding: 0,
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
    color: GRAY_TEXT,
    cursor: 'pointer',
  },
  cardTitle: {
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
  cardFoot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  date: { fontSize: '13px', fontWeight: 400, lineHeight: '16px', color: '#000' },
  footRight: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '153px' },
  xp: { fontSize: '15px', fontWeight: 700, lineHeight: '18px', color: '#000' },
  // 버튼: 높이 44, 좌우 20, 모서리 30, 15px Bold
  btn: { width: 'auto', height: '44px', padding: '0 20px', borderRadius: '30px', fontSize: '15px', fontWeight: 700 },
  btnGray: { background: GRAY_BG, color: '#000' },
  empty: { fontSize: '15px', lineHeight: 1.5, color: '#fff', textAlign: 'center', padding: '30px 0' },

  // 미션 자세히 팝업: 배경 50% 검정, 카드 y 268, 위아래 20 · 좌우 16, 간격 25
  overlay: { background: 'rgba(0,0,0,0.5)', alignItems: 'flex-start', paddingTop: '268px' },
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
  desc: { fontSize: '15px', fontWeight: 350, lineHeight: '18px', color: '#000', whiteSpace: 'pre-line' },
  btnRow: { display: 'flex', gap: '10px' },

  // 토스트 (미션 수락 완료!): y 689, 350×48, 회색 + 갈색 테두리
  toast: {
    position: 'absolute',
    left: '20px',
    right: '20px',
    top: '689px',
    height: '48px',
    borderRadius: '12px',
    background: GRAY_BG,
    border: `1.5px solid ${BROWN}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '15px',
    fontWeight: 500,
    color: '#000',
    zIndex: 30,
  },

  // ── E. 미션 뽑기 ──
  drawWrapper: { background: '#fff' },
  // 초록 원: 지름 321, x 34 · y 157
  circle: {
    position: 'absolute',
    left: '34px',
    top: '157px',
    width: '321px',
    height: '321px',
    borderRadius: '50%',
    background: SAGE,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    paddingTop: '52px',
    color: '#fff',
    textAlign: 'center',
  },
  circleTitle: { fontSize: '32px', fontWeight: 700, lineHeight: '38px' },
  circleSub: { fontSize: '20px', fontWeight: 400, lineHeight: '24px' },
  // 뽑은 미션 카드: x 20 · y 312, 350폭
  drawCard: {
    position: 'absolute',
    left: '20px',
    top: '312px',
    width: '350px',
    background: MINT,
    borderRadius: '16px',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
  },
  drawTitle: {
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
  info: { display: 'flex', alignItems: 'center', gap: '10px', color: BROWN },
  infoKey: { fontSize: '16px', fontWeight: 700, lineHeight: '19px' },
  infoValue: { fontSize: '15px', fontWeight: 400, lineHeight: '18px' },
  drawEmptyText: { fontSize: '16px', lineHeight: 1.5, color: '#000', textAlign: 'center' },
};
