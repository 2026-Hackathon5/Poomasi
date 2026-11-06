// 랜덤 미션(E) 화면들이 같이 쓰는 작은 조각: 태그 · 아이콘 · 토스트
// 아이콘은 Figma 아이콘(akar-icons)과 같은 크기로 그림
import type { ReactNode } from 'react';
import type { CatalogMission } from '../types/mission';
import { VERIFY_TAG } from '../utils/mission';
import { rs } from '../styles/random';

export function MissionTags({ m, withVerify = true }: { m: CatalogMission; withVerify?: boolean }) {
  return (
    <div style={rs.tagRow}>
      <span style={rs.tag}>{m.country}</span>
      <span style={rs.tag}>{m.category}</span>
      {withVerify && <span style={rs.tag}>{VERIFY_TAG[m.verifyType]}</span>}
    </div>
  );
}

export function ChevronRight({ size = 24, color = '#6C6C6C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 7 L15 12 L10 17" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 8 L10 12 L14 8" fill="none" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CircleCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" fill="none" stroke="#000" strokeWidth="1.5" />
      <path d="M6 9.3 L8.2 11.4 L12.2 7" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div style={rs.toast} role="status">
      <CircleCheck />
      <span>{children}</span>
    </div>
  );
}
