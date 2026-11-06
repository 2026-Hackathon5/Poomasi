// 미션 만들기(E.3) 화면 스타일 — Figma "E. 미션 생성 - 공란"(116:1941) · "E. 미션 생성(위치인증)"(116:1823) 수치 그대로
import type { CSSProperties } from 'react';

const BROWN = '#4C3D34';

const box: CSSProperties = {
  width: '100%',
  background: '#fff',
  border: 'none',
  borderRadius: '16px',
  padding: '0 16px',
  fontSize: '16px',
  fontWeight: 500,
  color: '#000',
  outline: 'none',
};

export const cs: Record<string, CSSProperties> = {
  // 본문: y 117부터, 칸 사이 15, 아래 [미션 게시하기] 버튼 자리만큼 비움
  content: { padding: '26px 20px 118px', gap: '15px' },

  // 입력 칸: 라벨 13px Medium, 라벨과 칸 사이 10, 칸 높이 48 · 모서리 16 · 16px Medium
  field: { display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 },
  label: { fontSize: '13px', fontWeight: 500, lineHeight: '16px', color: '#000' }, // 칸 묶음 높이 16+10+48 = 74 (Figma)
  input: { ...box, height: '48px' },
  textarea: { ...box, minHeight: '48px', padding: '14px 16px', lineHeight: '20px', resize: 'none', display: 'block', overflow: 'hidden' },
  select: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer' },
  placeholder: { color: '#D9D9D9' },

  // 선택 버튼 (분야 · 인증 방식): 라벨과 사이 6, 버튼 사이 8, 높이 48, 15px Medium, 고르면 갈색
  chipField: { display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 },
  chipRow: { display: 'flex', gap: '8px' },
  chip: {
    flex: 1,
    height: '48px',
    border: 'none',
    borderRadius: '16px',
    background: '#fff',
    color: '#000',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  chipOn: { background: BROWN, color: '#fff' },

  // [미션 게시하기]: x 20 · y 746, 350×52, 모서리 30, 20px Bold. 다 채우기 전엔 갈색 30%
  submit: {
    position: 'absolute',
    left: '20px',
    right: '20px',
    top: '746px',
    height: '52px',
    border: 'none',
    borderRadius: '30px',
    background: BROWN,
    color: '#fff',
    fontSize: '20px',
    fontWeight: 700,
    cursor: 'pointer',
    zIndex: 10,
  },
  submitOff: { background: 'rgba(76,61,52,0.3)', cursor: 'not-allowed' },
};
